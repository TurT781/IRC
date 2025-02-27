import React, { useState, useEffect } from "react";
import { socket } from "../socket";
import Footer from "../components/Footer";
import Messages from "../components/Messages";
import "../CSS/Home.css";

function Home() {
  const [messages, setMessages] = useState([]);
  const [nickname, setNickname] = useState("Anonymous");

  useEffect(() => {
    const savedNickname = localStorage.getItem("nickname");
    if (savedNickname) {
      setNickname(savedNickname);
    }

    socket.on("connect", () => {
      if (savedNickname) {
        socket.emit("set_nickname", savedNickname);
      }
    });

    socket.on("nickname_updated", (newNickname, socketId) => {
      if (socket.id === socketId) {
        setNickname(newNickname);
        localStorage.setItem("nickname", newNickname);
      }
    });

    socket.on("chat message", (msg, sender, serverOffset) => {
      const timestamp = new Date();
      setMessages((prevMessages) => [
        ...prevMessages,
        { msg, sender, timestamp, type: 'message' }
      ]);
      socket.auth.serverOffset = serverOffset;
    });

    socket.on("user_notification", (content, serverOffset, isDisconnected = false) => {
      const timestamp = new Date();
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          msg: content,
          sender: 'System',
          timestamp,
          type: 'notification',
          isDisconnected: isDisconnected
        }
      ]);
      if (serverOffset) {
        socket.auth.serverOffset = serverOffset;
      }
    });

    socket.on("users_list", (userList) => {
      console.log("Users list received:", userList);
    });

    return () => {
      socket.off("chat message");
      socket.off("connect");
      socket.off("nickname_updated");
      socket.off("user_notification");
      socket.off("users_list");
    };
  }, []);

  const sendMessage = (message) => {
    if (message.startsWith("/users")) {
      socket.emit("chat message", message, `${socket.id}-${Date.now()}`, () => {
      });
    } else if (message.startsWith("/nickname ")) {
      const newNickname = message.split(" ")[1];
      if (newNickname) {
        socket.emit("set_nickname", newNickname);
        localStorage.setItem("nickname", newNickname);
      }
    } else {
      const clientOffset = `${socket.id}-${Date.now()}`;
      socket.emit("chat message", message, clientOffset, () => { });
    }
  };

  return (
    <main className="mainSection">
      <div className="textHome">
    {/* //TODO {serverName} for H1 */}
        <h1>Server 1</h1>
        <p>Connected as : <strong>{nickname}</strong></p>
      </div>
      <Messages messages={messages} />
      <Footer onSendMessage={sendMessage} />
    </main>
  );
}

export default Home;