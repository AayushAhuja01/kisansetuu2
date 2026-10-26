import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Price, Listing } from './models.js';

await mongoose.connect(process.env.MONGO_URI);
const rows = [  // sample data: crop, mandi, state, min, max, modal (Rs/quintal)
  ['Soybean', 'Latur', 'Maharashtra', 4300, 4650, 4500], ['Turmeric', 'Sangli', 'Maharashtra', 12000, 14500, 13200],
  ['Jowar', 'Kolhapur', 'Maharashtra', 2800, 3400, 3100], ['Onion', 'Nashik', 'Maharashtra', 1400, 2200, 1800],
  ['Tomato', 'Pune', 'Maharashtra', 1200, 2000, 1600], ['Chickpea', 'Latur', 'Maharashtra', 5400, 5900, 5650],
  ['Wheat', 'Indore', 'Madhya Pradesh', 2400, 2700, 2550], ['Rice', 'Ludhiana', 'Punjab', 2900, 3300, 3100],
  ['Cotton', 'Rajkot', 'Gujarat', 6800, 7300, 7050], ['Groundnut', 'Rajkot', 'Gujarat', 5500, 6200, 5900],
  ['Maize', 'Hubli', 'Karnataka', 2000, 2300, 2150], ['Potato', 'Lucknow', 'Uttar Pradesh', 1000, 1500, 1250]
];
await Price.deleteMany({});
await Price.insertMany(rows.map(([crop, mandi, state, minPrice, maxPrice, modalPrice]) =>
  ({ crop, mandi, state, minPrice, maxPrice, modalPrice })));
const hash = p => bcrypt.hash(p, 10);
const ensure = async (email, data) => (await User.findOne({ email })) || User.create({ email, ...data });
await ensure('admin@kisansetu.in', { name: 'Admin', role: 'admin', password: await hash(process.env.ADMIN_PASSWORD || 'Admin@123') });
const farmer = await ensure('farmer@kisansetu.in', { name: 'Ramesh Patil', role: 'farmer', location: 'Kolhapur', password: await hash('Farmer@123') });
await ensure('buyer@kisansetu.in', { name: 'Sneha Traders', role: 'buyer', location: 'Pune', password: await hash('Buyer@123') });
if (!(await Listing.countDocuments()))
  await Listing.insertMany([
    ['Basmati Rice', 'Grains', 40, 3200, 'Kolhapur', 'Aged basmati, clean and sorted.'], ['Red Onion', 'Vegetables', 25, 1800, 'Nashik', 'Fresh harvest, medium size.'],
    ['Alphonso Mango', 'Fruits', 10, 9000, 'Ratnagiri', 'Hand picked, naturally ripened.'], ['Tur Dal', 'Pulses', 15, 7500, 'Latur', 'Unpolished, farm packed.']
  ].map(([crop, category, quantity, price, location, description]) => ({ crop, category, quantity, price, location, description, farmer: farmer._id })));
console.log('Seeded. Demo logins: admin@kisansetu.in, farmer@kisansetu.in (Farmer@123), buyer@kisansetu.in (Buyer@123)');
process.exit();
