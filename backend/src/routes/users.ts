import express, { Request, Response } from 'express';
import { AuthRequest, requireRole } from '../middleware/auth';
import { query } from '../database';

const router = express.Router();

// Obtener todos los usuarios (Solo SUPER_ADMIN)
router.get('/', requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT id, nombre, email, role, is_active, created_at FROM usuarios ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Obtener usuario por rol (Solo SUPER_ADMIN)
router.get('/by-role/:role', requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { role } = req.params;
  
  try {
    const result = await query('SELECT id, nombre, email, role, is_active FROM usuarios WHERE role = $1', [role]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Obtener perfil actual
router.get('/profile/me', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT id, nombre, email, role, is_active FROM usuarios WHERE id = $1', [req.user?.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Actualizar usuario (Solo SUPER_ADMIN)
router.put('/:id', requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { nombre, role, is_active } = req.body;

  try {
    const result = await query(
      'UPDATE usuarios SET nombre = $1, role = $2, is_active = $3 WHERE id = $4 RETURNING id, nombre, email, role',
      [nombre, role, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Desactivar usuario (Solo SUPER_ADMIN)
router.delete('/:id', requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const result = await query(
      'UPDATE usuarios SET is_active = FALSE WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
