import express, { Request, Response } from 'express';
import { AuthRequest, requireRole } from '../middleware/auth';
import { query } from '../database';

const router = express.Router();

// Crear ronda
router.post('/', requireRole('SUPERVISOR', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { titulo, descripcion, locacion, fecha } = req.body;

  if (!titulo || !locacion) {
    return res.status(400).json({ error: 'Required fields: titulo, locacion' });
  }

  try {
    const result = await query(
      'INSERT INTO rondas (titulo, descripcion, locacion, supervisor_id, fecha, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, titulo, supervisor_id, created_at',
      [titulo, descripcion || '', locacion, req.user?.id, fecha || new Date()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create round' });
  }
});

// Obtener rondas
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    let result;

    if (req.user?.role === 'SUPER_ADMIN') {
      result = await query('SELECT id, titulo, locacion, supervisor_id, fecha, created_at FROM rondas ORDER BY created_at DESC');
    } else {
      result = await query(
        'SELECT id, titulo, locacion, supervisor_id, fecha, created_at FROM rondas WHERE supervisor_id = $1 ORDER BY created_at DESC',
        [req.user?.id]
      );
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rounds' });
  }
});

// Actualizar ronda
router.put('/:id', requireRole('SUPERVISOR', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { titulo, descripcion, locacion } = req.body;

  try {
    const result = await query(
      'UPDATE rondas SET titulo = $1, descripcion = $2, locacion = $3 WHERE id = $4 AND (supervisor_id = $5 OR $6 = \'SUPER_ADMIN\') RETURNING id, titulo',
      [titulo, descripcion, locacion, id, req.user?.id, req.user?.role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Round not found or no permission' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update round' });
  }
});

export default router;
