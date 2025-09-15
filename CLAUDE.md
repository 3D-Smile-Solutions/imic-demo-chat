# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React application built with Vite, featuring a sophisticated chat widget with real-time messaging capabilities and HeyGen avatar integration. The project integrates with n8n webhooks for message processing, Supabase for data persistence, and HeyGen Streaming Avatar SDK for interactive AI avatars that speak responses.

## Development Commands

```bash
# Start development server on port 3000
npm start

# Build for production
npm run build

# Run tests with Vitest
npm test

# Preview production build
npm run preview

# Install dependencies
npm install

# Install HeyGen Avatar SDK (when ready to implement)
npm install @heygen/streaming-avatar
```

## Architecture Overview

### Core Technologies
- **Build Tool**: Vite (configured in `vite.config.js`)
- **Framework**: React 18.2
- **Testing**: Vitest with jsdom environment
- **Backend Integration**: Supabase client, n8n webhooks
- **Avatar Integration**: HeyGen Streaming Avatar SDK (@heygen/streaming-avatar)
- **Real-time Communication**: WebRTC, WebSockets
- **Development Environment**: GitHub Codespaces optimized

### Application Structure

#### Chat Widget System
The main feature is a comprehensive chat widget (`src/components/ChatWidget/`) with:

1. **Component Architecture**:
   - `ChatWidget.jsx` - Main container managing state, session lifecycle, and message polling
   - `ChatAuthFormWithVerification.jsx` - Multi-step authentication form with email verification
     - Initial form collection (name, email, phone, zip, gender, age, consent)
     - 6-digit code verification via email
     - Quick re-authentication for returning users
     - Resend code functionality with 60-second cooldown
   - `ChatMessage.jsx` - Individual message display with real-time timestamp formatting
   - `ChatInput.jsx` - Auto-resizing textarea with Enter/Shift+Enter handling
   - `ChatWidget.css` - Blue/red theme styling with 80% screen width layout
   - `AvatarDisplay.jsx` - HeyGen avatar video display with loading/error states
   - `heygenService.js` - HeyGen WebRTC/WebSocket integration service

2. **Service Layer**:
   - `chatService.js` - Chat messaging and session management
     - n8n webhook communication for message sending/receiving
     - Supabase database operations with RLS support
     - Session management with 30-minute inactivity timeout
     - Message polling (2-second intervals) for real-time updates
     - Fallback to localStorage when Supabase unavailable
   - `heygenService.js` - Avatar streaming management
     - WebRTC peer connection establishment
     - WebSocket control channel for commands
     - Session creation via n8n proxy
     - Avatar speaking with REPEAT mode

3. **Configuration** (`src/config/chatConfig.js`):
   - Centralized configuration for webhooks, Supabase, UI settings
   - Feature flags for enabling/disabling functionality
   - Session and polling parameters
   - HeyGen API configuration (API key, avatar ID, voice settings)

### Key Integration Points

#### n8n Webhook Flow
- **Form Submission**: POST to webhook with user data, receives verification code sent to email
- **Code Verification**: POST to webhook with email and code, receives contact_id and session_id
- **Chat Message**: POST to webhook with message, contact_id, session_id, metadata
- **Metrics Extraction**: Session analytics sent on session end
- **Expected Response Format**:
  - Form Submit: `{ success: true, verification_sent: true, contact_id?: string }`
  - Code Verify: `{ success: true, contact_id: string, user_name: string, session_id?: string }`
  - Chat: `[{ split_json: "{\"message1\":\"response text\"}" }]` or direct format
- **Response Parsing**: Supports both split_json format and direct reply/message fields

#### Supabase Integration
- **Table**: `chat_messages` with contact_id, user_email, session_id, message, sender, delivered, created_at
- **RLS Function**: `set_user_context(contact_id, email)` for row-level security
- **Polling**: Checks for undelivered bot messages every 2 seconds
- **Delivery Tracking**: Marks messages as delivered when displayed

#### HeyGen Avatar Integration (Implemented)
- **SDK**: @heygen/streaming-avatar npm package
- **Architecture**: SDK-based streaming with token authentication via n8n proxy
- **Flow**: Get token → SDK creates session → Avatar speaks responses → Display in background
- **Implementation**:
  - n8n webhook proxy at `https://n8n.3dsmilesolutions.ai/webhook/heygen-token` for token generation
  - SDK handles all WebRTC/WebSocket complexity internally
  - Session management through SDK's createStartAvatar method
- **Features**:
  - Real-time avatar video streaming
  - Text-to-speech synchronization with chat bubbles
  - Avatar: Katya_ProfessionalLook_public
  - Quality: Medium (configurable)
  - Semi-transparent overlay in chat background
- **Session Management**: Avatar sessions created on chat open, linked to chat sessions
- **Fallback**: Graceful degradation to text-only when avatar fails

### Session Management Architecture
- Session initiated after successful email verification with contact_id from n8n
- Contact ID and session ID received from n8n webhook responses
- User verification validity configurable (default 12 hours, currently 5 seconds for testing)
- Quick re-authentication for users within validity period
- Inactivity timer resets on user actions (30-minute timeout)
- Session metrics extracted and sent via webhook on session end
- SessionStorage for temporary session data, localStorage for persistence

### Data Flow

#### Authentication Flow
1. User opens chat → Shows authentication form
2. Form submission → n8n webhook → Verification code sent to email
3. User enters code → n8n verification → Returns contact_id and session_id
4. Successful verification → Chat access granted with personalized welcome

#### Message Flow
1. User sends message → ChatWidget → chatService.sendMessage() → n8n webhook
2. n8n processes and responds → Response saved to Supabase → UI updated
3. Background polling checks Supabase for new bot messages → Updates UI
4. All messages backed up to localStorage for offline support

## Critical Configuration Required

Before the chat widget functions properly, update these configurations:

1. **`src/config/chatConfig.js`**:
   - Set actual n8n webhook URLs:
     - `formSubmit`: For user registration and verification code sending
     - `codeVerification`: For validating 6-digit verification codes
     - `chat`: For message processing
     - `metrics`: For session analytics (optional)
   - Configure Supabase URL and anon key OR set `enableSupabase: false`
   - Adjust verification validity duration (currently 12 hours)
   - Currently Supabase is ENABLED and metrics are DISABLED
   - Configure HeyGen settings (when implementing):
     - `apiKey`: Your HeyGen API key
     - `avatarId`: Selected avatar ID
     - `voiceId`: Voice selection (optional)
     - `quality`: low/medium/high
   - Adjust UI text and colors as needed

2. **Environment Variables** (optional):
   - `REACT_APP_WEBHOOK_URL`
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

3. **Supabase Setup** (required when enabling Supabase):
   - Create `chat_messages` table with schema:
     ```sql
     contact_id text, user_email text, session_id text,
     message text, sender text, delivered boolean,
     created_at timestamp with time zone
     ```
   - Create `user_profiles` table with schema:
     ```sql
     contact_id text (primary key), email text, first_name text,
     last_name text, phone text, zip_code text, gender text,
     age integer, marketing_consent boolean,
     created_at timestamp, updated_at timestamp
     ```
   - Apply RLS policies for both tables (see RLS Configuration below)

## Known Issues & Fixes

### Blank Page Issue (RESOLVED)
If the app shows a blank page:
1. **Root Cause**: The original `chatService.js` tried to import Supabase even when disabled, causing module errors
2. **Solution Implemented**: Created `chatServiceLocal.js` that works without external dependencies
3. **Current State**: ChatWidget now uses `chatServiceLocal.js` instead of `chatService.js`
4. **How it works**: 
   - Uses localStorage for message persistence
   - Provides mock responses for testing
   - No external configuration required
   - All features work locally without webhooks or Supabase

### To Re-enable External Services
When ready to use real webhooks and Supabase:
1. Update `src/config/chatConfig.js` with real URLs and keys
2. Change import in `ChatWidget.jsx` from `chatServiceLocal` back to `chatService` (currently using `chatService`)
3. Set `enableSupabase: true` and `enableMetrics: true` in config
4. Configure Supabase RLS policies (see below)

## Testing Approach

The project uses Vitest with jsdom for React component testing. Test files follow the pattern `*.test.jsx` and can be run individually or all together via `npm test`.

## Development Environment Notes

- Configured for GitHub Codespaces with automatic server startup
- Vite development server runs on port 3000 with WebSocket configuration for Codespaces
- Browser auto-open disabled (`BROWSER=none`) for Codespaces compatibility
- Simple Browser in VS Code recommended for preview (`Cmd/Ctrl + Shift + P > Simple Browser: Show`)

## Widget Customization Points

- **Colors**: Edit primary (#3b82f6, #1e40af) and secondary (#ef4444, #dc2626) in ChatWidget.css
- **Size**: Adjust width (80vw) and height (80vh) in .chat-window class
- **Messages**: Modify welcome message and placeholders in chatConfig.js
- **Polling Interval**: Change from 2000ms in chatConfig.js
- **Session Timeout**: Adjust from 30 minutes in chatConfig.js

## Supabase RLS Configuration

When using Supabase, Row-Level Security (RLS) must be configured for both tables:

### For chat_messages table:
```sql
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for anon users" ON chat_messages
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Enable read for anon users" ON chat_messages
    FOR SELECT TO anon USING (true);

CREATE POLICY "Enable update for anon users" ON chat_messages
    FOR UPDATE TO anon USING (true);
```

### For user_profiles table:
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for anon users" ON user_profiles
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Enable read for anon users" ON user_profiles
    FOR SELECT TO anon USING (true);

CREATE POLICY "Enable update for anon users" ON user_profiles
    FOR UPDATE TO anon USING (true);
```

These policies allow anonymous users (using the anon key) to read, write, and update data in both tables.

## HeyGen Avatar Integration Details

### Implementation Architecture
1. **n8n Webhook Proxy** (`/webhook/heygen-token`):
   - Receives request from React app
   - Calls HeyGen `/v1/streaming.create_token` with API key
   - Returns access token to React app

2. **SDK Connection Flow**:
   ```
   React App → n8n Proxy → HeyGen Token API
        ↓                      ↓
   Get Token ← Access Token ← Token Created
        ↓
   SDK createStartAvatar → WebRTC/WebSocket handled by SDK
        ↓
   Avatar Ready → Speak Commands → Avatar Responds
   ```

3. **Current Configuration**:
   ```javascript
   heygen: {
     apiKey: 'MjNjNjgxODg5OTk4NGY3YTljZjMwOGVmMDczZTQ1ZjUtMTc1NTYyOTQyOQ==',
     avatarId: 'Katya_ProfessionalLook_public',
     voiceId: null, // Uses avatar's default voice
     quality: 'medium',
     silenceTimeout: 5000,
     taskType: 'repeat' // Avatar repeats n8n response exactly
   }
   ```

4. **n8n Webhook Setup Required**:
   Create webhook at `/webhook/heygen-token` that:
   ```javascript
   // HTTP Request node configuration:
   // Method: POST
   // URL: https://api.heygen.com/v1/streaming.create_token
   // Headers: 
   //   x-api-key: YOUR_HEYGEN_API_KEY
   // Response: Pass through the token data
   ```

5. **Testing Checklist**:
   - [ ] n8n webhook returns HeyGen session data
   - [ ] WebRTC connection establishes successfully
   - [ ] Avatar video stream displays in background
   - [ ] Avatar speaks when bot responds
   - [ ] Graceful fallback when avatar failsw