// Backup of original chatConfig
// Chat Widget Configuration
// Update these values with your actual URLs and credentials

const chatConfig = {
  // n8n Webhook URLs
  webhooks: {
    chat: process.env.REACT_APP_WEBHOOK_URL || 'https://n8n.3dsmilesolutions.ai/webhook/imic',
    formSubmit: process.env.REACT_APP_FORM_WEBHOOK_URL || 'https://n8n.3dsmilesolutions.ai/webhook/form-submit', // UPDATE THIS WITH YOUR FORM SUBMISSION WEBHOOK URL
    metrics: process.env.REACT_APP_METRICS_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/extract-metrics'
  },

  // Supabase Configuration
  supabase: {
    url: process.env.REACT_APP_SUPABASE_URL || 'https://wgpyitsytprtcoccohgg.supabase.co',
    anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHlpdHN5dHBydGNvY2NvaGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDAxMzQsImV4cCI6MjA3MDg3NjEzNH0.rOHfpEfKz3ABVgFdCTKuulh0LWVzzfguoh6-Kuy-Bmc'
  },

  // Session Configuration
  session: {
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
    maxMessagesStored: 100,
    messageExpiryDays: 30
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
    enableTypingIndicator: true
  }
};

export default chatConfig;