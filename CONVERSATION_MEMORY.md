# Conversation Memory System

## Overview

The AI Financial Advisor implements a **hierarchical conversation memory system** that allows the AI to remember context from previous interactions within the same session. This enables personalized, continuous conversations where the AI can reference earlier questions, remember user details (like names), and build upon previous advice.

## Architecture

### Core Components

1. **ChatMessage Model** (`server/models/ChatMessage.js`)
   - MongoDB schema for storing conversation messages
   - Indexed by `sessionId` and `userId` for efficient retrieval
   - Stores role (user/assistant/system), content, and timestamp

2. **Conversation Memory Utility** (`server/utils/conversationMemory.js`)
   - Implements fixed-window summarization algorithm
   - Manages message retrieval, storage, and summarization

3. **AI Controller Integration** (`server/controllers/aiController.js`)
   - Retrieves conversation history before each AI call
   - Saves user questions and AI responses
   - Constructs message array with system prompt + history + current question

## Memory Strategy: Fixed-Window Summarization

### How It Works

```
Threshold: 6 messages
Recent messages to keep: 4

Conversation Flow:
┌─────────────────────────────────────────────────────────────┐
│  Message 1: User - "Hi, I'm Denny"                          │
│  Message 2: Assistant - "Hello Denny..."                    │
│  Message 3: User - "How to save money?"                     │
│  Message 4: Assistant - "Here are tips..."                  │
│  Message 5: User - "Can I invest in stocks?"                │
│  Message 6: Assistant - "Yes, consider..."                  │
│  ─────────────────────────────────────────────────────────  │
│  [SUMMARIZATION TRIGGERED after 6 messages]                 │
│  ─────────────────────────────────────────────────────────  │
│  System: "[Earlier: User Denny asked about saving and       │
│           investing. Advisor suggested emergency fund       │
│           and index funds.]"                                │
│  Message 5: User - "Can I invest in stocks?"                │
│  Message 6: Assistant - "Yes, consider..."                  │
│  Message 7: User - "What about bonds?"                      │
│  Message 8: Assistant - "Bonds provide..."                  │
└─────────────────────────────────────────────────────────────┘
```

### Algorithm

1. **Short Conversations** (< 6 messages)
   - All messages sent to AI in full
   - No summarization needed

2. **Long Conversations** (≥ 6 messages)
   - Messages are split into two groups:
     - **Older messages**: Summarized into 2-3 sentences
     - **Recent 4 messages**: Kept verbatim for immediate context
   - Summary generated using HKBU ChatGPT API
   - Summary + recent messages sent to AI

## Session Management

### Session ID Generation

```javascript
// Frontend (AIAdvice.vue)
const getSessionId = () => {
  let sid = localStorage.getItem('aiAdvisorSessionId');
  if (!sid) {
    sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('aiAdvisorSessionId', sid);
  }
  return sid;
};
```

- Session ID persists in `localStorage` across page refreshes
- Same session = continuous conversation memory
- Clear conversation = new session ID generated

### Session Lifecycle

1. **New Session**: User first opens AI Advisor
   - New sessionId generated
   - Empty conversation history
   - `hasMemory: false`

2. **Active Session**: User asks multiple questions
   - Messages saved to MongoDB
   - History retrieved for each new question
   - `hasMemory: true` after first exchange

3. **Session Clear**: User clicks "Clear" button
   - New sessionId generated
   - Old conversation archived (not deleted from DB)
   - Fresh conversation starts

## Data Flow

### Message Saving Flow

```
User asks question
       ↓
[AI Controller]
       ↓
Get/Create Session ID
       ↓
Retrieve Conversation History
       ↓
Call HKBU API (with history)
       ↓
Receive AI Response
       ↓
Save User Message ────────┐
Save Assistant Message ───┤
       ↓                  │
[MongoDB] ◄───────────────┘
       ↓
Return Response to Client
```

### Message Retrieval Flow

```
User asks question
       ↓
Query MongoDB by sessionId + userId
       ↓
Sort by timestamp (oldest first)
       ↓
Check message count
       ↓
├─ < 6 messages: Return all verbatim
└─ ≥ 6 messages: Summarize older, keep last 4
       ↓
Return formatted messages for AI context
```

## Database Schema

### ChatMessage Collection

```javascript
{
  _id: ObjectId,
  sessionId: String (indexed),
  userId: ObjectId (indexed, ref: 'User'),
  role: String (enum: ['user', 'assistant', 'system']),
  content: String,
  timestamp: Date (default: Date.now),
  metadata: Object (optional)
}

Indexes:
- { sessionId: 1 }
- { userId: 1 }
- { sessionId: 1, timestamp: 1 }
```

## API Integration

### System Prompt

The system prompt explicitly instructs the AI to use conversation history:

```
You are a helpful financial advisor. Provide concise, practical, and 
personalized financial advice. Be encouraging but realistic. Focus on 
actionable recommendations.

IMPORTANT: You have access to the conversation history above. You MUST 
remember and reference information the user shared earlier in this 
conversation, such as their name, previous questions, and any advice 
you gave. When the user asks if you remember something, check the 
conversation history and respond accordingly.
```

### Message Construction

```javascript
const messages = [
  { role: 'system', content: systemPrompt },
  ...conversationHistory,  // Previous messages or summary + recent
  { role: 'user', content: currentQuestionWithFinancialData }
];
```

## Configuration

### Environment Variables

```env
HKBU_API_KEY=your_api_key
HKBU_BASE_URL=https://genai.hkbu.edu.hk/api/v0/rest
HKBU_MODEL=gpt-5-mini
HKBU_API_VER=2024-12-01-preview
```

### Timeout Settings

- **Backend**: 60 seconds (HKBU API requirement)
- **Frontend**: 70 seconds (must exceed backend)

## Performance Considerations

1. **Asynchronous Saving**: Messages saved after AI response (non-blocking)
2. **Efficient Indexing**: MongoDB indexes on sessionId and timestamp
3. **Summarization Threshold**: Only summarize when > 6 messages
4. **Token Optimization**: Summary reduces token usage for long conversations

## Privacy & Security

1. **User Isolation**: Messages filtered by userId (users cannot see others' conversations)
2. **Session-Based**: Each session is isolated; no cross-session memory
3. **Data Retention**: Conversations persist in MongoDB until explicitly cleared
4. **No PII Storage**: Only conversation content stored; no additional personal data