// Experiment 5: secure, production-ready setup | Experiment 8: Socket.IO attached to the same server
import 'dotenv/config';
import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import routes from './routes.js';
import { attachSocket } from './socket.js';

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) throw new Error('Set JWT_SECRET and MONGO_URI in .env');
const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');

const app = express();
app.set('trust proxy', 1);                       // needed behind Render's proxy
app.use(helmet());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());                        // removes $ and . from input so nobody can inject MongoDB operators
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));

app.get('/api/health', (_, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
app.use('/api', routes);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  const bad = err.name === 'CastError';
  if (!bad) console.error(err);
  res.status(bad ? 400 : 500).json({ message: bad ? 'Invalid id' : 'Server error' });
});

await mongoose.connect(process.env.MONGO_URI);
const server = http.createServer(app);
attachSocket(server, origins);
server.listen(process.env.PORT || 5000, () => console.log('KisanSetu API running'));
