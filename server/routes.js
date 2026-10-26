// Experiment 4: REST API design | Experiment 6: auth + roles
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, query } from 'express-validator';
import { User, Listing, Price, Conversation, Message, CATEGORIES } from './models.js';
import { auth, allow, validate } from './middleware.js';

const r = Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
const sign = u => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const pub = u => ({ id: u._id, name: u.name, email: u.email, role: u.role });
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ---------- Auth ---------- */
r.post('/auth/register', [
  body('name').trim().isLength({ min: 2 }), body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }), body('role').isIn(['farmer', 'buyer']), body('location').optional().trim().isLength({ max: 80 }), validate
], wrap(async (req, res) => {
  const { name, email, password, role, location } = req.body;   // role 'admin' is rejected by the validator above
  if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered' });
  const u = await User.create({ name, email, role, location, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(u), user: pub(u) });
}));

r.post('/auth/login', [body('email').isEmail().normalizeEmail(), body('password').notEmpty(), validate],
  wrap(async (req, res) => {
    const u = await User.findOne({ email: req.body.email }).select('+password');
    if (!u || !(await bcrypt.compare(req.body.password, u.password)))
      return res.status(401).json({ message: 'Wrong email or password' });
    res.json({ token: sign(u), user: pub(u) });
  }));

r.get('/auth/me', auth, wrap(async (req, res) => res.json({ user: pub(await User.findById(req.user.id)) })));

/* ---------- Listings (Exp 4: CRUD, search, filters, pagination) ---------- */
const listingRules = [
  body('crop').trim().isLength({ min: 2, max: 80 }), body('category').isIn(CATEGORIES),
  body('description').optional().trim().isLength({ max: 500 }),
  body('quantity').isFloat({ gt: 0 }), body('price').isFloat({ gt: 0 }),
  body('location').trim().isLength({ min: 2, max: 80 }), validate
];
// Only these fields can be set by the client (stops users from sending a "farmer" field to steal listings)
const fields = b => ({ crop: b.crop, category: b.category, description: b.description ?? '', quantity: b.quantity, price: b.price, location: b.location });

r.get('/listings', wrap(async (req, res) => {
  const { q, category, location, minPrice, maxPrice } = req.query;
  const f = {};
  if (q) f.crop = new RegExp(esc(q), 'i');
  if (category) f.category = String(category);
  if (location) f.location = new RegExp(esc(location), 'i');
  if (minPrice || maxPrice) f.price = { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) };
  const limit = Math.min(+req.query.limit || 9, 50), page = Math.max(+req.query.page || 1, 1);
  const [items, total] = await Promise.all([
    Listing.find(f).select('-enquiries').populate('farmer', 'name location').sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Listing.countDocuments(f)
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

r.get('/listings/mine', auth, allow('farmer'), wrap(async (req, res) =>
  res.json(await Listing.find({ farmer: req.user.id }).sort('-createdAt'))));   // must stay above /listings/:id

r.get('/listings/:id', wrap(async (req, res) => {
  const l = await Listing.findById(req.params.id).select('-enquiries').populate('farmer', 'name location');
  l ? res.json(l) : res.status(404).json({ message: 'Listing not found' });
}));

r.post('/listings', auth, allow('farmer'), listingRules, wrap(async (req, res) =>
  res.status(201).json(await Listing.create({ ...fields(req.body), farmer: req.user.id }))));

r.put('/listings/:id', auth, allow('farmer'), listingRules, wrap(async (req, res) => {
  const l = await Listing.findById(req.params.id);
  if (!l) return res.status(404).json({ message: 'Listing not found' });
  if (String(l.farmer) !== req.user.id) return res.status(403).json({ message: 'You can only edit your own listings' });
  Object.assign(l, fields(req.body));
  res.json(await l.save());
}));

r.delete('/listings/:id', auth, wrap(async (req, res) => {
  const l = await Listing.findById(req.params.id);
  if (!l) return res.status(404).json({ message: 'Listing not found' });
  if (String(l.farmer) !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Not allowed' });
  await l.deleteOne();
  res.json({ ok: true });
}));

// Older "enquiry" endpoint kept for compatibility; the chat below is the main way to contact a farmer now
r.post('/listings/:id/enquiry', auth, allow('buyer'),
  [body('message').trim().isLength({ min: 3, max: 300 }), validate], wrap(async (req, res) => {
    const u = await User.findById(req.user.id);
    const l = await Listing.findByIdAndUpdate(req.params.id,
      { $push: { enquiries: { buyerName: u.name, buyerEmail: u.email, message: req.body.message } } });
    if (!l) return res.status(404).json({ message: 'Listing not found' });
    res.status(201).json({ ok: true });
  }));

/* ---------- Mandi prices: live from data.gov.in if DATA_GOV_KEY set, else database ---------- */
r.get('/prices', wrap(async (req, res) => {
  const crop = req.query.crop ? String(req.query.crop) : '';
  const state = req.query.state ? String(req.query.state) : '';
  if (process.env.DATA_GOV_KEY) {
    try {
      const u = new URL('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070');
      u.search = new URLSearchParams({ 'api-key': process.env.DATA_GOV_KEY, format: 'json', limit: '60' });
      if (crop) u.searchParams.set('filters[commodity]', crop);
      if (state) u.searchParams.set('filters[state.keyword]', state);
      const j = await (await fetch(u, { signal: AbortSignal.timeout(6000) })).json();
      if (j.records?.length) return res.json(j.records.map((x, i) => ({
        _id: `live${i}`, crop: x.commodity, mandi: x.market, state: x.state,
        minPrice: +x.min_price, maxPrice: +x.max_price, modalPrice: +x.modal_price
      })));
    } catch { /* fall back to database */ }
  }
  const f = {};
  if (crop) f.crop = new RegExp(esc(crop), 'i');
  if (state) f.state = state;
  res.json(await Price.find(f).sort({ date: -1, crop: 1 }).limit(100));
}));

r.post('/prices', auth, allow('admin'), [
  body('crop').trim().notEmpty(), body('mandi').trim().notEmpty(),
  body('state').trim().notEmpty(), body('modalPrice').isFloat({ gt: 0 }), validate
], wrap(async (req, res) => res.status(201).json(await Price.create(req.body))));

/* ---------- Crop recommendation (rule based) ---------- */
const CROPS = [
  ['Soybean', ['black', 'red'], ['kharif'], 'medium'], ['Cotton', ['black'], ['kharif'], 'medium'],
  ['Jowar', ['black', 'red', 'sandy'], ['kharif', 'rabi'], 'low'], ['Bajra', ['sandy', 'red'], ['kharif'], 'low'],
  ['Rice', ['alluvial', 'black'], ['kharif'], 'high'], ['Sugarcane', ['black', 'alluvial'], ['kharif', 'zaid'], 'high'],
  ['Wheat', ['alluvial', 'black'], ['rabi'], 'medium'], ['Chickpea', ['black', 'red'], ['rabi'], 'low'],
  ['Maize', ['alluvial', 'red'], ['kharif', 'zaid'], 'medium'], ['Groundnut', ['sandy', 'red'], ['kharif', 'zaid'], 'low'],
  ['Onion', ['red', 'alluvial'], ['rabi', 'kharif'], 'medium'], ['Tomato', ['red', 'alluvial', 'sandy'], ['zaid', 'rabi'], 'medium'],
  ['Watermelon', ['sandy'], ['zaid'], 'low'], ['Mustard', ['alluvial', 'sandy'], ['rabi'], 'low']
];
r.get('/crops/recommend', [
  query('soil').isIn(['black', 'red', 'alluvial', 'sandy']),
  query('season').isIn(['kharif', 'rabi', 'zaid']),
  query('water').isIn(['low', 'medium', 'high']), validate
], (req, res) => {
  const { soil, season, water } = req.query;
  const out = CROPS
    .map(([crop, s, se, w]) => ({ crop, score: +s.includes(soil) + +se.includes(season) + +(w === water) }))
    .filter(c => c.score >= 2).sort((a, b) => b.score - a.score).slice(0, 5);
  res.json(out);
});

/* ---------- Users and admin (Exp 6) ---------- */
r.put('/users/me', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 60 }), body('phone').optional().trim().isLength({ max: 20 }),
  body('location').optional().trim().isLength({ max: 80 }), validate
], wrap(async (req, res) => {
  const { name, phone, location } = req.body;       // "role" is never read, so nobody can promote themselves
  const set = Object.fromEntries(Object.entries({ name, phone, location }).filter(([, v]) => v !== undefined));
  res.json({ user: pub(await User.findByIdAndUpdate(req.user.id, { $set: set }, { new: true, runValidators: true })) });
}));

r.get('/users/:id', wrap(async (req, res) => {       // public profile: no email, no phone
  const u = await User.findById(req.params.id).select('name role location');
  u ? res.json(u) : res.status(404).json({ message: 'User not found' });
}));

r.get('/admin/users', auth, allow('admin'), wrap(async (req, res) =>
  res.json(await User.find().sort('-createdAt').limit(200))));

r.delete('/admin/users/:id', auth, allow('admin'), wrap(async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ message: 'You cannot delete your own account' });
  const u = await User.findByIdAndDelete(req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  await Listing.deleteMany({ farmer: u._id });
  res.json({ ok: true });
}));

/* ---------- Conversations (Exp 8; live messages travel over Socket.IO, see socket.js) ---------- */
const inConv = (c, id) => c && [String(c.farmer), String(c.buyer)].includes(String(id));

r.post('/conversations', auth, allow('buyer'), [body('listingId').isMongoId(), validate], wrap(async (req, res) => {
  const l = await Listing.findById(req.body.listingId);
  if (!l) return res.status(404).json({ message: 'Listing not found' });
  const c = await Conversation.findOneAndUpdate({ listing: l._id, buyer: req.user.id },
    { $setOnInsert: { farmer: l.farmer } }, { upsert: true, new: true });
  res.status(201).json(c);
}));

r.get('/conversations', auth, wrap(async (req, res) =>
  res.json(await Conversation.find({ $or: [{ farmer: req.user.id }, { buyer: req.user.id }] })
    .populate('listing', 'crop').populate('farmer', 'name').populate('buyer', 'name').sort('-updatedAt'))));

r.get('/conversations/:id/messages', auth, wrap(async (req, res) => {
  const c = await Conversation.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Conversation not found' });
  if (!inConv(c, req.user.id)) return res.status(403).json({ message: 'Not your conversation' });
  await c.populate([{ path: 'listing', select: 'crop' }, { path: 'farmer', select: 'name' }, { path: 'buyer', select: 'name' }]);
  res.json({ conversation: c, messages: await Message.find({ conversation: c._id }).sort('createdAt').limit(200) });
}));

export default r;
