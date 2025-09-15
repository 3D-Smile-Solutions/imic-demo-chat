import StreamingAvatar, { 
  AvatarQuality,
  TaskType,
  TaskMode,
  VoiceEmotion,
  StreamingEvents
} from '@heygen/streaming-avatar';
import chatConfig from '../config/chatConfig';

class HeyGenService {
  constructor() {
    this.avatar = null;
    this.sessionData = null;
    this.isInitialized = false;
    this.isInitializing = false; // Prevent multiple simultaneous initializations
    this.isSpeaking = false;
    this.videoElement = null;
    this.accessToken = null;
    this.listeners = new Map();
  }

  // Get access token through n8n webhook (bypasses CORS)
  async getAccessTokenFromN8n() {
    try {
      const response = await fetch('https://n8n.3dsmilesolutions.ai/webhook/heygen-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle n8n response format
      const data = Array.isArray(result) ? result[0] : result;
      
      if (data.data && data.data.token) {
        this.accessToken = data.data.token;
        console.log('Successfully got HeyGen access token via n8n');
        return data.data.token;
      } else {
        throw new Error(data.message || 'Failed to get access token');
      }
    } catch (error) {
      console.error('Error getting HeyGen token:', error);
      throw error;
    }
  }

  // Initialize avatar session using SDK
  async initializeAvatar() {
    if (this.isInitialized) {
      console.log('Avatar already initialized');
      return this.sessionData;
    }
    
    if (this.isInitializing) {
      console.log('Avatar initialization already in progress');
      // Wait for initialization to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.isInitialized) {
            clearInterval(checkInterval);
            resolve(this.sessionData);
          }
        }, 100);
      });
    }

    this.isInitializing = true;
    
    try {
      // Get access token from n8n
      const token = await this.getAccessTokenFromN8n();
      
      // Create StreamingAvatar instance with token
      this.avatar = new StreamingAvatar({ token });
      
      // Setup event listeners BEFORE starting avatar
      this.setupEventListeners();
      
      // Set video element if available before starting
      if (this.videoElement) {
        console.log('Video element already set, ready for stream');
      }
      
      // Create and start avatar session
      const sessionInfo = await this.avatar.createStartAvatar({
        quality: this.getQualityLevel(),
        avatarName: chatConfig.heygen.avatarId,
        voice: {
          voiceId: chatConfig.heygen.voiceId || undefined
        }
      });
      
      this.sessionData = sessionInfo;
      this.isInitialized = true;
      this.isInitializing = false;
      
      console.log('Avatar session initialized:', sessionInfo.session_id);
      this.emit('avatar:initialized', sessionInfo);
      
      return sessionInfo;
    } catch (error) {
      console.error('Error initializing avatar:', error);
      this.isInitializing = false;
      this.emit('avatar:error', error);
      throw error;
    }
  }


  // Get quality level based on config
  getQualityLevel() {
    const qualityMap = {
      'low': AvatarQuality.Low,
      'medium': AvatarQuality.Medium,
      'high': AvatarQuality.High
    };
    return qualityMap[chatConfig.heygen.quality] || AvatarQuality.Medium;
  }

  // Setup event listeners for avatar
  setupEventListeners() {
    if (!this.avatar) return;

    // Stream ready event - this is when video becomes available
    this.avatar.on(StreamingEvents.STREAM_READY, (event) => {
      console.log('Avatar stream ready:', event);
      
      // The SDK provides the stream in event.detail (it's a CustomEvent)
      const stream = event.detail || event.stream || event;
      
      // Attach stream to video element if it's a MediaStream
      if (stream && stream instanceof MediaStream && this.videoElement) {
        console.log('Attaching stream to video element');
        this.videoElement.srcObject = stream;
        this.videoElement.play().catch(e => console.error('Error playing video:', e));
      } else if (stream && this.videoElement) {
        console.log('Stream type:', typeof stream, stream);
        console.error('Stream is not a MediaStream instance');
      }
      
      this.emit('stream:ready', { stream });
    });

    // Avatar starts speaking
    this.avatar.on(StreamingEvents.AVATAR_START_TALKING, (event) => {
      console.log('Avatar started talking');
      this.isSpeaking = true;
      this.emit('avatar:start-talking', event);
    });

    // Avatar stops speaking
    this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (event) => {
      console.log('Avatar stopped talking');
      this.isSpeaking = false;
      this.emit('avatar:stop-talking', event);
    });

    // Stream disconnected
    this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, (event) => {
      console.log('Stream disconnected:', event);
      this.isInitialized = false;
      this.emit('stream:disconnected', event);
    });

    // Error events
    this.avatar.on('error', (error) => {
      console.error('Avatar error:', error);
      this.emit('avatar:error', error);
    });
  }

  // Make avatar speak text
  async speak(text, options = {}) {
    if (!this.isInitialized || !this.avatar) {
      console.warn('Avatar not initialized, initializing now...');
      await this.initializeAvatar();
    }

    try {
      console.log('Making avatar speak:', text.substring(0, 50) + '...');
      
      // Use SDK to speak
      const taskType = chatConfig.heygen.taskType === 'talk' ? TaskType.TALK : TaskType.REPEAT;
      
      const speakOptions = {
        text: text,
        task_type: taskType,
        taskMode: TaskMode.SYNC,
        ...options
      };

      if (options.emotion) {
        speakOptions.voice = {
          ...speakOptions.voice,
          emotion: options.emotion
        };
      }

      await this.avatar.speak(speakOptions);
      console.log('Avatar speak command sent');
      
      return true;
    } catch (error) {
      console.error('Error making avatar speak:', error);
      this.emit('avatar:error', error);
      return false;
    }
  }

  // Interrupt avatar speaking
  async interrupt() {
    if (!this.avatar || !this.isSpeaking) return;

    try {
      await this.avatar.interrupt();
      console.log('Avatar interrupted');
      this.isSpeaking = false;
      this.emit('avatar:interrupted');
    } catch (error) {
      console.error('Error interrupting avatar:', error);
    }
  }

  // Set video element for display
  setVideoElement(element) {
    this.videoElement = element;
    console.log('Video element set');
  }

  // Stop and cleanup avatar session
  async stopAvatar() {
    if (!this.isInitialized) return;

    try {
      // Stop SDK avatar
      if (this.avatar) {
        await this.avatar.stopAvatar();
      }
      
      console.log('Avatar stopped');
      
      // Cleanup
      this.isInitialized = false;
      this.isInitializing = false;
      this.isSpeaking = false;
      this.sessionData = null;
      
      // Clear video element
      if (this.videoElement) {
        this.videoElement.srcObject = null;
      }
      
      this.emit('avatar:stopped');
    } catch (error) {
      console.error('Error stopping avatar:', error);
    }
  }

  // Event emitter methods
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Check if avatar is ready
  isReady() {
    return this.isInitialized && this.avatar && this.sessionData;
  }

  // Get current speaking status
  isSpeakingNow() {
    return this.isSpeaking;
  }

  // Cleanup on destroy
  destroy() {
    this.stopAvatar();
    this.listeners.clear();
    this.avatar = null;
    this.videoElement = null;
    this.accessToken = null;
    this.isInitializing = false;
  }
}

// Export singleton instance
const heygenService = new HeyGenService();
export default heygenService;