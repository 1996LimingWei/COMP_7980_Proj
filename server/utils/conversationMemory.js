import ChatMessage from '../models/ChatMessage.js';
import axios from 'axios';

/**
 * Conversation Memory Utility
 * Implements hierarchical memory with dynamic summarization
 * Based on MEMORIZATION_TECHNIQUE.md
 * 
 * Strategy: Fixed Window Summarization
 * - Trigger summarization after 6 messages
 * - Keep last 4 messages verbatim
 * - Compress older messages into semantic summary
 */

const SUMMARIZATION_THRESHOLD = 6; // Messages before triggering summarization
const RECENT_MESSAGES_TO_KEEP = 4; // Recent messages kept in full
const MAX_SUMMARY_TOKENS = 150;    // Target summary length

/**
 * Retrieve conversation history for a session
 * Implements adaptive summarization from Section 5.1
 */
export const getConversationHistory = async (sessionId, userId) => {
    try {
        // Query database for session messages
        const messages = await ChatMessage.find({ sessionId, userId })
            .sort({ timestamp: 1 })
            .lean();

        // Decision point: apply summarization if conversation exceeds threshold
        if (messages.length > SUMMARIZATION_THRESHOLD) {
            return await getSummarizedHistory(sessionId, messages);
        }

        // Direct mapping for short conversations
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

    } catch (error) {
        console.error('Error retrieving conversation history:', error);
        // Graceful degradation: return empty array on failure
        return [];
    }
};

/**
 * Generate summarized conversation history
 * Implements Section 6.2 Dynamic Summarization Algorithm
 */
const getSummarizedHistory = async (sessionId, messages) => {
    // Partition: messages to summarize vs. recent messages to preserve
    const messagesToSummarize = messages.slice(0, -RECENT_MESSAGES_TO_KEEP);
    const recentMessages = messages.slice(-RECENT_MESSAGES_TO_KEEP);

    // Linearize: convert structured documents to readable text format
    const conversationText = messagesToSummarize.map(msg =>
        `${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n\n');

    // Generate summary via LLM
    const summary = await generateSummary(conversationText);

    // Combine: summary + recent messages
    const result = [];

    if (summary) {
        result.push({
            role: 'system',
            content: `[Earlier conversation summary: ${summary}]`
        });
    }

    recentMessages.forEach(msg => {
        result.push({
            role: msg.role,
            content: msg.content
        });
    });

    console.log(`Session ${sessionId}: Summarized ${messagesToSummarize.length} messages`);

    return result;
};

/**
 * Generate summary using HKBU ChatGPT API
 * Implements Section 6.2 summarization logic
 */
const generateSummary = async (conversationText) => {
    const apiKey = process.env.HKBU_API_KEY;
    const baseUrl = process.env.HKBU_BASE_URL;
    const model = process.env.HKBU_MODEL || 'gpt-5-mini';
    const apiVer = process.env.HKBU_API_VER || '2024-12-01-preview';

    if (!apiKey || !baseUrl) {
        console.warn('HKBU API not configured, skipping summarization');
        return null;
    }

    // Construct summarization prompt with explicit constraints (Section 6.3)
    const summaryPrompt = `Summarize this conversation briefly (2-3 sentences), keeping key facts and context:

${conversationText}

Summary:`;

    try {
        const response = await axios.post(
            `${baseUrl}/deployments/${model}/chat/completions?api-version=${apiVer}`,
            {
                model,
                messages: [{ role: 'user', content: summaryPrompt }],
                max_tokens: MAX_SUMMARY_TOKENS
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': apiKey
                },
                timeout: 30000
            }
        );

        if (response.data?.choices?.[0]?.message?.content) {
            return response.data.choices[0].message.content.trim();
        }

        return null;
    } catch (error) {
        console.error('Summarization failed:', error.message);
        // Fallback: return null, recent messages will still be available
        return null;
    }
};

/**
 * Save message to conversation history
 * Implements Section 7.3 Persistence Workflow
 */
export const saveMessage = async (sessionId, userId, role, content, metadata = {}) => {
    try {
        const message = new ChatMessage({
            sessionId,
            userId,
            role,
            content,
            timestamp: new Date(),
            metadata
        });

        await message.save();
        return message;
    } catch (error) {
        console.error('Failed to save message:', error);
        // Graceful degradation: log error but don't fail the request
        return null;
    }
};

/**
 * Get or create session ID
 * Implements Section 7.4 Session Management Patterns
 */
export const getOrCreateSession = (userId, existingSessionId = null) => {
    if (existingSessionId) {
        return existingSessionId;
    }

    // Generate new UUID-style session ID
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Clear conversation history
 */
export const clearConversation = async (sessionId, userId) => {
    try {
        const result = await ChatMessage.deleteMany({ sessionId, userId });
        return result.deletedCount > 0;
    } catch (error) {
        console.error('Failed to clear conversation:', error);
        return false;
    }
};

/**
 * Get message count for session
 */
export const getMessageCount = async (sessionId, userId) => {
    try {
        return await ChatMessage.countDocuments({ sessionId, userId });
    } catch (error) {
        console.error('Failed to get message count:', error);
        return 0;
    }
};

export default {
    getConversationHistory,
    saveMessage,
    getOrCreateSession,
    clearConversation,
    getMessageCount,
    SUMMARIZATION_THRESHOLD,
    RECENT_MESSAGES_TO_KEEP
};
