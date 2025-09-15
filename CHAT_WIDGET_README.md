# React Chat Widget with n8n & Supabase Backend

A robust, real-time chat widget for React applications with full backend integration via n8n webhooks and Supabase database.

## Features

### UI/UX
- 🎨 **Wide Chat Window**: 80% of screen width for better conversation experience
- 🔵 **Blue & Red Theme**: Professional blue gradients for bot/header, vibrant red for user messages
- ⏰ **Real-time Timestamps**: Dynamic time display ("Just now", "2 mins ago", etc.)
- 💬 **Typing Indicator**: Animated dots when bot is processing
- 📱 **Fully Responsive**: Optimized for mobile and desktop
- 🎯 **Floating Chat Button**: Animated button with message prompts
- 🔄 **Auto-scroll**: Automatically scrolls to latest messages
- 💾 **Message Persistence**: Chat history saved locally and in Supabase

### Backend Integration
- 🔗 **n8n Webhook Integration**: Send/receive messages through n8n workflows
- 🗄️ **Supabase Database**: Store and retrieve chat history
- 📊 **Session Management**: Track chat sessions with inactivity timeout
- 🔄 **Real-time Polling**: Check for incoming messages from Supabase
- 📈 **Metrics Extraction**: Send session metrics via webhook
- 🆔 **Contact ID Management**: Unique IDs for each user
- 🔒 **RLS Support**: Row-level security with Supabase

## Setup Instructions

### 1. Configure n8n Webhooks

Update the webhook URLs in `src/config/chatConfig.js`:

```javascript
webhooks: {
  chat: 'https://your-n8n.com/webhook/chat-widget',
  formSubmit: 'https://your-n8n.com/webhook/form-submit',
  metrics: 'https://your-n8n.com/webhook/extract-metrics'
}
```

### 2. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Create the required table:
```sql
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id TEXT NOT NULL,
  user_email TEXT,
  session_id TEXT,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  delivered BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_chat_messages_contact_id ON chat_messages(contact_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_delivered ON chat_messages(delivered);
```

3. Set up RLS (Row Level Security) if needed:
```sql
-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS function for user context
CREATE OR REPLACE FUNCTION set_user_context(contact_id TEXT, email TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_contact_id', contact_id, false);
  PERFORM set_config('app.current_user_email', email, false);
END;
$$ LANGUAGE plpgsql;
```

4. Update Supabase credentials in `src/config/chatConfig.js`:
```javascript
supabase: {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key'
}
```

### 3. Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
REACT_APP_WEBHOOK_URL=https://your-n8n.com/webhook/chat-widget
REACT_APP_FORM_WEBHOOK_URL=https://your-n8n.com/webhook/form-submit
REACT_APP_METRICS_WEBHOOK_URL=https://your-n8n.com/webhook/extract-metrics
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 4. n8n Webhook Setup

Your n8n webhook should expect the following payload:

```json
{
  "message": "User's message",
  "contact_id": "contact_1234567890_abc",
  "session_id": "contact_1234567890_abc_session_1234567890",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "metadata": {
    "messageCount": 5,
    "isOpen": true
  }
}
```

And respond with:

```json
{
  "reply": "Bot's response message",
  "success": true
}
```

## Usage

The chat widget is automatically included in your App component:

```jsx
import ChatWidget from './components/ChatWidget/ChatWidget';

function App() {
  return (
    <div className="App">
      {/* Your app content */}
      <ChatWidget />
    </div>
  );
}
```

## Customization

### Modify Colors and Theme

Edit `src/components/ChatWidget/ChatWidget.css`:
- Primary color (blue): `#3b82f6` and `#1e40af`
- Secondary color (red): `#ef4444` and `#dc2626`

### Change Company Name and Messages

Update `src/config/chatConfig.js`:
```javascript
ui: {
  companyName: 'Your Company',
  welcomeMessage: 'Your welcome message',
  placeholderText: 'Your placeholder text'
}
```

### Adjust Window Size

In `ChatWidget.css`, modify the `.chat-window` class:
```css
.chat-window {
  width: 80vw;  /* Adjust width percentage */
  height: 80vh; /* Adjust height percentage */
  max-width: 1400px; /* Maximum width */
  max-height: 800px; /* Maximum height */
}
```

## Features Breakdown

### Session Management
- Automatic session creation on chat start
- 30-minute inactivity timeout
- Session metrics sent to n8n webhook on end

### Message Polling
- Polls Supabase every 2 seconds for new messages
- Automatically marks messages as delivered
- Shows notification when chat is closed

### Data Storage
- **Supabase**: Primary storage for chat history
- **localStorage**: Backup storage and offline support
- **sessionStorage**: Temporary session data

### Contact Management
- Generates unique contact IDs
- Stores in localStorage for persistence
- Links all messages to contact ID

## Troubleshooting

### Chat not connecting to backend
1. Check webhook URLs in `chatConfig.js`
2. Verify n8n workflows are active
3. Check browser console for errors
4. Ensure CORS is enabled on n8n webhooks

### Supabase not working
1. Verify Supabase URL and anon key
2. Check table structure matches requirements
3. Verify RLS policies if enabled
4. Check network tab for API errors

### Messages not persisting
1. Check localStorage is not disabled
2. Verify Supabase connection
3. Check browser console for storage errors

## Support

For issues or questions, check:
- Browser console for error messages
- Network tab for failed requests
- Supabase dashboard for database logs
- n8n execution logs for webhook issues