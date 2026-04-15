import express, { Request, Response } from 'express';
import { AuthRequest, requireRole } from '../middleware/auth';
import { getClient, query } from '../database';
import { canViewStructuredReport } from '../utils/report-structure';

const router = express.Router();

// Crear ronda y reporte en una sola operación
router.post('/complete', requireRole('SUPERVISOR', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { titulo, descripcion, locacion, fecha } = req.body;

  if (!titulo || !descripcion || !locacion) {
    return res.status(400).json({ error: 'Required fields: titulo, descripcion, locacion' });
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const roundResult = await client.query(
      'INSERT INTO rondas (titulo, descripcion, locacion, supervisor_id, fecha, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, titulo, descripcion, locacion, supervisor_id, fecha, created_at',
      [titulo, descripcion, locacion, req.user?.id, fecha || new Date()]
    );

    const reportResult = await client.query(
      'INSERT INTO reportes (titulo, descripcion, locacion, supervisor_id, fecha, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, titulo, descripcion, locacion, supervisor_id, fecha, created_at',
      [titulo, descripcion, locacion, req.user?.id, fecha || new Date()]
    );

    await client.query('COMMIT');

    res.status(201).json({
      round: roundResult.rows[0],
      report: reportResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Failed to complete round' });
  } finally {
    client.release();
  }
});

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
    const result = await query('SELECT id, titulo, descripcion, locacion, supervisor_id, fecha, created_at FROM rondas ORDER BY created_at DESC');

    if (req.user?.role === 'SUPER_ADMIN') {
      return res.json(result.rows);
    }

    const filteredRows = result.rows.filter((row) => {
      if (row.supervisor_id === req.user?.id) {
        return true;
      }

      return canViewStructuredReport(row.descripcion || '', {
        id: req.user!.id,
        role: req.user!.role,
      });
    });

    res.json(filteredRows);
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
