import React, { useState } from 'react';
// Using original chatConfig
import chatConfig from '../../config/chatConfig';

const ChatAuthFormSimple = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    console.log('ChatConfig webhook URL:', chatConfig.webhooks.formSubmit);
    if (onSubmit) onSubmit(formData);
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255, 255, 255, 0.98)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <h3>Simple Auth Form Test</h3>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{ display: 'block', margin: '10px 0', padding: '8px' }}
          />
          <input 
            type="email" 
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={{ display: 'block', margin: '10px 0', padding: '8px' }}
          />
          <button type="submit" style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAuthFormSimple;