import React, { useState, useEffect, useRef } from 'react';
// Test which import is causing the issue
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
// import ChatAuthForm from './ChatAuthForm';
import ChatAuthFormSimple from './ChatAuthFormSimple';
import chatService from '../../services/chatServiceLocal';
import './ChatWidget.css';

const ChatWidgetTest = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showAuthForm, setShowAuthForm] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="chat-widget">
      {/* Chat Button */}
      <button 
        className="chat-button"
        onClick={toggleChat}
        aria-label="Toggle chat"
      >
        <svg className="chat-icon" viewBox="0 0 24 24">
          <path d="M12 3c5.5 0 10 3.58 10 8s-4.5 8-10 8c-1.24 0-2.43-.18-3.53-.5C5.55 21 2 21 2 21c2.33-2.33 2.7-3.9 2.75-4.5C3.05 15.07 2 13.13 2 11c0-4.42 4.5-8 10-8z"/>
        </svg>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window active">
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="chat-title">Customer Support</div>
              <div className="chat-subtitle">We're here to help!</div>
            </div>
            <button className="close-btn" onClick={toggleChat}>
              ×
            </button>
          </div>
          
          <div className="chat-messages">
            <div>Testing ChatWidget - Basic structure works!</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidgetTest;