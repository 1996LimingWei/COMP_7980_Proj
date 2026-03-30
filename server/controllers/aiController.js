import axios from 'axios';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import {
  getConversationHistory,
  saveMessage,
  getOrCreateSession,
  clearConversation,
  getMessageCount
} from '../utils/conversationMemory.js';

/**
 * 调用 HKBU AI 接口
 */
const callHKBU = async (messages) => {
  const apiKey = process.env.HKBU_API_KEY;
  const baseUrl = process.env.HKBU_BASE_URL;
  const model = process.env.HKBU_MODEL || 'gpt-5-mini';
  const apiVer = process.env.HKBU_API_VER || '2024-12-01-preview';

  console.log('HKBU API Configuration:');
  console.log('- API Key:', apiKey ? 'Present' : 'Missing');
  console.log('- Base URL:', baseUrl || 'Missing');
  console.log('- Model:', model);
  console.log('- API Version:', apiVer);

  if (!apiKey) {
    const err = new Error('Missing HKBU_API_KEY in server/.env');
    err.statusCode = 500;
    throw err;
  }

  if (!baseUrl) {
    const err = new Error('Missing HKBU_BASE_URL in server/.env');
    err.statusCode = 500;
    throw err;
  }

  console.log('\nSending request to HKBU API...');
  console.log('Full URL:', `${baseUrl}/deployments/${model}/chat/completions?api-version=${apiVer}`);
  console.log('Messages:', JSON.stringify(messages, null, 2));

  try {
    const response = await axios.post(
      `${baseUrl}/deployments/${model}/chat/completions?api-version=${apiVer}`,
      {
        model,
        messages,
        max_tokens: 800
        // Note: HKBU API doesn't support temperature for some models
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        timeout: 30000
      }
    );

    console.log('\nHKBU API Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    if (
      !response.data ||
      !response.data.choices ||
      response.data.choices.length === 0 ||
      !response.data.choices[0].message
    ) {
      const err = new Error('Invalid response from AI service');
      err.statusCode = 500;
      throw err;
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('\n❌ HKBU API Call Failed:');
    console.error('- Error Type:', error.name);
    console.error('- Status:', error.response?.status);
    console.error('- Data:', error.response?.data);
    console.error('- Message:', error.message);
    throw error;
  }
};

/**
 * 获取用户财务摘要，给 AI 提供上下文
 */
const getUserFinancialSummary = async (userId) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const overallSummary = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId
        }
      },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$amount' },
          totalIncome: {
            $sum: {
              $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, '$amount', 0]
            }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const categorySpending = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: lastMonth },
          amount: { $lt: 0 }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total: 1 }
      },
      {
        $limit: 5
      }
    ]);

    const recentTransactions = await Transaction.find({
      userId: userObjectId
    })
      .sort({ date: -1 })
      .limit(10)
      .select('amount category description date');

    const overall = overallSummary[0] || {
      totalBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
      transactionCount: 0
    };

    return {
      overall: {
        totalBalance: parseFloat(Number(overall.totalBalance || 0).toFixed(2)),
        totalIncome: parseFloat(Number(overall.totalIncome || 0).toFixed(2)),
        totalExpense: parseFloat(
          Math.abs(Number(overall.totalExpense || 0)).toFixed(2)
        ),
        transactionCount: overall.transactionCount || 0
      },
      topSpendingCategories: categorySpending.map((cat) => ({
        category: cat._id,
        amount: parseFloat(Math.abs(Number(cat.total || 0)).toFixed(2)),
        count: cat.count
      })),
      recentTransactions: recentTransactions.map((t) => ({
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
        type: t.amount > 0 ? 'income' : 'expense'
      }))
    };
  } catch (error) {
    console.error('Error getting financial summary:', error);
    return null;
  }
};

/**
 * @desc Get AI financial advice
 * @route POST /api/ai/advice
 * @access Private
 */
export const getAdvice = async (req, res) => {
  try {
    console.log('\n=== AI Advice Request ===');
    console.log('User ID:', req.user?._id);
    console.log('Question:', req.body.question);
    console.log('Session ID:', req.body.sessionId);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { question, sessionId: existingSessionId } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    // Get or create session for conversation memory
    const sessionId = getOrCreateSession(req.user._id, existingSessionId);

    // Retrieve conversation history with summarization
    const conversationHistory = await getConversationHistory(sessionId, req.user._id);
    const messageCount = await getMessageCount(sessionId, req.user._id);

    console.log(`Session ${sessionId}: ${messageCount} messages, ${conversationHistory.length} in context`);

    // Get user's financial context
    const financialContext = await getUserFinancialSummary(req.user._id);

    // Build the comprehensive prompt with financial data
    let userPrompt = question;
    if (financialContext) {
      userPrompt = `As a financial advisor, please answer the following question based on the user's financial data and our conversation history.

User Financial Summary:
- Total Balance: $${financialContext.overall.totalBalance}
- Total Income (all time): $${financialContext.overall.totalIncome}
- Total Expenses (all time): $${financialContext.overall.totalExpense}
- Number of Transactions: ${financialContext.overall.transactionCount}

Top Spending Categories (Last Month):
${financialContext.topSpendingCategories.length > 0
          ? financialContext.topSpendingCategories
            .map(
              (cat) =>
                `- ${cat.category}: $${cat.amount} (${cat.count} transactions)`
            )
            .join('\n')
          : '- No recent spending data'
        }

Recent Transactions:
${financialContext.recentTransactions.length > 0
          ? financialContext.recentTransactions
            .map(
              (t) =>
                `- ${t.date}: ${t.type === 'income' ? '+' : '-'}$${Math.abs(
                  t.amount
                )} (${t.category})${t.description ? ` - ${t.description}` : ''
                }`
            )
            .join('\n')
          : '- No recent transactions'
        }

User Question: ${question}

Please provide personalized financial advice based on this data and our conversation history. Be specific and actionable.`;
    }

    // Build complete message array for AI with conversation memory
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful financial advisor. Provide concise, practical, and personalized financial advice. Be encouraging but realistic. Focus on actionable recommendations. Remember context from our previous conversation to provide continuity in your advice.'
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userPrompt
      }
    ];

    console.log('Sending to AI with', messages.length, 'messages');

    // Get AI response
    const aiResponse = await callHKBU(messages);

    // Save user message and AI response to conversation history (async, don't wait)
    saveMessage(sessionId, req.user._id, 'user', question).catch(err =>
      console.error('Failed to save user message:', err)
    );
    saveMessage(sessionId, req.user._id, 'assistant', aiResponse).catch(err =>
      console.error('Failed to save assistant message:', err)
    );

    return res.json({
      success: true,
      question,
      answer: aiResponse,
      sessionId,
      messageCount: messageCount + 2, // Including just-added messages
      hasMemory: messageCount > 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('\n❌ AI Advice Error:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Full Error:', error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'AI service timeout. Please try again.'
      });
    }

    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.error?.message ||
        error.response.data?.message ||
        'AI service error';

      if (status === 401) {
        return res.status(500).json({
          success: false,
          message: 'AI service authentication failed'
        });
      }

      if (status === 429) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests to AI service. Please try again later.'
        });
      }

      return res.status(500).json({
        success: false,
        message: `AI service error: ${message}`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to get AI advice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc Get AI advice without financial context
 * @route POST /api/ai/general
 * @access Private
 */
export const getGeneralAdvice = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    const aiResponse = await callHKBU([
      {
        role: 'system',
        content:
          'You are a helpful financial advisor. Provide general financial advice, tips on budgeting, saving, investing, and personal finance management. Be practical and actionable.'
      },
      {
        role: 'user',
        content: question
      }
    ]);

    return res.json({
      success: true,
      question,
      answer: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI general advice error:', error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'AI service timeout. Please try again.'
      });
    }

    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.error?.message ||
        error.response.data?.message ||
        'AI service error';

      if (status === 401) {
        return res.status(500).json({
          success: false,
          message: 'AI service authentication failed'
        });
      }

      if (status === 429) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests to AI service. Please try again later.'
        });
      }

      return res.status(500).json({
        success: false,
        message: `AI service error: ${message}`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to get AI advice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc Clear conversation history
 * @route DELETE /api/ai/conversation/:sessionId
 * @access Private
 */
export const clearConversationHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const cleared = await clearConversation(sessionId, req.user._id);

    if (cleared) {
      return res.json({
        success: true,
        message: 'Conversation history cleared successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or already empty'
      });
    }
  } catch (error) {
    console.error('Error clearing conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear conversation history'
    });
  }
};

export default {
  getAdvice,
  getGeneralAdvice,
  clearConversationHistory
};