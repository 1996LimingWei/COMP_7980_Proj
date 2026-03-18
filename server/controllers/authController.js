import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

/**
 * Generate JWT Token
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, password } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password
        });

        if (user) {
            // Generate token
            const token = generateToken(user._id);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt
                }
            });
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Demo credentials for testing
 */
const DEMO_CREDENTIALS = {
    email: 'demo@finance.app',
    password: 'demo123'
};

/**
 * @desc    Login user (including demo mode)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password, isDemo } = req.body;

        // Handle demo mode
        if (isDemo || (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password)) {
            // Find first admin user from mock data as demo user
            let demoUser = await User.findOne({ role: 'admin' });

            // If no admin, find any user
            if (!demoUser) {
                demoUser = await User.findOne();
            }

            if (demoUser) {
                const token = generateToken(demoUser._id);
                return res.json({
                    success: true,
                    message: 'Demo login successful',
                    token,
                    user: {
                        _id: demoUser._id,
                        name: demoUser.name,
                        email: demoUser.email,
                        role: demoUser.role,
                        isDemo: true,
                        createdAt: demoUser.createdAt
                    }
                });
            }
        }

        // Regular login
        const user = await User.findOne({ email }).select('+password');

        // Check if user exists and password matches
        if (user && (await user.comparePassword(password))) {
            // Generate token
            const token = generateToken(user._id);

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
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
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export default { register, login, getMe };
