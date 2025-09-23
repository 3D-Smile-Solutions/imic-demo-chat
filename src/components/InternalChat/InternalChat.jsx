import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './InternalChat.css';

const InternalChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [streamingMessage, setStreamingMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Generate or retrieve session ID on component mount
  useEffect(() => {
    // Check if there's an existing session in sessionStorage
    let existingSessionId = sessionStorage.getItem('internalChatSessionId');

    if (!existingSessionId) {
      // Generate a new session ID
      existingSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('internalChatSessionId', existingSessionId);
    }

    setSessionId(existingSessionId);

    // Load existing messages for this session
    const savedMessages = localStorage.getItem(`chat_messages_${existingSessionId}`);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (e) {
        console.error('Error loading saved messages:', e);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputMessage]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('https://n8n.3dsmilesolutions.ai/webhook/db69b921-bbc9-4be8-8428-49f9a123ad4b/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput: userMessage,
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
          stream: true // Request streaming if supported
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response is streaming
      const contentType = response.headers.get('content-type');
      const isStreaming = contentType?.includes('text/event-stream') ||
                         contentType?.includes('application/x-ndjson') ||
                         contentType?.includes('text/plain') && response.headers.get('transfer-encoding') === 'chunked';

      if (isStreaming && response.body) {
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let buffer = '';

        // Create initial bot message
        const botMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isStreaming: true
        };

        setStreamingMessage(botMessage);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process complete lines from buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.trim()) {
                let processed = false;

                // Try SSE format first
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') continue;

                  try {
                    // Try to parse data as JSON
                    const parsed = JSON.parse(data);
                    if (parsed.output) {
                      accumulatedContent += parsed.output;
                      processed = true;
                    } else if (parsed.delta) {
                      accumulatedContent += parsed.delta;
                      processed = true;
                    } else if (parsed.content) {
                      accumulatedContent += parsed.content;
                      processed = true;
                    } else if (typeof parsed === 'string') {
                      accumulatedContent += parsed;
                      processed = true;
                    }
                  } catch (e) {
                    // If not JSON, use as plain text
                    accumulatedContent += data;
                    processed = true;
                  }
                }

                // Try parsing as JSON directly
                if (!processed) {
                  try {
                    const parsed = JSON.parse(line);
                    if (parsed.output) {
                      accumulatedContent += parsed.output;
                      processed = true;
                    } else if (parsed.delta) {
                      accumulatedContent += parsed.delta;
                      processed = true;
                    } else if (parsed.content) {
                      accumulatedContent += parsed.content;
                      processed = true;
                    } else if (typeof parsed === 'string') {
                      accumulatedContent += parsed;
                      processed = true;
                    }
                  } catch (e) {
                    // If not JSON and not SSE, might be plain text
                    if (!line.startsWith('event:') && !line.startsWith('id:') && !line.startsWith('retry:')) {
                      accumulatedContent += line;
                      processed = true;
                    }
                  }
                }

                // Update streaming message if we processed content
                if (processed && accumulatedContent) {
                  setStreamingMessage(prev => ({
                    ...prev,
                    content: accumulatedContent
                  }));
                }
              }
            }
          }

          // Process any remaining buffer content
          if (buffer.trim()) {
            if (buffer.startsWith('data: ')) {
              const data = buffer.slice(6).trim();
              if (data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.output) accumulatedContent += parsed.output;
                  else if (parsed.delta) accumulatedContent += parsed.delta;
                  else if (parsed.content) accumulatedContent += parsed.content;
                } catch {
                  accumulatedContent += data;
                }
              }
            }
          }
        } catch (streamError) {
          throw streamError;
        } finally {
          // Finalize the message
          if (accumulatedContent) {
            const finalMessage = {
              ...botMessage,
              content: accumulatedContent,
              isStreaming: false
            };
            setMessages(prev => [...prev, finalMessage]);
          } else {
            // If no content was accumulated, show error
            const errorMessage = {
              id: Date.now() + 1,
              role: 'assistant',
              content: 'Received an empty response. Please try again.',
              timestamp: new Date().toISOString(),
              error: true
            };
            setMessages(prev => [...prev, errorMessage]);
          }
          setStreamingMessage(null);
        }
      } else {
        // Handle non-streaming response
        // Get response as text first to handle potential formatting issues
        const responseText = await response.text();

        let data;
        try {
          // Try to parse as JSON
          data = JSON.parse(responseText);
        } catch (parseError) {

          // Check if this is newline-delimited JSON (NDJSON)
          const lines = responseText.split('\n').filter(line => line.trim());
          let accumulatedContent = '';
          let isNDJSON = false;

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);

              // Handle n8n streaming format
              if (parsed.type === 'item' && parsed.content) {
                accumulatedContent += parsed.content;
                isNDJSON = true;
              } else if (parsed.type === 'begin' || parsed.type === 'end') {
                // Skip begin/end markers
                isNDJSON = true;
                continue;
              } else if (parsed.output) {
                accumulatedContent += parsed.output;
                isNDJSON = true;
              }
            } catch (e) {
              // Line is not valid JSON, skip it
            }
          }

          if (isNDJSON && accumulatedContent) {
            data = { output: accumulatedContent };
          } else {
            // Try to extract the first valid JSON object from the text
            const jsonMatch = responseText.match(/(\{.*?\})/s);
            if (jsonMatch) {
              try {
                data = JSON.parse(jsonMatch[1]);
              } catch (e) {
                // Fallback: treat entire response as text
                data = { output: responseText };
              }
            } else {
              // No JSON found, treat as plain text response
              data = { output: responseText };
            }
          }
        }

        // Parse the response - handle {output: "..."} format
        let botReply = '';

        if (typeof data === 'string') {
          botReply = data;
        } else if (data.output) {
          // Handle the {output: "..."} format
          botReply = data.output;
        } else if (Array.isArray(data) && data.length > 0) {
          // Handle split_json format
          if (data[0].split_json) {
            try {
              const parsed = JSON.parse(data[0].split_json);
              botReply = Object.values(parsed).join(' ');
            } catch {
              botReply = data[0].split_json;
            }
          } else if (data[0].message) {
            botReply = data[0].message;
          } else if (data[0].reply) {
            botReply = data[0].reply;
          } else if (data[0].output) {
            botReply = data[0].output;
          } else {
            botReply = JSON.stringify(data[0]);
          }
        } else if (data.message) {
          botReply = data.message;
        } else if (data.reply) {
          botReply = data.reply;
        } else {
          botReply = JSON.stringify(data);
        }

        // Add bot message
        const botMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: botReply,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your message. Please try again.',
          timestamp: new Date().toISOString(),
          error: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      setStreamingMessage(null);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="internal-chat-container">
      <div className="internal-chat-sidebar">
        <button className="new-chat-button" onClick={() => {
          if (confirm('Start a new chat? Current conversation will be saved.')) {
            // Generate new session ID
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            sessionStorage.setItem('internalChatSessionId', newSessionId);
            setSessionId(newSessionId);
            setMessages([]);
            setStreamingMessage(null);
          }
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New chat
        </button>
        <div className="chat-history">
          <div className="chat-history-item active">
            Current Conversation
          </div>
        </div>
      </div>

      <div className="internal-chat-main">
        <div className="internal-chat-header">
          <h1>Internal Chat</h1>
        </div>

        <div className="internal-chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <h2>How can I help you today?</h2>
              <p>Start a conversation by typing a message below.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`chat-message-wrapper ${message.role}`}>
                <div className="chat-message">
                  <div className="message-avatar">
                    {message.role === 'user' ? 'U' : 'AI'}
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                    {message.role === 'assistant' ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                    <div className="message-time">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
          {streamingMessage && (
            <div className="chat-message-wrapper assistant">
              <div className="chat-message">
                <div className="message-avatar">AI</div>
                <div className="message-content">
                  <div className="message-text">
                    <ReactMarkdown>{streamingMessage.content || '...'}</ReactMarkdown>
                  </div>
                  {streamingMessage.content && (
                    <div className="message-time">{formatTime(streamingMessage.timestamp)}</div>
                  )}
                </div>
              </div>
            </div>
          )}
          {isLoading && !streamingMessage && (
            <div className="chat-message-wrapper assistant">
              <div className="chat-message">
                <div className="message-avatar">AI</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="internal-chat-input-container">
          <div className="internal-chat-input-wrapper">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Send a message..."
              className="internal-chat-input"
              rows="1"
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="internal-chat-send-button"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.925 5.025L9.18333 8.15417L2.91667 7.05833L2.925 5.025ZM9.175 11.8458L2.91667 14.975V12.9417L9.175 11.8458ZM1.25833 2.5L1.25 8.33333L13.75 10L1.25 11.6667L1.25833 17.5L18.75 10L1.25833 2.5Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <div className="input-helper-text">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternalChat;