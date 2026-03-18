import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

/**
 * @desc    Get spending by category for current user
 * @route   GET /api/stats/category
 * @access  Private
 */
export const getSpendingByCategory = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.date = {};
            if (startDate) dateFilter.date.$gte = new Date(startDate);
            if (endDate) dateFilter.date.$lte = new Date(endDate);
        }

        // Aggregate spending by category
        const categoryStats = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.user._id),
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    income: {
                        $sum: {
                            $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
                        }
                    },
                    expense: {
                        $sum: {
                            $cond: [{ $lt: ['$amount', 0] }, '$amount', 0]
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { total: 1 }
            }
        ]);

        // Format the response
        const formattedStats = categoryStats.map(stat => ({
            category: stat._id,
            total: parseFloat(stat.total.toFixed(2)),
            income: parseFloat(stat.income.toFixed(2)),
            expense: parseFloat(Math.abs(stat.expense).toFixed(2)),
            count: stat.count
        }));

        res.json({
            success: true,
            count: formattedStats.length,
            stats: formattedStats
        });
    } catch (error) {
        console.error('Get spending by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get monthly spending for current user
 * @route   GET /api/stats/monthly
 * @access  Private
 */
export const getMonthlySpending = async (req, res) => {
    try {
        const { months = 6 } = req.query;
        const monthsCount = parseInt(months);

        // Calculate start date
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - monthsCount);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        // Aggregate monthly spending
        const monthlyStats = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.user._id),
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    total: { $sum: '$amount' },
                    income: {
                        $sum: {
                            $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
                        }
                    },
                    expense: {
                        $sum: {
                            $cond: [{ $lt: ['$amount', 0] }, '$amount', 0]
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Format the response
        const formattedStats = monthlyStats.map(stat => ({
            year: stat._id.year,
            month: stat._id.month,
            monthName: new Date(stat._id.year, stat._id.month - 1).toLocaleString('default', { month: 'short' }),
            total: parseFloat(stat.total.toFixed(2)),
            income: parseFloat(stat.income.toFixed(2)),
            expense: parseFloat(Math.abs(stat.expense).toFixed(2)),
            count: stat.count
        }));

        res.json({
            success: true,
            count: formattedStats.length,
            stats: formattedStats
        });
    } catch (error) {
        console.error('Get monthly spending error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get daily spending for last N days
 * @route   GET /api/stats/daily
 * @access  Private
 */
export const getDailySpending = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const daysCount = parseInt(days);

        // Calculate start date
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysCount);
        startDate.setHours(0, 0, 0, 0);

        // Aggregate daily spending
        const dailyStats = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.user._id),
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$date' }
                    },
                    total: { $sum: '$amount' },
                    income: {
                        $sum: {
                            $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
                        }
                    },
                    expense: {
                        $sum: {
                            $cond: [{ $lt: ['$amount', 0] }, '$amount', 0]
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id': 1 }
            }
        ]);

        // Format the response
        const formattedStats = dailyStats.map(stat => ({
            date: stat._id,
            total: parseFloat(stat.total.toFixed(2)),
            income: parseFloat(stat.income.toFixed(2)),
            expense: parseFloat(Math.abs(stat.expense).toFixed(2)),
            count: stat.count
        }));

        res.json({
            success: true,
            count: formattedStats.length,
            stats: formattedStats
        });
    } catch (error) {
        console.error('Get daily spending error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get dashboard summary for current user
 * @route   GET /api/stats/summary
 * @access  Private
 */
export const getDashboardSummary = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Overall summary
        const overallSummary = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.user._id)
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

        // This month summary
        const thisMonthSummary = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.user._id),
                    date: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    income: {
                        $sum: {
                            $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
                        }
                    },
                    expense: {
                        $sum: {
                            $cond: [{ $lt: ['$amount', 0] }, '$amount', 0]
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Last month summary
        const lastMonthSummary = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.user._id),
                    date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    income: {
                        $sum: {
                            $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
                        }
                    },
                    expense: {
                        $sum: {
                            $cond: [{ $lt: ['$amount', 0] }, '$amount', 0]
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Top spending categories (expenses only)
        const topCategories = await Transaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.user._id),
                    amount: { $lt: 0 }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' }
                }
            },
            {
                $sort: { total: 1 }
            },
            {
                $limit: 5
            }
        ]);

        const overall = overallSummary[0] || {
            totalBalance: 0,
            totalIncome: 0,
            totalExpense: 0,
            transactionCount: 0
        };

        const thisMonth = thisMonthSummary[0] || { income: 0, expense: 0, count: 0 };
        const lastMonth = lastMonthSummary[0] || { income: 0, expense: 0, count: 0 };

        res.json({
            success: true,
            summary: {
                overall: {
                    totalBalance: parseFloat(overall.totalBalance.toFixed(2)),
                    totalIncome: parseFloat(overall.totalIncome.toFixed(2)),
                    totalExpense: parseFloat(Math.abs(overall.totalExpense).toFixed(2)),
                    transactionCount: overall.transactionCount
                },
                thisMonth: {
                    income: parseFloat(thisMonth.income.toFixed(2)),
                    expense: parseFloat(Math.abs(thisMonth.expense).toFixed(2)),
                    net: parseFloat((thisMonth.income + thisMonth.expense).toFixed(2)),
                    count: thisMonth.count
                },
                lastMonth: {
                    income: parseFloat(lastMonth.income.toFixed(2)),
                    expense: parseFloat(Math.abs(lastMonth.expense).toFixed(2)),
                    net: parseFloat((lastMonth.income + lastMonth.expense).toFixed(2)),
                    count: lastMonth.count
                }
            },
            topCategories: topCategories.map(cat => ({
                category: cat._id,
                amount: parseFloat(Math.abs(cat.total).toFixed(2))
            }))
        });
    } catch (error) {
        console.error('Get dashboard summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export default {
    getSpendingByCategory,
    getMonthlySpending,
    getDailySpending,
    getDashboardSummary
};
