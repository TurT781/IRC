const express = require('express');
const cors = require('cors');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { availableParallelism } = require('node:os');
const cluster = require('node:cluster');
const { createAdapter, setupPrimary } = require('@socket.io/cluster-adapter');

//listen on many ports
if (cluster.isPrimary) {
  const numCPUs = availableParallelism();
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({ PORT: 3000 + i });
  }
  setupPrimary();
  return;
}
//connection to mongoDb
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat';

  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB');
      return;
    } catch (err) {
      console.error(`MongoDB connection error: ${err.message}`);
      retries -= 1;
      console.log(`Retries left: ${retries}`);

      const delay = (5 - retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error('Failed to connect to MongoDB after multiple retries');
  process.exit(1);
}

//save the messages in the db
const messageSchema = new mongoose.Schema({
  client_offset: { type: String },
  content: String,
  sender: { type: String, default: 'Anonymous' },
  type: { type: String, default: 'message' },
  isDisconnected: { type: Boolean, default: false }
});

const Message = mongoose.model('Message', messageSchema);

async function main() {
  await connectDB();

  //Cors Origin
  const app = express();
  app.use(cors({
    origin: '*',
    credentials: true
  }));

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });

  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.engine.on("headers", (headers, req) => {
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "GET, POST";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Allow-Credentials"] = "true";
  });

  io.adapter(createAdapter());
  app.use(express.static(join(__dirname, '../react_front/build')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../react_front/build/index.html'));
  });

  let users = {};

  io.on('connection', async (socket) => {
    console.log(`Worker ${process.pid} - Client connected: ${socket.id}`);
    
    //default user => anonymous
    users[socket.id] = { nickname: "Anonymous" };

    const connectMessage = `${users[socket.id].nickname} is connected`;

    const newNotification = new Message({
      content: connectMessage,
      sender: 'System',
      type: 'notification',
      isDisconnected: false
    });
    await newNotification.save();

    //send a notification to all users connected at the server
    io.emit('user_notification', connectMessage, newNotification._id, false);

    // Gestionnaire pour obtenir la liste des utilisateurs
    socket.on('get_users', (callback) => {
      try {
        const userList = Object.values(users).map(user => user.nickname);
        if (callback && typeof callback === 'function') {
          callback(userList);
        } else {
          socket.emit('users_list', userList);
        }
      } catch (e) {
        console.error("Error getting users list:", e);
        if (callback && typeof callback === 'function') {
          callback([]);
        }
      }
    });

    socket.on('set_nickname', (newNickname) => {
      if (typeof newNickname === 'string' && newNickname.trim() !== '') {
        const oldNickname = users[socket.id].nickname;
        users[socket.id] = { nickname: newNickname.trim() };
        
        //send a message to all users that someone has chnaged his name
        io.emit('nickname_updated', newNickname, socket.id);
        if (oldNickname !== "Anonymous" || newNickname !== oldNickname) {
          const nicknameChangeMsg = `${oldNickname} changed is name by : ${newNickname}`;

          //save the new nickname in the database
          const changeNotification = new Message({
            content: nicknameChangeMsg,
            sender: 'System',
            type: 'notification',
            isDisconnected: false
          });

          changeNotification.save().then(savedNotification => {
            io.emit('user_notification', nicknameChangeMsg, savedNotification._id, false);
          });
        }
      }
    });

    socket.on('chat message', async (msg, clientOffset, callback) => {
      try {
        //commands Users
        if (msg.startsWith('/users')) {
          // Créer la liste des utilisateurs connectés
          const userList = Object.values(users).map(user => user.nickname);
          const userListMessage = `Users connected: ${userList.join(', ')}`;
          
          //saving that in the db
          const newNotification = new Message({
            content: userListMessage,
            sender: 'System',
            type: 'notification',
            isDisconnected: false
          });
          await newNotification.save();
          
          //emit the notif at the user who wrote the commands
          socket.emit('user_notification', userListMessage, newNotification._id, false);

          if (callback && typeof callback === 'function') {
            callback();
          }
          return;
        }
        
        //commands nickname
        if (msg.startsWith('/nickname ')) {
          const newNickname = msg.split(' ')[1];
          socket.emit('set_nickname', newNickname);
          return;
        }

        const senderNickname = users[socket.id]?.nickname || 'Anonymous';

        const newMessage = new Message({
          content: msg,
          client_offset: clientOffset,
          sender: senderNickname,
          type: 'message'
        });
        await newMessage.save();

        io.emit('chat message', msg, senderNickname, newMessage._id);

        if (callback && typeof callback === 'function') {
          callback();
        }
      } catch (e) {
        console.error("Error MongoDB:", e);
        if (e.code === 11000 && typeof callback === 'function') {
          callback();
        }
      }
    });

    socket.on('disconnect', async () => {
      const nickname = users[socket.id]?.nickname || "Anonymous";
      console.log(`User ${nickname} disconnected.`);

      //notification of deconnection 
      const disconnectMessage = `User ${nickname} has disconnected`;
      const newNotification = new Message({
        content: disconnectMessage,
        sender: 'System',
        type: 'notification',
        isDisconnected: true
      });
      await newNotification.save();
      //then send it to the users who left the serveer
      io.emit('user_notification', disconnectMessage, newNotification._id, true);

      delete users[socket.id];
    });

    if (!socket.recovered) {
      try {
        let serverOffset = socket.handshake.auth.serverOffset;
        if (serverOffset) {
          try {
            serverOffset = new mongoose.Types.ObjectId(serverOffset);
          } catch (error) {
            console.error("Invalid ObjectId format:", serverOffset);
            serverOffset = null;
          }
        }

        const query = serverOffset ? { _id: { $gt: serverOffset } } : {};
        const messages = await Message.find(query);
        messages.forEach((row) => {
          if (row.type === 'notification') {
            socket.emit('user_notification', row.content, row._id, row.isDisconnected || false);
          } else {
            socket.emit('chat message', row.content, row.sender || 'Anonymous', row._id);
          }
        });
      } catch (e) {
        console.error(e);
      }
    }
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

main();