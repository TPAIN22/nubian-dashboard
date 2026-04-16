import mongoose from 'mongoose';
import logger from './logger';

// Cached connection for Next.js production & dev HMR compatibility
let cachedConnection: typeof mongoose | null = null;

export const connect = async () => {
    // Return existing connection if ready
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }

    try {
        cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
            bufferCommands: false,
        });
        logger.info('MongoDB connected successfully');
        return cachedConnection;
    } catch (error) {
        cachedConnection = null;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('MongoDB connection error', { error: errorMessage });
        throw error;
    }
};