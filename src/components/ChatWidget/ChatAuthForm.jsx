import React, { useState, useEffect } from 'react';
import './ChatAuthForm.css';
import chatConfig from '../../config/chatConfig';

const ChatAuthForm = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    zipCode: '',
    gender: '',
    age: '',
    marketingConsent: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [consentError, setConsentError] = useState(false);

  useEffect(() => {
    // Check if user data exists in localStorage
    const existingData = {
      name: localStorage.getItem('user_name') || '',
      email: localStorage.getItem('user_email') || '',
      phone: localStorage.getItem('user_phone') || '',
      zipCode: localStorage.getItem('user_zipCode') || '',
      gender: localStorage.getItem('user_gender') || '',
      age: localStorage.getItem('user_age') || '',
    };

    // If we have existing data, auto-populate the form
    if (existingData.email) {
      setFormData(prev => ({ ...prev, ...existingData }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'marketingConsent') {
      setConsentError(false);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const validateForm = () => {
    if (!formData.marketingConsent) {
      setConsentError(true);
      setError('You must consent to continue');
      return false;
    }

    // Basic validation
    const phoneRegex = /^(\+1\s?)?(\([0-9]{3}\)|[0-9]{3})[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$/;
    const zipRegex = /^\d{5}(-\d{4})?$/;

    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }

    if (!zipRegex.test(formData.zipCode)) {
      setError('Please enter a valid ZIP code');
      return false;
    }

    if (formData.age && (formData.age < 1 || formData.age > 120)) {
      setError('Please enter a valid age');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Store user data in localStorage
      localStorage.setItem('user_name', formData.name);
      localStorage.setItem('user_email', formData.email);
      localStorage.setItem('user_phone', formData.phone);
      localStorage.setItem('user_zipCode', formData.zipCode);
      localStorage.setItem('user_gender', formData.gender);
      localStorage.setItem('user_age', formData.age);
      localStorage.setItem('user_consent', formData.marketingConsent);

      // Generate a unique contact ID if not exists
      let contactId = localStorage.getItem('ghl_contact_id');
      if (!contactId) {
        contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('ghl_contact_id', contactId);
      }

      // Submit to webhook if configured
      if (chatConfig.webhooks.formSubmit !== 'https://your-n8n-instance.com/webhook/form-submit') {
        const response = await fetch(chatConfig.webhooks.formSubmit, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            contact_id: contactId,
            timestamp: new Date().toISOString(),
            source: 'react_chat_widget'
          })
        });

        if (!response.ok) {
          throw new Error('Form submission failed');
        }
      }

      // Call parent callback with user data
      onSubmit(formData);
    } catch (err) {
      setError('Failed to submit form. Please try again.');
      console.error('Form submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-auth-overlay">
      <div className="chat-auth-container">
        <div className="chat-auth-header">
          <h3>Let's get started!</h3>
          <p>Please provide your details to begin chatting</p>
        </div>

        <form className="chat-auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group half-width">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                required
                placeholder="(555) 123-4567"
                pattern="^(\+1\s?)?(\([0-9]{3}\)|[0-9]{3})[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$"
              />
            </div>
            <div className="form-group half-width">
              <label htmlFor="zipCode">Zip Code *</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                required
                placeholder="12345"
                pattern="^\d{5}(-\d{4})?$"
                maxLength="10"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="gender">Identify as... *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-Binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-group half-width">
              <label htmlFor="age">Age *</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                required
                placeholder="Enter your age"
                min="1"
                max="120"
              />
            </div>
          </div>

          <div className="consent-group">
            <label className="consent-checkbox">
              <input
                type="checkbox"
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleInputChange}
                required
              />
              <span className="custom-checkbox"></span>
              <span className="consent-text">
                I consent to receive appointment reminders and updates via text and email. 
                My data is secured under HIPAA. Reply STOP to unsubscribe. *
              </span>
            </label>
            {consentError && (
              <div className="consent-error">You must consent to continue</div>
            )}
            <div className="consent-disclaimer">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>

          {error && (
            <div className="form-error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="form-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Setting up chat...' : 'Start Chat'}
          </button>
        </form>

        {isLoading && (
          <div className="form-loading">
            <div className="loading-spinner"></div>
            <p>Setting up your chat...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatAuthForm;