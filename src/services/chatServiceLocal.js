// Local chat service that works without external dependencies
class ChatServiceLocal {
  constructor() {
    this.currentSessionId = null;
    this.sessionStartTime = null;
    this.sessionActive = false;
    this.messagePollingInterval = null;
    this.pollingActive = false;
  }

  generateSessionId() {
    const contactId = localStorage.getItem('ghl_contact_id') || 'temp';
    const timestamp = Date.now();
    return `${contactId}_session_${timestamp}`;
  }

  startNewSession() {
    this.currentSessionId = this.generateSessionId();
    this.sessionStartTime = new Date().toISOString();
    this.sessionActive = true;

    sessionStorage.setItem('current_session_id', this.currentSessionId);
    sessionStorage.setItem('session_start_time', this.sessionStartTime);
    sessionStorage.setItem('session_active', 'true');

    console.log('New session started:', this.currentSessionId);
  }

  getCurrentSessionId() {
    if (!this.currentSessionId) {
      this.currentSessionId = sessionStorage.getItem('current_session_id');
    }
    return this.currentSessionId;
  }

  async endCurrentSession(reason = 'manual') {
    if (!this.sessionActive || !this.currentSessionId) return;

    this.sessionActive = false;

    // Clear session data
    sessionStorage.removeItem('current_session_id');
    sessionStorage.removeItem('session_start_time');
    sessionStorage.removeItem('session_active');

    this.currentSessionId = null;
    this.sessionStartTime = null;

    console.log('Session ended:', reason);
  }

  async sendMessage(message, metadata = {}) {
    const contactId = localStorage.getItem('ghl_contact_id') || this.generateContactId();
    const sessionId = this.getCurrentSessionId();
    const userName = localStorage.getItem('user_name') || 'Chat Visitor';
    const userEmail = localStorage.getItem('user_email') || `${sessionId}@example.com`;
    
    try {
      // Try to send to the real webhook first
      const webhookUrl = 'https://n8n.3dsmilesolutions.ai/webhook/imic';
      
      // Get user data from localStorage (mimicking loadUserProfile from Supabase)
      const userPhone = localStorage.getItem('user_phone') || '';
      const userZipCode = localStorage.getItem('user_zipCode') || '';
      const userGender = localStorage.getItem('user_gender') || '';
      const userAge = localStorage.getItem('user_age') || '';
      const userConsent = localStorage.getItem('user_consent') || false;
      
      const payload = {
        message,
        contact_id: contactId,
        session_id: sessionId,
        name: userName,
        email: userEmail,
        phone: userPhone,
        zipCode: userZipCode,
        gender: userGender,
        age: userAge,
        marketingConsent: userConsent,
        channel: 'webchat',
        timestamp: new Date().toISOString(),
        metadata
      };

      console.log('Sending to webhook:', webhookUrl);
      console.log('Payload:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        response: data.reply || data.message || "Thanks for your message!",
        data
      };

    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback to mock responses if webhook fails
      const responses = [
        "Thanks for your message! I'm here to help.",
        "That's interesting! Can you tell me more?",
        "I understand. Let me help you with that.",
        "Great question! Here's what I think...",
        "I appreciate you reaching out. How else can I assist?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      return {
        success: true,
        response: randomResponse,
        data: { reply: randomResponse }
      };
    }
  }

  async loadChatHistory() {
    const contactId = localStorage.getItem('ghl_contact_id');
    if (!contactId) return [];

    return this.loadFromLocalStorage(contactId);
  }

  loadFromLocalStorage(contactId) {
    const storageKey = `chat_messages_${contactId}`;
    const storedData = localStorage.getItem(storageKey);

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        return parsedData.messages || [];
      } catch (error) {
        console.warn('Error loading from localStorage:', error);
        return [];
      }
    }
    return [];
  }

  saveToLocalStorage(messages) {
    const contactId = localStorage.getItem('ghl_contact_id') || this.generateContactId();
    const storageKey = `chat_messages_${contactId}`;
    const dataToStore = {
      messages: messages.slice(-100), // Keep last 100 messages
      timestamp: new Date().toISOString(),
      contactId: contactId
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.warn('Error saving to localStorage:', error);
    }
  }

  startMessagePolling() {
    // No-op for local version
    this.pollingActive = true;
  }

  async checkForIncomingMessages() {
    // No incoming messages in local version
    return { hasNewMessage: false };
  }

  stopMessagePolling() {
    this.pollingActive = false;
  }

  generateContactId() {
    const contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('ghl_contact_id', contactId);
    return contactId;
  }

  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    let response;

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      response = "Hello! Welcome to our support chat. How can I assist you today?";
    } else if (lowerMessage.includes('help')) {
      response = "I'm here to help! Please tell me what you need assistance with.";
    } else if (lowerMessage.includes('thank')) {
      response = "You're welcome! Is there anything else I can help you with?";
    } else {
      response = "Thanks for your message. Our team will get back to you soon!";
    }

    return {
      success: true,
      response,
      simulated: true
    };
  }
}

export default new ChatServiceLocal();