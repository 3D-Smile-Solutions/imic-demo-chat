import React, { useState } from 'react';

// Simple debug version to test if the issue is with imports
const ChatWidgetDebug = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  console.log('ChatWidgetDebug rendering, isOpen:', isOpen);
  
  return (
    <>
      {/* Chat Button */}
      <button 
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#3b82f6',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        💬
      </button>
      
      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          width: '350px',
          height: '500px',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '15px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Chat Widget (Debug Mode)</span>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ padding: '20px', flex: 1 }}>
            <p>Debug Chat Widget is working!</p>
            <p>No complex imports or dependencies.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidgetDebug;