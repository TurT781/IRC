import React, {useEffect, useRef} from "react";
import "../CSS/Messages.css";

const Messages = ({messages}) => {
  const messagesEndRef = useRef(null);

  const formatDate = (date) => {
    if (!date) return "";
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="messagesSection">
      <ul>
        {messages.map((message, index) => (
          message.type === 'notification' ? (
            <p key={index} className="notificationItem">
              <div className={`notificationContent ${message.isDisconnected ? 'disconnected' : ''}`}>
                <span>{message.msg}</span>
              </div>
            </p>
          ) : (
            <li key={index}>
              <strong>{message.sender || "Anonymous"}</strong>
              <div className="bubble">
                <p>{message.msg}</p>
              </div>
              <div>
                <small>{formatDate(message.timestamp)}</small>
              </div>
            </li>
          )
        ))}
      </ul>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default Messages;
//backup22.35