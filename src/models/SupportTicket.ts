import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportMessage {
  sender: string;
  role: 'user' | 'support' | 'system';
  text: string;
  timestamp: Date;
}

export interface ISupportTicket extends Document {
  ticketId: string; // e.g. NB-2026-0001
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  description: string;
  type: 'support' | 'complaint' | 'inquiry';
  category: 'fraud' | 'order_issue' | 'health_risk' | 'payment_issue' | 'other';
  status: 'open' | 'escalated' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  riskScore: number;
  slaDue: Date;
  relatedOrder?: {
    id: string;
    amount: number;
    merchantId?: string;
  };
  messages: ISupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema({
  sender: { type: String, required: true },
  role: { type: String, enum: ['user', 'support', 'system'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const SupportTicketSchema: Schema = new Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['support', 'complaint', 'inquiry'], default: 'support' },
    category: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['open', 'escalated', 'resolved', 'closed'], 
      default: 'open' 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'medium' 
    },
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    slaDue: { type: Date, required: true },
    relatedOrder: {
      id: { type: String },
      amount: { type: Number },
      merchantId: { type: String }
    },
    messages: [SupportMessageSchema]
  },
  { timestamps: true }
);

const SupportTicket = mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

export default SupportTicket;
