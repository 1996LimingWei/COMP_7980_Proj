import express from 'express';
import { body } from 'express-validator';
import {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getRecentTransactions
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions for logged in user
 * @access  Private
 */
router.get('/', getTransactions);

/**
 * @route   GET /api/transactions/recent
 * @desc    Get recent transactions
 * @access  Private
 */
router.get('/recent', getRecentTransactions);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get single transaction
 * @access  Private
 */
router.get('/:id', getTransaction);

/**
 * @route   POST /api/transactions
 * @desc    Create new transaction
 * @access  Private
 */
router.post(
    '/',
    [
        body('amount')
            .notEmpty()
            .withMessage('Amount is required')
            .isFloat({ min: -999999, max: 999999 })
            .withMessage('Amount must be a valid number')
            .custom((value) => value !== 0)
            .withMessage('Amount cannot be zero'),
        body('category')
            .notEmpty()
            .withMessage('Category is required')
            .isIn([
                'Food & Dining',
                'Shopping',
                'Bills & Utilities',
                'Transport',
                'Healthcare',
                'Entertainment',
                'Income',
                'Transfer',
                'Other'
            ])
            .withMessage('Invalid category'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters'),
        body('date')
            .optional()
            .isISO8601()
            .withMessage('Invalid date format')
            .toDate()
    ],
    createTransaction
);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction
 * @access  Private
 */
router.put(
    '/:id',
    [
        body('amount')
            .optional()
            .isFloat({ min: -999999, max: 999999 })
            .withMessage('Amount must be a valid number')
            .custom((value) => value !== 0)
            .withMessage('Amount cannot be zero'),
        body('category')
            .optional()
            .isIn([
                'Food & Dining',
                'Shopping',
                'Bills & Utilities',
                'Transport',
                'Healthcare',
                'Entertainment',
                'Income',
                'Transfer',
                'Other'
            ])
            .withMessage('Invalid category'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters'),
        body('date')
            .optional()
            .isISO8601()
            .withMessage('Invalid date format')
            .toDate()
    ],
    updateTransaction
);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction
 * @access  Private
 */
router.delete('/:id', deleteTransaction);

export default router;
