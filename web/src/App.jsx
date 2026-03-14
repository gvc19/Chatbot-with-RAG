import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow.jsx';
import ChatInput from './components/ChatInput.jsx';
import PdfUploader from './components/PdfUploader.jsx';
import api from './api/api.js';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (question) => {
    const userMessage = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.post('/chat', { question });
      const answer =
        response?.data?.answer ??
        response?.data?.response ??
        JSON.stringify(response.data);

      const assistantMessage = {
        role: 'assistant',
        content: answer
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, something went wrong while fetching the answer.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-root">
      <div className="app-container">
        <header className="app-header">
          <h1>PDF RAG Chatbot</h1>
          <p>Upload a PDF and chat with its contents.</p>
        </header>

        <PdfUploader />

        <div className="chat-section">
          <ChatWindow messages={messages} isLoading={isLoading} />
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default App;

