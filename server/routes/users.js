import express from 'express';
import { body } from 'express-validator';
import {
    getProfile,
    updateProfile,
    getUserWithTransactions,
    getAllUsers,
    getUserRanking
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, getProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Update user profile
 * @access  Private
 */
router.put(
    '/me',
    protect,
    [
        body('name')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Name cannot exceed 100 characters'),
        body('email')
            .optional()
            .trim()
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail()
    ],
    updateProfile
);

/**
 * @route   GET /api/users/me/transactions
 * @desc    Get user with their transactions (using $lookup)
 * @access  Private
 */
router.get('/me/transactions', protect, getUserWithTransactions);

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/', protect, adminOnly, getAllUsers);

/**
 * @route   GET /api/users/ranking
 * @desc    Get user ranking by net balance (Admin only)
 * @access  Private/Admin
 */
router.get('/ranking', protect, adminOnly, getUserRanking);

export default router;
