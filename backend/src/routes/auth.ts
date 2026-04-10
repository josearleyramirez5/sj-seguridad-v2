import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database';

const router = express.Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await query('SELECT id, nombre, email, role, password_hash FROM usuarios WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register (Solo SUPER_ADMIN)
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, nombre, role } = req.body;
  const userId = req.headers['x-user-id'] as string;

  // Verificar que el usuario que crea sea SUPER_ADMIN
  try {
    const userResult = await query('SELECT role FROM usuarios WHERE id = $1', [userId]);
    if (!userResult.rows.length || userResult.rows[0].role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only SUPER_ADMIN can create users' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }

  if (!email || !password || !nombre || !role) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await query(
      'INSERT INTO usuarios (email, password_hash, nombre, role, is_active, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, email, nombre, role',
      [email, passwordHash, nombre, role, true]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

export default router;
