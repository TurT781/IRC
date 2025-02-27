# **IRC Project - WebSockets, React, Node.js & MongoDB** 🚀

## **Project Description**
✍ **To be completed:** Explain in a few sentences the purpose of the project and what it allows users to do.

## **Technologies Used** 💻
- **Front-end:** React
- **Back-end:** Node.js with WebSockets
- **Database:** MongoDB with Mongoose

## **Features** ✨
- **Real-time messaging** with WebSockets
- **User management** with Mongoose
- **Commands:**
  - `/nickname <new_name>`: Change your username
  - `/users`: View the list of connected users
- **Messenger-like interface** with:
  - Text input area
  - "Send" button
  - "Quit" button
  - Command handling via input

## **Installation and Startup** 🔧

### **1. Clone the project**
```bash
git clone <REPO_URL>
cd irc
```
### **2. Database Setup**
*Open a new terminal (keep it open)*

```bash
mongosh chat
db.messages.deleteMany({}) # if you want to delete all messages from the database
```

### **3. Server Setup**
*Open a new terminal (keep it open)*

```bash
cd node_server
npm install
node index.js
```

### **4. Start the frontend**
*Open a new terminal (keep it open)*

```bash
cd ../react_front
npm install
npm run build
```
## Future Improvements: 
- Improve the message design by splitting the screen to separate the sender and receiver sections.

## Author:
- Flavien Patriarca