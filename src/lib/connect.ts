import mongoose from 'mongoose';
import logger from './logger';

export const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        logger.info('MongoDB connected successfully');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('MongoDB connection error', { error: errorMessage });
        throw error; // Re-throw to allow error handling upstream
    }
} 