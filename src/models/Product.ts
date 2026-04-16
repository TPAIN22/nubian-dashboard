import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  merchantId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
  category: mongoose.Types.ObjectId;
  attributes: Map<string, string>; // e.g. { size: 'XL', color: 'red' }
  isActive: boolean;
  isFlagged: boolean;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'MerchantApplication', required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    stock: { type: Number, default: 0 },
    images: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    attributes: { type: Map, of: String },
    isActive: { type: Boolean, default: true },
    isFlagged: { type: Boolean, default: false },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
