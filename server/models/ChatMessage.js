import mongoose from 'mongoose';

/**
 * ChatMessage Schema
 * Implements conversation memory with summarization support
 * Based on MEMORIZATION_TECHNIQUE.md hierarchical memory architecture
 */

const ChatMessageSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
});

// Compound index for efficient session-based queries
ChatMessageSchema.index({ sessionId: 1, timestamp: 1 });
ChatMessageSchema.index({ userId: 1, timestamp: -1 });

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);

export default ChatMessage;
