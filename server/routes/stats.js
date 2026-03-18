import express from 'express';
import {
    getSpendingByCategory,
    getMonthlySpending,
    getDailySpending,
    getDashboardSummary
} from '../controllers/statsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/stats/summary
 * @desc    Get dashboard summary for current user
 * @access  Private
 */
router.get('/summary', getDashboardSummary);

/**
 * @route   GET /api/stats/category
 * @desc    Get spending by category for current user
 * @access  Private
 */
router.get('/category', getSpendingByCategory);

/**
 * @route   GET /api/stats/monthly
 * @desc    Get monthly spending for current user
 * @access  Private
 */
router.get('/monthly', getMonthlySpending);

/**
 * @route   GET /api/stats/daily
 * @desc    Get daily spending for last N days
 * @access  Private
 */
router.get('/daily', getDailySpending);

export default router;
