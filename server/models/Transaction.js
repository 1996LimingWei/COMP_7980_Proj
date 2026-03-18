import mongoose from 'mongoose';

/**
 * Transaction Schema
 * Represents a financial transaction (income or expense) for a user
 */
const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        validate: {
            validator: function (v) {
                return v !== 0;
            },
            message: 'Amount cannot be zero'
        }
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: [
                'Food & Dining',
                'Shopping',
                'Bills & Utilities',
                'Transport',
                'Healthcare',
                'Entertainment',
                'Income',
                'Transfer',
                'Other'
            ],
            message: 'Please select a valid category'
        }
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual to determine if transaction is income or expense
transactionSchema.virtual('type').get(function () {
    return this.amount > 0 ? 'income' : 'expense';
});

// Virtual for absolute amount
transactionSchema.virtual('absoluteAmount').get(function () {
    return Math.abs(this.amount);
});

// Index for faster queries by user and date
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

// Static method to get spending by category for a user
transactionSchema.statics.getSpendingByCategory = async function (userId, startDate, endDate) {
    const matchStage = { userId: new mongoose.Types.ObjectId(userId) };

    if (startDate || endDate) {
        matchStage.date = {};
        if (startDate) matchStage.date.$gte = new Date(startDate);
        if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$category',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { total: 1 } } // Sort by amount ascending (expenses first)
    ]);
};

// Static method to get monthly spending for a user
transactionSchema.statics.getMonthlySpending = async function (userId, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    return await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
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
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
};

// Static method to get daily spending for last N days
transactionSchema.statics.getDailySpending = async function (userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$date' }
                },
                total: { $sum: '$amount' },
                expense: {
                    $sum: {
                        $cond: [{ $lt: ['$amount', 0] }, '$amount', 0]
                    }
                }
            }
        },
        { $sort: { '_id': 1 } }
    ]);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
