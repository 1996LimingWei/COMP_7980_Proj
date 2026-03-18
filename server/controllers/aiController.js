import axios from 'axios';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';

/**
 * HKBU ChatGPT API Configuration
 */
const HKBU_API_KEY = process.env.HKBU_API_KEY;
const HKBU_BASE_URL = process.env.HKBU_BASE_URL;
const HKBU_MODEL = process.env.HKBU_MODEL;
const HKBU_API_VER = process.env.HKBU_API_VER;

/**
 * Get user's recent financial summary for context
 * @param {string} userId - User ID
 * @returns {Object} Financial summary
 */
const getUserFinancialSummary = async (userId) => {
    try {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1);

        // Get overall summary
        const overallSummary = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId)
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

        // Get last month spending by category
        const categorySpending = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
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

        // Get recent transactions (last 10)
        const recentTransactions = await Transaction.find({
            userId: new mongoose.Types.ObjectId(userId)
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
                totalBalance: parseFloat(overall.totalBalance.toFixed(2)),
                totalIncome: parseFloat(overall.totalIncome.toFixed(2)),
                totalExpense: parseFloat(Math.abs(overall.totalExpense).toFixed(2)),
                transactionCount: overall.transactionCount
            },
            topSpendingCategories: categorySpending.map(cat => ({
                category: cat._id,
                amount: parseFloat(Math.abs(cat.total).toFixed(2)),
                count: cat.count
            })),
            recentTransactions: recentTransactions.map(t => ({
                amount: t.amount,
                category: t.category,
                description: t.description,
                date: t.date.toISOString().split('T')[0],
                type: t.amount > 0 ? 'income' : 'expense'
            }))
        };
    } catch (error) {
        console.error('Error getting financial summary:', error);
        return null;
    }
};

/**
 * @desc    Get AI financial advice
 * @route   POST /api/ai/advice
 * @access  Private
 */
export const getAdvice = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { question, includeContext = true } = req.body;

        if (!question || question.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Question is required'
            });
        }

        // Build the prompt
        let prompt = question;
        let context = null;

        if (includeContext) {
            // Get user's financial summary
            context = await getUserFinancialSummary(req.user._id);

            if (context) {
                prompt = `As a financial advisor, please answer the following question based on the user's financial data:

User Financial Summary:
- Total Balance: $${context.overall.totalBalance}
- Total Income (all time): $${context.overall.totalIncome}
- Total Expenses (all time): $${context.overall.totalExpense}
- Number of Transactions: ${context.overall.transactionCount}

Top Spending Categories (Last Month):
${context.topSpendingCategories.map(cat => `- ${cat.category}: $${cat.amount} (${cat.count} transactions)`).join('\n')}

Recent Transactions:
${context.recentTransactions.map(t => `- ${t.date}: ${t.type === 'income' ? '+' : '-'}$${Math.abs(t.amount)} (${t.category}) ${t.description ? '- ' + t.description : ''}`).join('\n')}

User Question: ${question}

Please provide personalized financial advice based on this data. Be specific and actionable.`;
            }
        }

        // Call HKBU ChatGPT API
        const response = await axios.post(
            `${HKBU_BASE_URL}/chat/completions`,
            {
                model: HKBU_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful financial advisor. Provide concise, practical, and personalized financial advice. Be encouraging but realistic. Focus on actionable recommendations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 800
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': HKBU_API_KEY,
                    'api-version': HKBU_API_VER
                },
                timeout: 30000 // 30 second timeout
            }
        );

        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Invalid response from AI service'
            });
        }

        const aiResponse = response.data.choices[0].message.content;

        res.json({
            success: true,
            question: question,
            answer: aiResponse,
            context: includeContext ? context : null,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI advice error:', error);

        // Handle specific error types
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: 'AI service timeout. Please try again.'
            });
        }

        if (error.response) {
            // API returned an error
            const status = error.response.status;
            const message = error.response.data?.error?.message || 'AI service error';

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

        res.status(500).json({
            success: false,
            message: 'Failed to get AI advice',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get AI advice without financial context (general advice)
 * @route   POST /api/ai/general
 * @access  Private
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

        // Call HKBU ChatGPT API without context
        const response = await axios.post(
            `${HKBU_BASE_URL}/chat/completions`,
            {
                model: HKBU_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful financial advisor. Provide general financial advice, tips on budgeting, saving, investing, and personal finance management. Be practical and actionable.'
                    },
                    {
                        role: 'user',
                        content: question
                    }
                ],
                temperature: 0.7,
                max_tokens: 800
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': HKBU_API_KEY,
                    'api-version': HKBU_API_VER
                },
                timeout: 30000
            }
        );

        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Invalid response from AI service'
            });
        }

        const aiResponse = response.data.choices[0].message.content;

        res.json({
            success: true,
            question: question,
            answer: aiResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI general advice error:', error);

        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: 'AI service timeout. Please try again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to get AI advice',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export default {
    getAdvice,
    getGeneralAdvice
};
