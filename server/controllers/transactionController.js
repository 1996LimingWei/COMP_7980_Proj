import Transaction from '../models/Transaction.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Get all transactions for logged in user
 * @route   GET /api/transactions
 * @access  Private
 */
export const getTransactions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            sortBy = 'date',
            sortOrder = 'desc',
            category,
            startDate,
            endDate,
            type
        } = req.query;

        // Build filter object
        const filter = { userId: req.user._id };

        // Category filter
        if (category) {
            filter.category = category;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        // Type filter (income/expense)
        if (type) {
            if (type === 'income') {
                filter.amount = { $gt: 0 };
            } else if (type === 'expense') {
                filter.amount = { $lt: 0 };
            }
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const transactions = await Transaction.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Transaction.countDocuments(filter);

        // Calculate summary statistics
        const stats = await Transaction.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
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
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            count: transactions.length,
            total,
            pagination: {
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            },
            summary: stats.length > 0 ? {
                totalBalance: stats[0].totalAmount,
                totalIncome: stats[0].totalIncome,
                totalExpense: stats[0].totalExpense,
                transactionCount: stats[0].count
            } : {
                totalBalance: 0,
                totalIncome: 0,
                totalExpense: 0,
                transactionCount: 0
            },
            transactions
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get single transaction
 * @route   GET /api/transactions/:id
 * @access  Private
 */
export const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            transaction
        });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Create new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
export const createTransaction = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { amount, category, description, date } = req.body;

        // Create transaction
        const transaction = await Transaction.create({
            userId: req.user._id,
            amount: parseFloat(amount),
            category,
            description: description || '',
            date: date ? new Date(date) : new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            transaction
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Update transaction
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
export const updateTransaction = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { amount, category, description, date } = req.body;

        // Find transaction and ensure ownership
        let transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        // If not found and user is admin, allow update
        if (!transaction && req.user.role === 'admin') {
            transaction = await Transaction.findById(req.params.id);
        }

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Update fields
        if (amount !== undefined) transaction.amount = parseFloat(amount);
        if (category) transaction.category = category;
        if (description !== undefined) transaction.description = description;
        if (date) transaction.date = new Date(date);

        await transaction.save();

        res.json({
            success: true,
            message: 'Transaction updated successfully',
            transaction
        });
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Delete transaction
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
export const deleteTransaction = async (req, res) => {
    try {
        // Find transaction and ensure ownership
        let transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        // If not found and user is admin, allow delete
        if (!transaction && req.user.role === 'admin') {
            transaction = await Transaction.findById(req.params.id);
        }

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        await Transaction.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get recent transactions
 * @route   GET /api/transactions/recent
 * @access  Private
 */
export const getRecentTransactions = async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const transactions = await Transaction.find({ userId: req.user._id })
            .sort({ date: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: transactions.length,
            transactions
        });
    } catch (error) {
        console.error('Get recent transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export default {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getRecentTransactions
};
