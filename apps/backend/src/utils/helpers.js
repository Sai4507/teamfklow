import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import config from '../config/index.js';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

export const hashPassword = async (password) => {
  return bcryptjs.hash(password, 10);
};

export const comparePasswords = async (password, hash) => {
  return bcryptjs.compare(password, hash);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const parseFilters = (filters) => {
  if (!filters) return {};
  try {
    return typeof filters === 'string' ? JSON.parse(filters) : filters;
  } catch {
    return {};
  }
};

export const paginate = (page = 1, limit = 20) => {
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
  return { offset, limit: Math.max(1, parseInt(limit, 10)) };
};

export const buildFilterQuery = (filters, allowedFields) => {
  const conditions = [];
  const values = [];
  let paramCount = 1;
  
  for (const [key, value] of Object.entries(filters)) {
    if (allowedFields.includes(key) && value !== undefined && value !== null && value !== '') {
      conditions.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }
  
  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values
  };
};
