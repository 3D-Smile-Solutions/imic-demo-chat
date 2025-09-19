// Chat Widget Configuration
// Update these values with your actual URLs and credentials

const chatConfig = {
  // n8n Webhook URLs
  webhooks: {
    chat: 'https://n8n.3dsmilesolutions.ai/webhook/imic',
    formSubmit: 'https://n8n.3dsmilesolutions.ai/webhook/imic/form-submit', // UPDATE THIS WITH YOUR FORM SUBMISSION WEBHOOK URL
    codeVerification: 'https://n8n.3dsmilesolutions.ai/webhook/imic/verify-code', // Verification webhook
    metrics: 'https://your-n8n-instance.com/webhook/extract-metrics'
  },

  // Supabase Configuration
  supabase: {
    url: 'https://wgpyitsytprtcoccohgg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHlpdHN5dHBydGNvY2NvaGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDAxMzQsImV4cCI6MjA3MDg3NjEzNH0.rOHfpEfKz3ABVgFdCTKuulh0LWVzzfguoh6-Kuy-Bmc'
  },

  // Session Configuration
  session: {
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
    maxMessagesStored: 100,
    messageExpiryDays: 30,
    verificationValidityDuration: 12 * 60 * 60 * 1000 // 12 hours - how long verification stays valid
  },

  // Polling Configuration
  polling: {
    enabled: true,
    interval: 2000, // 2 seconds
    maxRetries: 3
  },

  // UI Configuration
  ui: {
    companyName: 'Customer Support',
    welcomeMessage: 'Hi there! 👋 How can I help you today?',
    placeholderText: 'Type your message...',
    primaryColor: '#3b82f6', // Blue
    secondaryColor: '#ef4444' // Red - removed trailing comma
  },

  // Feature Flags
  features: {
    enableSupabase: true, // Enabled with Supabase credentials
    enableLocalStorage: true,
    enableSessionTracking: true,
    enableMetrics: false, // Keep disabled unless you have metrics webhook
    enableSounds: false,
    enableTypingIndicator: true,
    enableAvatar: true // Enable HeyGen avatar via n8n proxy
  },

  // HeyGen Avatar Configuration
  heygen: {
    apiKey: 'MjNjNjgxODg5OTk4NGY3YTljZjMwOGVmMDczZTQ1ZjUtMTc1NTYyOTQyOQ==',
    avatarId: 'Katya_ProfessionalLook_public', // Professional female avatar
    voiceId: null, // Will use avatar's default voice
    quality: 'high', // Changed to high for better video quality
    silenceTimeout: 5000, // Stop avatar after 5 seconds of silence
    taskType: 'repeat' // 'repeat' to speak exactly what n8n returns, 'talk' for AI responses
  }
};

export default chatConfig;