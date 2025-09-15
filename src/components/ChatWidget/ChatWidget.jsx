import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatAuthFormWithVerification from './ChatAuthFormWithVerification';
import AvatarDisplay from './AvatarDisplay';
import chatService from '../../services/chatService'; // Use the real Supabase service
import heygenService from '../../services/heygenService';
import chatConfig from '../../config/chatConfig';
import './ChatWidget.css';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [messagePrompt, setMessagePrompt] = useState('Message me 💬');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Save messages to localStorage whenever they change
    if (messages.length > 0) {
      chatService.saveToLocalStorage(messages);
    }
  }, [messages]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const userEmail = localStorage.getItem('user_email');
      const userName = localStorage.getItem('user_name');
      const contactId = localStorage.getItem('ghl_contact_id');
      const emailVerified = localStorage.getItem('email_verified');
      const verificationTimestamp = localStorage.getItem('verification_timestamp');
      
      // Check if verification is still valid
      const hasVerification = verificationTimestamp && !isNaN(parseInt(verificationTimestamp));
      const verificationAge = hasVerification ? Date.now() - parseInt(verificationTimestamp) : null;
      const maxAge = chatConfig.session.verificationValidityDuration || (12 * 60 * 60 * 1000);
      
      console.log('Auth Check:', {
        hasEmail: !!userEmail,
        hasName: !!userName,
        hasContactId: !!contactId,
        isVerified: !!emailVerified,
        hasVerification: hasVerification,
        verificationAge: verificationAge !== null ? Math.floor(verificationAge / 1000) + ' seconds' : 'not set',
        maxAge: Math.floor(maxAge / 1000) + ' seconds',
        isExpired: verificationAge !== null && verificationAge >= maxAge
      });
      
      // Only set authenticated if all conditions are met AND verification is still valid
      if (userEmail && userName && contactId && emailVerified && hasVerification && verificationAge < maxAge) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        // Clear the expired verification status
        if (verificationAge !== null && verificationAge >= maxAge) {
          localStorage.removeItem('email_verified');
          localStorage.removeItem('verification_timestamp');
          sessionStorage.removeItem('chat_session_active');
        }
      }
    };
    
    checkAuth();
  }, []);

  // Initialize chat and load history
  useEffect(() => {
    const initChat = async () => {
      // Only initialize if authenticated
      if (!isAuthenticated) return;
      
      // Check if we already have an active session before starting a new one
      const existingSessionId = sessionStorage.getItem('current_session_id');
      if (!existingSessionId || !chatService.sessionActive) {
        // Only start a new session if there isn't one already
        chatService.startNewSession();
      } else {
        console.log('Using existing session:', existingSessionId);
      }
      
      // Load chat history from Supabase or localStorage
      const history = await chatService.loadChatHistory();
      if (history && history.length > 0) {
        const formattedMessages = history.map(msg => ({
          id: msg.id || Date.now() + Math.random(),
          content: msg.message || msg.content,
          sender: msg.sender,
          timestamp: msg.created_at || msg.timestamp
        }));
        setMessages(formattedMessages);
      } else {
        // Add welcome message only if no history exists
        const userName = localStorage.getItem('user_name');
        const firstName = userName ? userName.split(' ')[0] : '';
        setMessages([{
          id: Date.now() + Math.random(),
          content: `Hi ${firstName}! 👋 How can I help you today?`,
          sender: 'bot',
          timestamp: new Date().toISOString()
        }]);
      }
      
      // Start polling for incoming messages
      chatService.startMessagePolling();
    };

    initChat();

    // Cleanup only on actual component unmount, not on isAuthenticated change
    return () => {
      chatService.stopMessagePolling();
      // Don't end session here - it causes issues when isAuthenticated changes
    };
  }, [isAuthenticated]);
  
  // End session only on actual component unmount
  useEffect(() => {
    return () => {
      // This will only run when the component is actually unmounting
      if (chatService.sessionActive) {
        chatService.endCurrentSession('component_unmount');
      }
    };
  }, []); // Empty dependency array means this only runs on mount/unmount

  // Poll for incoming messages
  useEffect(() => {
    if (isOpen) {
      pollingIntervalRef.current = setInterval(async () => {
        const result = await chatService.checkForIncomingMessages();
        if (result && result.hasNewMessage) {
          addMessage(result.message, 'bot', result.timestamp);
        }
      }, 2000);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isOpen]);

  const addMessage = (content, sender, timestamp = null) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      content,
      sender,
      timestamp: timestamp || new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Update prompt for new bot messages when chat is closed
    if (sender === 'bot' && !isOpen) {
      setMessagePrompt('New message! 💬');
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message
    addMessage(message, 'user');

    // Show typing indicator
    setIsTyping(true);

    try {
      // Send message to backend through n8n webhook
      const result = await chatService.sendMessage(message, {
        messageCount: messages.length,
        isOpen: isOpen
      });

      // Add bot response(s)
      if (result.success) {
        // Handle array of messages (multiple responses)
        if (Array.isArray(result.response)) {
          for (const msg of result.response) {
            addMessage(msg, 'bot');
            
            // Make avatar speak if enabled and no error
            if (chatConfig.features.enableAvatar && !avatarError) {
              try {
                await heygenService.speak(msg);
              } catch (err) {
                console.error('Avatar speak error:', err);
                setAvatarError(true);
              }
            }
            
            // Small delay between multiple messages for better UX
            if (result.response.indexOf(msg) < result.response.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } else {
          addMessage(result.response, 'bot');
          
          // Make avatar speak if enabled and no error
          if (chatConfig.features.enableAvatar && !avatarError) {
            try {
              await heygenService.speak(result.response);
            } catch (err) {
              console.error('Avatar speak error:', err);
              setAvatarError(true);
            }
          }
        }
      } else {
        addMessage(result.response || "Sorry, I couldn't process your message. Please try again.", 'bot');
      }

    } catch (error) {
      console.error('Error handling message:', error);
      addMessage("I'm having trouble connecting. Please check your internet connection and try again.", 'bot');
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    
    if (newOpenState) {
      // Check if user is authenticated
      if (!isAuthenticated) {
        setShowAuthForm(true);
      } else {
        // Start message polling when chat opens
        chatService.startMessagePolling();
        
        // Show avatar if enabled
        if (chatConfig.features.enableAvatar) {
          setShowAvatar(true);
        }
      }
    } else {
      // Stop polling when chat closes
      chatService.stopMessagePolling();
      setShowAuthForm(false);
      
      // Hide avatar
      setShowAvatar(false);
    }
    
    if (!newOpenState && messagePrompt !== 'Message me 💬') {
      setMessagePrompt('Message me 💬');
    }
  };

  const handleAuthSubmit = async (userData) => {
    // Store contact_id and session_id from n8n response
    if (userData.contact_id) {
      localStorage.setItem('ghl_contact_id', userData.contact_id);
      sessionStorage.setItem('chat-session-id', userData.session_id || userData.contact_id);
    }
    
    // Save user profile to Supabase
    if (userData.verified && !userData.quickVerify) {
      await chatService.saveUserProfile(userData);
    }
    
    // Set authenticated status
    setIsAuthenticated(true);
    setShowAuthForm(false);
    
    // Initialize chat after authentication with the session from n8n
    chatService.startNewSession(userData.session_id || userData.contact_id);
    
    // Add personalized welcome message
    const firstName = userData.name ? userData.name.split(' ')[0] : '';
    const welcomeMessage = userData.quickVerify 
      ? `Welcome back, ${firstName}! 👋 Great to see you again. How can I help you today?`
      : `Hi ${firstName}! 👋 Thanks for verifying your information. How can I help you today?`;
    
    setMessages([{
      id: Date.now() + Math.random(),
      content: welcomeMessage,
      sender: 'bot',
      timestamp: new Date().toISOString()
    }]);
    
    // Start polling for messages
    chatService.startMessagePolling();
  };

  const handleAuthClose = () => {
    setShowAuthForm(false);
    setIsOpen(false);
  };

  return (
    <div className="chat-widget">
      {/* Backdrop */}
      <div 
        className={`chat-backdrop ${isOpen ? 'active' : ''}`}
        onClick={toggleChat}
      />

      {/* Message Prompt */}
      <div 
        className={`message-prompt ${isOpen ? 'hidden' : ''}`}
        onClick={toggleChat}
      >
        {messagePrompt}
      </div>

      {/* Chat Button */}
      <button 
        className="chat-button"
        onClick={toggleChat}
        aria-label="Toggle chat"
      >
        <svg className="chat-icon" viewBox="0 0 24 24">
          <path d="M12 3c5.5 0 10 3.58 10 8s-4.5 8-10 8c-1.24 0-2.43-.18-3.53-.5C5.55 21 2 21 2 21c2.33-2.33 2.7-3.9 2.75-4.5C3.05 15.07 2 13.13 2 11c0-4.42 4.5-8 10-8z"/>
          <circle cx="8" cy="11" r="1"/>
          <circle cx="12" cy="11" r="1"/>
          <circle cx="16" cy="11" r="1"/>
        </svg>
      </button>

      {/* Chat Window */}
      <div className={`chat-window ${isOpen ? 'active' : ''}`}>
        {/* Auth Form Overlay */}
        {showAuthForm && (
          <ChatAuthFormWithVerification 
            onSubmit={handleAuthSubmit}
            onClose={handleAuthClose}
          />
        )}

        {/* Split Layout - Only show if authenticated */}
        {!showAuthForm && (
          <div className="chat-window-content">
            {/* Left Panel - Avatar Video */}
            <div className="avatar-panel">
              {showAvatar && chatConfig.features.enableAvatar && !avatarError && (
                <AvatarDisplay 
                  isVisible={showAvatar}
                  onError={(err) => {
                    console.error('Avatar error:', err);
                    setAvatarError(true);
                  }}
                />
              )}
              {(!showAvatar || !chatConfig.features.enableAvatar || avatarError) && (
                <div className="avatar-placeholder">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="#666">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <p style={{color: '#999', marginTop: '20px'}}>Support Agent</p>
                </div>
              )}
            </div>

            {/* Right Panel - Chat Interface */}
            <div className="chat-panel">
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
                {messages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isTyping && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <ChatInput onSendMessage={handleSendMessage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;