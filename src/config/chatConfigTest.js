// Minimal test config - adding supabase section
const chatConfigTest = {
  webhooks: {
    chat: 'https://n8n.3dsmilesolutions.ai/webhook/imic',
    formSubmit: 'https://n8n.3dsmilesolutions.ai/webhook/form-submit',
    metrics: 'https://your-n8n-instance.com/webhook/extract-metrics'
  },
  
  // Supabase Configuration
  supabase: {
    url: 'https://wgpyitsytprtcoccohgg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHlpdHN5dHBydGNvY2NvaGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDAxMzQsImV4cCI6MjA3MDg3NjEzNH0.rOHfpEfKz3ABVgFdCTKuulh0LWVzzfguoh6-Kuy-Bmc'
  },
  
  // Session Configuration
  session: {
    inactivityTimeout: 30 * 60 * 1000,
    maxMessagesStored: 100,
    messageExpiryDays: 30
  },
  
  // UI Configuration
  ui: {
    companyName: 'Customer Support',
    welcomeMessage: 'Hi there! 👋 How can I help you today?',
    placeholderText: 'Type your message...',
    primaryColor: '#3b82f6',
    secondaryColor: '#ef4444'
  },
  
  // Polling Configuration
  polling: {
    enabled: true,
    interval: 2000,
    maxRetries: 3
  },
  
  // Feature Flags
  features: {
    enableSupabase: true,
    enableLocalStorage: true,
    enableSessionTracking: true,
    enableMetrics: false,
    enableSounds: false,
    enableTypingIndicator: true
  }
};

export default chatConfigTest;