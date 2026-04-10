import express, { Request, Response } from 'express';
import { AuthRequest, requireRole } from '../middleware/auth';
import { query } from '../database';

const router = express.Router();

// Crear reporte
router.post('/', requireRole('SUPERVISOR', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { titulo, descripcion, locacion, fecha } = req.body;

  if (!titulo || !descripcion || !locacion) {
    return res.status(400).json({ error: 'Required fields: titulo, descripcion, locacion' });
  }

  try {
    const result = await query(
      'INSERT INTO reportes (titulo, descripcion, locacion, supervisor_id, fecha, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, titulo, supervisor_id, created_at',
      [titulo, descripcion, locacion, req.user?.id, fecha || new Date()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Obtener reportes
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    let result;

    if (req.user?.role === 'SUPER_ADMIN') {
      // Admin ve todos
      result = await query('SELECT id, titulo, descripcion, locacion, supervisor_id, fecha, created_at FROM reportes ORDER BY created_at DESC');
    } else {
      // Supervisor solo ve suyos
      result = await query(
        'SELECT id, titulo, descripcion, locacion, supervisor_id, fecha, created_at FROM reportes WHERE supervisor_id = $1 ORDER BY created_at DESC',
        [req.user?.id]
      );
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Actualizar reporte
router.put('/:id', requireRole('SUPERVISOR', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { titulo, descripcion, locacion } = req.body;

  try {
    const result = await query(
      'UPDATE reportes SET titulo = $1, descripcion = $2, locacion = $3 WHERE id = $4 AND (supervisor_id = $5 OR $6 = \'SUPER_ADMIN\') RETURNING id, titulo',
      [titulo, descripcion, locacion, id, req.user?.id, req.user?.role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found or no permission' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Eliminar reporte
router.delete('/:id', requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM reportes WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
