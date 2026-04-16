import mongoose, { Schema, Document } from 'mongoose';

export interface IMerchantApplication extends Document {
  userId: string;
  storeName: string;
  ownerName: string;
  phone: string;
  email: string;
  merchantType: 'individual' | 'business';
  nationalId: string;
  crNumber?: string;
  iban: string;
  logoUrl?: string;
  description: string;
  categories: string[];
  city: string;
  productSamples: string[];
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision' | 'suspended';
  rejectionReason?: string;
  revisionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantApplicationSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    storeName: { type: String, required: true },
    ownerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    merchantType: { type: String, enum: ['individual', 'business'], required: true },
    nationalId: { type: String, required: true },
    crNumber: { type: String }, // Optional for individuals
    iban: { type: String, required: true },
    logoUrl: { type: String },
    description: { type: String, required: true },
    categories: [{ type: String, required: true }],
    city: { type: String, required: true },
    productSamples: [{ type: String, required: true }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'needs_revision', 'suspended'],
      default: 'pending',
    },
    rejectionReason: { type: String },
    revisionNotes: { type: String },
  },
  { timestamps: true }
);

// Prevent edge case where Mongoose recompiles an existing model in Next.js HMR
const MerchantApplication =
  mongoose.models.MerchantApplication ||
  mongoose.model<IMerchantApplication>('MerchantApplication', MerchantApplicationSchema);

export default MerchantApplication;
