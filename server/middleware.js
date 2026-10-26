// Experiments 5 & 6: JWT auth, role guard, input validation
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

export const auth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch (e) {
    res.status(401).json({ message: e.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Please log in' });
  }
};

export const allow = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Not allowed for your role' });

export const validate = (req, res, next) => {
  const e = validationResult(req);
  e.isEmpty() ? next() : res.status(400).json({ message: `Check the "${e.array()[0].path}" field` });
};
