import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: string; // Clerk User ID
  merchantId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress: {
    fullName: string;
    phone: string;
    city: string;
    address: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String }
});

const OrderSchema: Schema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'MerchantApplication', required: true, index: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true }
    }
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
