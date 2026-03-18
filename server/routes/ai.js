import express from 'express';
import { body } from 'express-validator';
import { getAdvice, getGeneralAdvice } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/ai/advice
 * @desc    Get AI financial advice with user's financial context
 * @access  Private
 */
router.post(
    '/advice',
    [
        body('question')
            .trim()
            .notEmpty()
            .withMessage('Question is required')
            .isLength({ max: 500 })
            .withMessage('Question cannot exceed 500 characters'),
        body('includeContext')
            .optional()
            .isBoolean()
            .withMessage('includeContext must be a boolean')
    ],
    getAdvice
);

/**
 * @route   POST /api/ai/general
 * @desc    Get general AI financial advice without user context
 * @access  Private
 */
router.post(
    '/general',
    [
        body('question')
            .trim()
            .notEmpty()
            .withMessage('Question is required')
            .isLength({ max: 500 })
            .withMessage('Question cannot exceed 500 characters')
    ],
    getGeneralAdvice
);

export default router;
