import express from 'express';
import { body, param } from 'express-validator';
import { getAdvice, getGeneralAdvice, clearConversationHistory } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/ai/advice
 * @desc    Get AI financial advice with user's financial context and conversation memory
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
        body('sessionId')
            .optional()
            .isString()
            .withMessage('sessionId must be a string')
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

/**
 * @route   DELETE /api/ai/conversation/:sessionId
 * @desc    Clear conversation history
 * @access  Private
 */
router.delete(
    '/conversation/:sessionId',
    [
        param('sessionId')
            .notEmpty()
            .withMessage('Session ID is required')
    ],
    clearConversationHistory
);

export default router;
