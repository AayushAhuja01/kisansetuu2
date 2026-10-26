// Experiment 4: Mongoose schemas
import mongoose from 'mongoose';
const { Schema, model } = mongoose;
export const CATEGORIES = ['Grains', 'Vegetables', 'Fruits', 'Pulses', 'Dairy', 'Spices', 'Other'];

export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['farmer', 'buyer', 'admin'], default: 'buyer' },
  phone: { type: String, trim: true, maxlength: 20 },
  location: { type: String, trim: true, maxlength: 80 }
}, { timestamps: true }));

const enquiry = new Schema({
  buyerName: String, buyerEmail: String,
  message: { type: String, required: true, maxlength: 300 }
}, { timestamps: true });

export const Listing = model('Listing', new Schema({
  crop: { type: String, required: true, trim: true, maxlength: 80 },   // product title
  category: { type: String, enum: CATEGORIES, default: 'Other' },
  description: { type: String, maxlength: 500, default: '' },
  images: [String],                                                    // image URLs
  quantity: { type: Number, required: true, min: 0.1 },   // quintal
  price: { type: Number, required: true, min: 1 },        // Rs per quintal
  location: { type: String, required: true, trim: true },
  farmer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  enquiries: [enquiry]
}, { timestamps: true }));

export const Price = model('Price', new Schema({
  crop: { type: String, required: true, index: true },
  mandi: { type: String, required: true },
  state: { type: String, required: true },
  minPrice: Number, maxPrice: Number,
  modalPrice: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}));

// Experiment 8: a conversation is one buyer talking to one farmer about one listing
const conv = new Schema({
  listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  farmer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
conv.index({ listing: 1, buyer: 1 }, { unique: true });
export const Conversation = model('Conversation', conv);

export const Message = model('Message', new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 1000 }
}, { timestamps: true }));
