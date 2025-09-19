import chatConfig from '../config/chatConfig.js';

class ChatService {
  constructor() {
    try {
      // Load configuration from config file
      this.webhookUrl = chatConfig.webhooks.chat;
      this.formWebhookUrl = chatConfig.webhooks.formSubmit;
      this.metricsWebhookUrl = chatConfig.webhooks.metrics;
      
      // Supabase configuration
      this.supabaseUrl = chatConfig.supabase.url;
      this.supabaseKey = chatConfig.supabase.anonKey;
      
      // Initialize Supabase client
      this.supabase = null;
      this.isSupabaseEnabled = false;
      this.supabaseInitialized = false;
      
      // Only init Supabase if enabled
      if (chatConfig.features && chatConfig.features.enableSupabase) {
        this.initSupabase();
      }
    } catch (error) {
      console.error('Error initializing ChatService:', error);
      // Set defaults if config fails
      this.webhookUrl = '';
      this.formWebhookUrl = '';
      this.metricsWebhookUrl = '';
      this.supabaseUrl = '';
      this.supabaseKey = '';
      this.supabase = null;
      this.isSupabaseEnabled = false;
      this.supabaseInitialized = false;
    }
    
    // Session management
    this.currentSessionId = null;
    this.sessionStartTime = null;
    this.sessionActive = false;
    this.inactivityTimeout = null;
    this.inactivityDuration = chatConfig.session.inactivityTimeout;
    
    // Message polling for incoming messages
    this.messagePollingInterval = null;
    this.pollingActive = false;
    this.isCheckingMessages = false;
  }

  async initSupabase() {
    // Prevent multiple initializations
    if (this.supabaseInitialized) return;
    
    try {
      // Only initialize Supabase if valid configuration is provided and feature is enabled
      if (chatConfig.features.enableSupabase &&
          this.supabaseUrl && 
          this.supabaseKey && 
          this.supabaseUrl !== 'https://your-project.supabase.co' && 
          this.supabaseKey !== 'your-anon-key' &&
          this.supabaseUrl.startsWith('https://') &&
          this.supabaseKey.length > 20) {
        // Dynamically import Supabase only when needed
        const { createClient } = await import('@supabase/supabase-js');
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
        this.isSupabaseEnabled = true;
        this.supabaseInitialized = true;
        console.log('Supabase initialized successfully');
      } else {
        console.log('Supabase not configured - using localStorage fallback');
        this.isSupabaseEnabled = false;
      }
    } catch (error) {
      console.warn('Supabase initialization failed:', error);
      this.isSupabaseEnabled = false;
    }
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
    this.resetInactivityTimer();
  }

  getCurrentSessionId() {
    if (!this.currentSessionId) {
      this.currentSessionId = sessionStorage.getItem('current_session_id');
    }
    return this.currentSessionId;
  }

  resetInactivityTimer() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }

    this.inactivityTimeout = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.inactivityDuration);
  }

  async handleSessionTimeout() {
    if (!this.sessionActive) return;
    
    console.log('Session timed out due to inactivity');
    await this.endCurrentSession('inactivity_timeout');
    
    return {
      type: 'system',
      message: '⏰ This conversation has ended due to inactivity. Send a message to start a new conversation.'
    };
  }

  async endCurrentSession(reason = 'manual') {
    if (!this.sessionActive || !this.currentSessionId) return;

    const sessionEndTime = new Date().toISOString();
    this.sessionActive = false;

    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }

    // Trigger metrics extraction
    await this.triggerMetricsExtraction(
      this.currentSessionId,
      localStorage.getItem('ghl_contact_id'),
      this.sessionStartTime,
      sessionEndTime,
      reason
    );

    // Clear session data
    sessionStorage.removeItem('current_session_id');
    sessionStorage.removeItem('session_start_time');
    sessionStorage.removeItem('session_active');

    this.currentSessionId = null;
    this.sessionStartTime = null;

    console.log('Session ended:', reason);
  }

  async triggerMetricsExtraction(sessionId, contactId, startTime, endTime, endReason) {
    if (!sessionId || !contactId || !chatConfig.features.enableMetrics) return;

    try {
      const response = await fetch(this.metricsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          contact_id: contactId,
          session_start_time: startTime,
          session_end_time: endTime,
          end_reason: endReason
        })
      });

      if (response.ok) {
        console.log('Metrics extraction triggered successfully');
      }
    } catch (error) {
      console.warn('Error triggering metrics extraction:', error);
    }
  }

  async setUserContext(contactId) {
    const email = localStorage.getItem('user_email');

    if (!this.isSupabaseEnabled || !this.supabase) {
      return true;
    }

    if (!contactId || !email) {
      console.error('Missing credentials for setUserContext');
      return false;
    }

    try {
      const { data, error } = await this.supabase.rpc('set_user_context', {
        contact_id: contactId,
        email: email
      });

      if (error) {
        // If RPC function doesn't exist, this is not critical - just log it
        if (error.message && (error.message.includes('not found') || error.message.includes('does not exist'))) {
          // RPC function not set up - this is OK, not all Supabase instances need it
          return true;
        }
        console.warn('Note: set_user_context RPC issue:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Note: Could not set user context:', error.message || error);
      return false;
    }
  }

  // Save user profile to Supabase
  async saveUserProfile(userData) {
    if (!this.isSupabaseEnabled) {
      console.log('Supabase not enabled, skipping profile save');
      return false;
    }

    const contactId = localStorage.getItem('ghl_contact_id');
    if (!contactId) {
      console.warn('No contact ID available for profile save');
      return false;
    }

    try {
      await this.setUserContext(contactId);

      const profileData = {
        contact_id: contactId,
        email: userData.email,
        first_name: userData.name?.split(' ')[0] || '',
        last_name: userData.name?.split(' ').slice(1).join(' ') || '',
        phone: userData.phone || '',
        zip_code: userData.zipCode || '',
        gender: userData.gender || '',
        age: userData.age ? parseInt(userData.age) : null,
        customer_type: userData.customerType || '',
        marketing_consent: userData.marketingConsent || false,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'contact_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('Error saving user profile:', error);
        return false;
      }

      console.log('User profile saved successfully to Supabase');
      return true;
    } catch (error) {
      console.error('Error in saveUserProfile:', error);
      return false;
    }
  }

  // Load user profile from Supabase
  async loadUserProfile() {
    if (!this.isSupabaseEnabled) {
      // Return data from localStorage if Supabase is not enabled
      return {
        phone: localStorage.getItem('user_phone') || '',
        zip_code: localStorage.getItem('user_zipCode') || '',
        gender: localStorage.getItem('user_gender') || '',
        age: localStorage.getItem('user_age') || '',
        marketing_consent: localStorage.getItem('user_consent') === 'true'
      };
    }

    const contactId = localStorage.getItem('ghl_contact_id');
    if (!contactId) return null;

    try {
      await this.setUserContext(contactId);
      
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('contact_id', contactId)
        .single();

      if (error) {
        console.warn('Error loading user profile:', error);
        // Fallback to localStorage
        return {
          phone: localStorage.getItem('user_phone') || '',
          zip_code: localStorage.getItem('user_zipCode') || '',
          gender: localStorage.getItem('user_gender') || '',
          age: localStorage.getItem('user_age') || '',
          marketing_consent: localStorage.getItem('user_consent') === 'true'
        };
      }

      return data;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      return null;
    }
  }

  // Parse n8n response messages (same logic as imic-chatbot.html)
  parseN8nMessages(data) {
    try {
      let responseData = data;
      
      // Handle array response
      if (Array.isArray(data) && data.length > 0) {
        responseData = data[0];
      }
      
      // Check for nested data.split_json
      if (responseData.data && responseData.data.split_json) {
        responseData = responseData.data;
      }
      
      const splitJson = responseData.split_json;
      if (!splitJson) {
        return "Thanks for your message!";
      }
      
      // Parse the split_json if it's a string
      let messageData;
      if (typeof splitJson === 'string') {
        messageData = JSON.parse(splitJson);
      } else {
        messageData = splitJson;
      }
      
      // Check for content wrapper
      if (messageData.content) {
        messageData = messageData.content;
      }
      
      // Extract messages (message1, message2, etc.)
      const messages = [];
      const messageKeys = Object.keys(messageData)
        .filter(key => key.startsWith('message'))
        .sort();
      
      messageKeys.forEach(key => {
        const content = messageData[key];
        if (content && content.trim() !== '') {
          messages.push(content);
        }
      });
      
      // Return single message or array of messages
      if (messages.length === 0) {
        return "Thanks for your message!";
      } else if (messages.length === 1) {
        return messages[0];
      } else {
        return messages;
      }
    } catch (error) {
      console.error('Error parsing n8n response:', error);
      return "Thanks for your message!";
    }
  }

  // Send message through n8n webhook
  async sendMessage(message, metadata = {}) {
    const contactId = localStorage.getItem('ghl_contact_id') || this.generateContactId();
    
    // Ensure we have a session ID - check first, then create if needed
    let sessionId = this.getCurrentSessionId();
    if (!sessionId || !this.sessionActive) {
      // Check sessionStorage for existing session that might not be in memory
      sessionId = sessionStorage.getItem('current_session_id');
      if (!sessionId) {
        // No session at all, start a new one
        this.startNewSession();
        sessionId = this.getCurrentSessionId();
        console.log('Started new session for message:', sessionId);
      } else {
        // Found session in storage, restore it
        this.currentSessionId = sessionId;
        this.sessionActive = true;
        this.sessionStartTime = sessionStorage.getItem('session_start_time');
        console.log('Restored session from storage:', sessionId);
      }
    }
    
    const userName = localStorage.getItem('user_name') || 'Chat Visitor';
    const userEmail = localStorage.getItem('user_email') || `${sessionId}@example.com`;
    
    // Load user profile from Supabase
    const userProfile = await this.loadUserProfile();
    
    try {
      const payload = {
        message,
        contact_id: contactId,
        session_id: sessionId,
        name: userName,
        email: userEmail,
        phone: userProfile?.phone || '',
        zipCode: userProfile?.zip_code || '',
        gender: userProfile?.gender || '',
        age: userProfile?.age || '',
        customerType: localStorage.getItem('user_customerType') || userProfile?.customer_type || '',
        marketingConsent: userProfile?.marketing_consent || false,
        channel: 'webchat',
        timestamp: new Date().toISOString(),
        metadata
      };

      const response = await fetch(this.webhookUrl, {
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
      
      // Parse n8n response using the same logic as imic-chatbot.html
      const botReply = this.parseN8nMessages(data);
      
      // Save message to Supabase if enabled
      if (this.isSupabaseEnabled) {
        await this.saveMessageToSupabase(message, 'user');
        if (botReply) {
          // If it's an array of messages, save all of them
          if (Array.isArray(botReply)) {
            for (const msg of botReply) {
              await this.saveMessageToSupabase(msg, 'bot');
            }
          } else {
            await this.saveMessageToSupabase(botReply, 'bot');
          }
        }
      }

      // Reset inactivity timer
      if (this.sessionActive) {
        this.resetInactivityTimer();
      }

      return {
        success: true,
        response: botReply,
        data
      };

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback to intelligent responses
      return this.getFallbackResponse(message);
    }
  }

  async saveMessageToSupabase(content, sender) {
    if (!this.isSupabaseEnabled || !this.supabase) return;

    const contactId = localStorage.getItem('ghl_contact_id');
    const email = localStorage.getItem('user_email');

    if (!contactId || !email) return;

    try {
      await this.setUserContext(contactId);

      const { error } = await this.supabase
        .from('chat_messages')
        .insert({
          contact_id: contactId,
          user_email: email,
          session_id: this.getCurrentSessionId(),
          message: content,
          sender: sender,
          delivered: true,
          created_at: new Date().toISOString()
        });

      if (error) {
        // Log but don't throw - message saving to Supabase is not critical
        if (error.code === '42501') {
          console.info('Note: Supabase RLS is active. Messages saved locally instead.');
        } else {
          console.warn('Could not save message to Supabase:', error.message);
        }
        // Fall back to localStorage
        this.saveMessageToLocalStorage(content, sender);
      }
    } catch (error) {
      console.warn('Could not save message to Supabase:', error.message);
      // Fall back to localStorage
      this.saveMessageToLocalStorage(content, sender);
    }
  }

  saveMessageToLocalStorage(content, sender) {
    try {
      const messages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
      messages.push({
        id: Date.now() + Math.random(),
        message: content,
        sender,
        timestamp: new Date().toISOString(),
        delivered: true
      });
      // Keep only last 100 messages
      if (messages.length > 100) {
        messages.splice(0, messages.length - 100);
      }
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    } catch (error) {
      console.warn('Could not save message to localStorage:', error);
    }
  }

  async loadChatHistory() {
    const contactId = localStorage.getItem('ghl_contact_id');
    if (!contactId) return [];

    if (this.isSupabaseEnabled) {
      try {
        await this.setUserContext(contactId);

        const { data, error } = await this.supabase
          .from('chat_messages')
          .select('*')
          .eq('contact_id', contactId)
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw error;

        return data || [];
      } catch (error) {
        console.warn('Error loading from Supabase:', error);
        return this.loadFromLocalStorage(contactId);
      }
    } else {
      return this.loadFromLocalStorage(contactId);
    }
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
    const contactId = localStorage.getItem('ghl_contact_id');
    if (!contactId) return;

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

  // Start polling for incoming messages from Supabase
  startMessagePolling() {
    if (!this.isSupabaseEnabled || this.messagePollingInterval) return;

    const contactId = localStorage.getItem('ghl_contact_id');
    if (!contactId) return;

    this.pollingActive = true;

    this.messagePollingInterval = setInterval(async () => {
      if (this.pollingActive) {
        await this.checkForIncomingMessages();
      }
    }, 2000); // Poll every 2 seconds

    // Check immediately
    this.checkForIncomingMessages();
  }

  async checkForIncomingMessages() {
    const contactId = localStorage.getItem('ghl_contact_id');
    if (!contactId || !this.isSupabaseEnabled || !this.pollingActive || this.isCheckingMessages) return;

    this.isCheckingMessages = true;

    try {
      await this.setUserContext(contactId);

      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('contact_id', contactId)
        .eq('delivered', false)
        .eq('sender', 'bot')
        .gte('created_at', thirtySecondsAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Error checking for incoming messages:', error);
        return;
      }

      if (data && data.length > 0) {
        const latestMessage = data[0];
        
        // Mark as delivered
        await this.markMessageDelivered(latestMessage.id);

        return {
          hasNewMessage: true,
          message: latestMessage.message,
          timestamp: latestMessage.created_at
        };
      }
    } catch (error) {
      console.warn('Error in checkForIncomingMessages:', error);
    } finally {
      this.isCheckingMessages = false;
    }

    return { hasNewMessage: false };
  }

  async markMessageDelivered(messageId) {
    if (!this.isSupabaseEnabled) return;

    try {
      const contactId = localStorage.getItem('ghl_contact_id');
      await this.setUserContext(contactId);

      const { error } = await this.supabase
        .from('chat_messages')
        .update({ delivered: true })
        .eq('id', messageId);

      if (error) {
        console.warn('Error marking message as delivered:', error);
      }
    } catch (error) {
      console.warn('Error in markMessageDelivered:', error);
    }
  }

  stopMessagePolling() {
    this.pollingActive = false;

    if (this.messagePollingInterval) {
      clearInterval(this.messagePollingInterval);
      this.messagePollingInterval = null;
      console.log('Stopped message polling');
    }
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

export default new ChatService();