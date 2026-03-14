import React, { useEffect, useRef } from 'react';
import Message from './Message.jsx';

const ChatWindow = ({ messages, isLoading }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <div className="chat-window">
      {messages.length === 0 && (
        <div className="chat-empty">Ask a question about your PDF to get started.</div>
      )}
      {messages.map((msg, index) => (
        <Message key={index} role={msg.role} content={msg.content} />
      ))}
      {isLoading && (
        <div className="chat-loading">Thinking...</div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;

