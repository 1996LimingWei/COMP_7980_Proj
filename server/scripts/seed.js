import mongoose from 'mongoose';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

/**
 * Parse date string from CSV (M/D/YYYY format)
 * @param {string} dateStr - Date string
 * @returns {Date} Parsed date
 */
const parseDate = (dateStr) => {
    if (!dateStr) return new Date();

    // Handle M/D/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const month = parseInt(parts[0]) - 1; // 0-indexed
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
    }

    return new Date(dateStr);
};

/**
 * Seed users from CSV file
 */
const seedUsers = async () => {
    return new Promise((resolve, reject) => {
        const users = [];
        // Try root Mock_Users.csv first, fallback to data/users.csv
        const rootCsvPath = path.join(__dirname, '../../Mock_Users.csv');
        const dataCsvPath = path.join(__dirname, '../data/users.csv');
        const usersCsvPath = fs.existsSync(rootCsvPath) ? rootCsvPath : dataCsvPath;

        console.log('Reading users from:', usersCsvPath);

        fs.createReadStream(usersCsvPath)
            .pipe(csv())
            .on('data', (row) => {
                // Validate role
                const validRoles = ['user', 'admin'];
                const role = validRoles.includes(row.role) ? row.role : 'user';

                users.push({
                    _id: new mongoose.Types.ObjectId(row._id),
                    name: row.name,
                    email: row.email.toLowerCase(),
                    password: row.password,
                    role: role
                });
            })
            .on('end', async () => {
                console.log(`Parsed ${users.length} users from CSV`);

                try {
                    // Clear existing users
                    await User.deleteMany({});
                    console.log('Cleared existing users');

                    // Hash passwords and insert users
                    const usersWithHashedPasswords = await Promise.all(
                        users.map(async (user) => {
                            const salt = await bcrypt.genSalt(10);
                            const hashedPassword = await bcrypt.hash(user.password, salt);
                            return {
                                ...user,
                                password: hashedPassword
                            };
                        })
                    );

                    await User.insertMany(usersWithHashedPasswords);
                    console.log(`Successfully seeded ${users.length} users`);
                    resolve(users.length);
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

/**
 * Sleep function for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Insert batch with retry logic for rate limiting
 * @param {Array} batch - Array of transactions to insert
 * @param {number} batchNumber - Current batch number
 * @param {number} totalBatches - Total number of batches
 */
const insertBatchWithRetry = async (batch, batchNumber, totalBatches) => {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await Transaction.insertMany(batch, { ordered: false });
            console.log(`Inserted batch ${batchNumber}/${totalBatches} (${batch.length} transactions)`);
            return;
        } catch (error) {
            // Check if it's a rate limiting error (16500)
            if (error.code === 16500 || error.message?.includes('16500')) {
                retries++;
                const delay = Math.min(1000 * Math.pow(2, retries), 10000); // Exponential backoff, max 10s
                console.log(`Rate limited on batch ${batchNumber}. Retrying in ${delay}ms... (attempt ${retries}/${maxRetries})`);
                await sleep(delay);
            } else {
                throw error; // Re-throw non-rate-limiting errors
            }
        }
    }

    throw new Error(`Failed to insert batch ${batchNumber} after ${maxRetries} retries`);
};

/**
 * Seed transactions from CSV file
 */
const seedTransactions = async () => {
    return new Promise((resolve, reject) => {
        const transactions = [];
        // Try root Mock_Transactions.csv first, fallback to data/transactions.csv
        const rootCsvPath = path.join(__dirname, '../../Mock_Transactions.csv');
        const dataCsvPath = path.join(__dirname, '../data/transactions.csv');
        const transactionsCsvPath = fs.existsSync(rootCsvPath) ? rootCsvPath : dataCsvPath;

        console.log('Reading transactions from:', transactionsCsvPath);

        fs.createReadStream(transactionsCsvPath)
            .pipe(csv())
            .on('data', (row) => {
                try {
                    // Validate category
                    const validCategories = [
                        'Food & Dining',
                        'Shopping',
                        'Bills & Utilities',
                        'Transport',
                        'Healthcare',
                        'Entertainment',
                        'Income',
                        'Transfer',
                        'Other'
                    ];

                    let category = row.category;
                    if (!validCategories.includes(category)) {
                        category = 'Other';
                    }

                    transactions.push({
                        _id: new mongoose.Types.ObjectId(row._id),
                        userId: new mongoose.Types.ObjectId(row.userId),
                        amount: parseFloat(row.amount),
                        category: category,
                        description: row.description || '',
                        date: parseDate(row.date)
                    });
                } catch (error) {
                    console.warn(`Skipping invalid transaction row:`, row, error.message);
                }
            })
            .on('end', async () => {
                console.log(`Parsed ${transactions.length} transactions from CSV`);

                try {
                    // Clear existing transactions with retry
                    let clearRetries = 0;
                    while (clearRetries < 5) {
                        try {
                            await Transaction.deleteMany({});
                            console.log('Cleared existing transactions');
                            break;
                        } catch (error) {
                            if (error.code === 16500 || error.message?.includes('16500')) {
                                clearRetries++;
                                await sleep(1000 * clearRetries);
                            } else {
                                throw error;
                            }
                        }
                    }

                    // Insert transactions in smaller batches with retry logic
                    const batchSize = 50; // Reduced from 100 to 50
                    const totalBatches = Math.ceil(transactions.length / batchSize);

                    for (let i = 0; i < transactions.length; i += batchSize) {
                        const batch = transactions.slice(i, i + batchSize);
                        const batchNumber = Math.floor(i / batchSize) + 1;
                        await insertBatchWithRetry(batch, batchNumber, totalBatches);

                        // Add a small delay between batches to avoid rate limiting
                        if (i + batchSize < transactions.length) {
                            await sleep(100);
                        }
                    }

                    console.log(`Successfully seeded ${transactions.length} transactions`);
                    resolve(transactions.length);
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

/**
 * Main seed function
 */
const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected to MongoDB');

        // Seed users first
        const userCount = await seedUsers();

        // Then seed transactions
        const transactionCount = await seedTransactions();

        console.log('\n✅ Database seeding completed successfully!');
        console.log(`   - Users: ${userCount}`);
        console.log(`   - Transactions: ${transactionCount}`);

        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Database seeding failed:', error);

        // Close connection if open
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }

        process.exit(1);
    }
};

// Run seed function
seedDatabase();
