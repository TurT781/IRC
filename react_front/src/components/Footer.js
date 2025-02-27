import React, { useState, useEffect } from "react";
import { socket } from "../socket";
import { NavLink } from "react-router-dom";
import "../CSS/Footer.css";

const Footer = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Vérifier l'état initial
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  const handleConnectionToggle = () => {
    if (isConnected) {
      // Déconnexion
      socket.disconnect();
    } else {
      // Connexion
      socket.connect();
    }
    // L'état isConnected sera mis à jour par les événements socket
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() !== "" && isConnected) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <footer className="footer">
      <button 
        className={`leavingButton ${isConnected ? "connected" : "disconnected"}`}
        onClick={handleConnectionToggle}
      >
        {isConnected ? "Leave" : "Join"}
      </button>
      <form id="form" onSubmit={handleSendMessage} className="formFooter">
        <input
          id="input"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isConnected ? "Type your message ..." : "You have to 'Join' the chat to type your message ..."}
          autoComplete="off"
          disabled={!isConnected}
        />
        <button type="submit" disabled={!isConnected}>Submit</button>
        <NavLink to="/commands">
          <button type="button">Commands</button>
        </NavLink>
      </form>
    </footer>
  );
};

export default Footer;
//backup22.35