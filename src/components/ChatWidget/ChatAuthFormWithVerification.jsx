import React, { useState, useEffect } from 'react';
import './ChatAuthForm.css';
import chatConfig from '../../config/chatConfig';

const ChatAuthFormWithVerification = ({ onSubmit, onClose }) => {
  const [step, setStep] = useState('form'); // 'form', 'verification', 'loading'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    zipCode: '',
    gender: '',
    age: '',
    customerType: '',
    marketingConsent: false
  });
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [consentError, setConsentError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    // Check if user data exists in localStorage for quick verification
    const existingData = {
      name: localStorage.getItem('user_name') || '',
      email: localStorage.getItem('user_email') || '',
      phone: localStorage.getItem('user_phone') || '',
      zipCode: localStorage.getItem('user_zipCode') || '',
      gender: localStorage.getItem('user_gender') || '',
      age: localStorage.getItem('user_age') || '',
      customerType: localStorage.getItem('user_customerType') || '',
    };
    
    const emailVerified = localStorage.getItem('email_verified');
    const verificationTimestamp = localStorage.getItem('verification_timestamp');
    const verificationAge = verificationTimestamp ? Date.now() - parseInt(verificationTimestamp) : Infinity;
    const maxAge = chatConfig.session.verificationValidityDuration || (12 * 60 * 60 * 1000); // Use config or default to 12 hours

    // If recently verified, show quick verification
    if (existingData.email && emailVerified && verificationAge < maxAge) {
      setStep('quick-verify');
      setFormData(prev => ({ ...prev, ...existingData }));
    } else if (existingData.email) {
      // Pre-populate form if we have data
      setFormData(prev => ({ ...prev, ...existingData }));
    }
  }, []);

  useEffect(() => {
    let interval;
    if (resendCooldown && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setResendCooldown(false);
      setResendTimer(60);
    }
    return () => clearInterval(interval);
  }, [resendCooldown, resendTimer]);

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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Store temp data for verification
      sessionStorage.setItem('temp_user_data', JSON.stringify(formData));
      
      // Submit to webhook
      const response = await fetch(chatConfig.webhooks.formSubmit, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          zipCode: formData.zipCode,
          gender: formData.gender,
          age: formData.age,
          customerType: formData.customerType,
          marketingConsent: formData.marketingConsent,
          source: 'react_chat_widget',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Email not found in our system.');
        setIsLoading(false);
        return;
      }

      // Store contact_id if returned (for verification response)
      if (data.contact_id) {
        sessionStorage.setItem('temp_contact_id', data.contact_id);
      }

      if (data.verification_sent) {
        // Move to verification step
        setStep('verification');
        setIsLoading(false);
      } else {
        setError('Unexpected response format.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Failed to submit form. Please try again.');
      console.error('Form submission error:', err);
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(chatConfig.webhooks.codeVerification || 'https://n8n.3dsmilesolutions.ai/webhook/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode
        })
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Invalid verification code. Please try again.');
        setVerificationCode('');
        setIsLoading(false);
        return;
      }

      // Verification successful - store data
      localStorage.setItem('ghl_contact_id', data.contact_id);
      localStorage.setItem('user_name', data.user_name || formData.name);
      localStorage.setItem('user_email', formData.email);
      localStorage.setItem('user_phone', formData.phone);
      localStorage.setItem('user_zipCode', formData.zipCode);
      localStorage.setItem('user_gender', formData.gender);
      localStorage.setItem('user_age', formData.age);
      localStorage.setItem('user_customerType', formData.customerType);
      localStorage.setItem('user_consent', formData.marketingConsent);
      localStorage.setItem('email_verified', 'true');
      localStorage.setItem('verification_timestamp', Date.now().toString());
      
      // Set session as active
      sessionStorage.setItem('chat_session_active', 'true');
      sessionStorage.setItem('chat-session-id', data.contact_id);

      // Call parent callback with complete data
      onSubmit({
        ...formData,
        contact_id: data.contact_id,
        session_id: data.session_id || data.contact_id,
        verified: true
      });
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error('Verification error:', err);
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown) return;
    
    setResendCooldown(true);
    setResendTimer(60);
    
    try {
      const response = await fetch(chatConfig.webhooks.formSubmit, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          resend: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.verification_sent) {
          // Show success message
          setError('');
        }
      }
    } catch (err) {
      console.error('Resend error:', err);
    }
  };

  const handleQuickVerify = () => {
    // User confirmed they are the same person
    sessionStorage.setItem('chat_session_active', 'true');
    
    // Call parent callback with existing data
    onSubmit({
      ...formData,
      contact_id: localStorage.getItem('ghl_contact_id'),
      verified: true,
      quickVerify: true
    });
  };

  const handleNotMe = () => {
    // Clear stored data and show form
    localStorage.removeItem('ghl_contact_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_phone');
    localStorage.removeItem('user_zipCode');
    localStorage.removeItem('user_gender');
    localStorage.removeItem('user_age');
    localStorage.removeItem('email_verified');
    localStorage.removeItem('verification_timestamp');
    
    setStep('form');
    setFormData({
      name: '',
      email: '',
      phone: '',
      zipCode: '',
      gender: '',
      age: '',
      marketingConsent: false
    });
  };

  // Quick verification screen
  if (step === 'quick-verify') {
    return (
      <div className="chat-auth-overlay">
        <div className="chat-auth-container">
          <div className="chat-auth-header">
            <h3>Welcome back! 👋</h3>
            <p>Continue as <strong>{formData.name}</strong>?</p>
          </div>
          
          <div className="verification-buttons">
            <button 
              className="form-submit-btn"
              onClick={handleQuickVerify}
            >
              Yes, that's me
            </button>
            <button 
              className="form-secondary-btn"
              onClick={handleNotMe}
            >
              No, I'm someone else
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verification code screen
  if (step === 'verification') {
    return (
      <div className="chat-auth-overlay">
        <div className="chat-auth-container">
          <div className="chat-auth-header">
            <h3>Check Your Email 📧</h3>
            <p>We sent a 6-digit code to <strong>{formData.email}</strong></p>
            <p className="verification-note">Enter the code to continue</p>
          </div>

          <form className="chat-auth-form" onSubmit={handleVerificationSubmit}>
            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setVerificationCode(value);
                  if (value.length === 6) {
                    // Auto-submit when 6 digits entered
                    setTimeout(() => {
                      document.getElementById('verification-form')?.requestSubmit();
                    }, 100);
                  }
                }}
                maxLength="6"
                placeholder="000000"
                pattern="[0-9]{6}"
                className="verification-input"
                required
                disabled={isLoading}
                autoComplete="one-time-code"
              />
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
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button 
              type="button"
              className="form-secondary-btn"
              onClick={handleResendCode}
              disabled={resendCooldown}
            >
              {resendCooldown ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
            </button>
          </form>

          {isLoading && (
            <div className="form-loading">
              <div className="loading-spinner"></div>
              <p>Verifying code...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="chat-auth-overlay">
      <div className="chat-auth-container">
        <div className="chat-auth-header">
          <h3>Let's get started!</h3>
          <p>Please provide your details to begin chatting</p>
        </div>

        <form className="chat-auth-form" onSubmit={handleFormSubmit}>
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="customerType">Customer Type *</label>
            <select
              id="customerType"
              name="customerType"
              value={formData.customerType}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            >
              <option value="">Select customer type</option>
              <option value="Authorized Dealer">Authorized Dealer</option>
              <option value="End Customer/Dental Professional">End Customer/Dental Professional</option>
              <option value="Prospective Customer seeking information">Prospective Customer seeking information</option>
            </select>
          </div>

          <div className="consent-group">
            <label className="consent-checkbox">
              <input
                type="checkbox"
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
              <span className="custom-checkbox"></span>
              <span className="consent-text">
                I consent to receive updates and information via text and email.
                Reply STOP to unsubscribe. *
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

export default ChatAuthFormWithVerification;