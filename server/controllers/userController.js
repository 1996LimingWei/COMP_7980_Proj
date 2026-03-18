import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
export const updateProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email } = req.body;
        const userId = req.user._id;

        // Check if email is already taken by another user
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already in use'
                });
            }
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            { name, email },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get user with their transactions (using $lookup)
 * @route   GET /api/users/me/transactions
 * @access  Private
 */
export const getUserWithTransactions = async (req, res) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Use aggregation with $lookup to join transactions
        const result = await User.aggregate([
            { $match: { _id: req.user._id } },
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'transactions'
                }
            },
            {
                $project: {
                    password: 0
                }
            }
        ]);

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result[0];

        // Sort transactions by date (newest first) and paginate
        const sortedTransactions = user.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(skip, skip + parseInt(limit));

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            },
            transactions: sortedTransactions,
            pagination: {
                total: user.transactions.length,
                page: parseInt(page),
                pages: Math.ceil(user.transactions.length / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get user with transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get all users with their transaction counts (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'transactions'
                }
            },
            {
                $project: {
                    password: 0,
                    transactions: 0
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get user ranking by net balance (Admin only)
 * @route   GET /api/users/ranking
 * @access  Private/Admin
 */
export const getUserRanking = async (req, res) => {
    try {
        const ranking = await User.aggregate([
            {
                $lookup: {
                    from: 'transactions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'transactions'
                }
            },
            {
                $addFields: {
                    netBalance: {
                        $sum: '$transactions.amount'
                    },
                    totalIncome: {
                        $sum: {
                            $filter: {
                                input: '$transactions',
                                as: 'transaction',
                                cond: { $gt: ['$$transaction.amount', 0] }
                            }
                        }
                    },
                    totalExpense: {
                        $sum: {
                            $filter: {
                                input: '$transactions',
                                as: 'transaction',
                                cond: { $lt: ['$$transaction.amount', 0] }
                            }
                        }
                    },
                    transactionCount: { $size: '$transactions' }
                }
            },
            {
                $project: {
                    password: 0,
                    transactions: 0
                }
            },
            {
                $sort: { netBalance: -1 }
            }
        ]);

        res.json({
            success: true,
            count: ranking.length,
            ranking
        });
    } catch (error) {
        console.error('Get user ranking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export default {
    getProfile,
    updateProfile,
    getUserWithTransactions,
    getAllUsers,
    getUserRanking
};
