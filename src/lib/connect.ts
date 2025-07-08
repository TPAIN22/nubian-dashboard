import mongoose from 'mongoose'

export const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!)
        ('Connected to MongoDB')
    } catch (error) {
        (error)
    }
} 