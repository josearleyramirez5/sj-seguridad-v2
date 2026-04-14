import express, { Response } from 'express';
import { AuthRequest, requireRole } from '../middleware/auth';
import { query } from '../database';
import { createNotificationForRole, createNotificationForUser } from '../utils/notifications';

const router = express.Router();

router.post('/', requireRole('SUPERVISOR', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { titulo, descripcion, locacion, severidad } = req.body;

  if (!titulo || !descripcion || !locacion || !severidad) {
    return res.status(400).json({ error: 'Required fields: titulo, descripcion, locacion, severidad' });
  }

  try {
    const result = await query(
      'INSERT INTO incidencias (titulo, descripcion, locacion, supervisor_id, severidad, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, titulo, descripcion, locacion, supervisor_id, severidad, created_at, updated_at',
      [titulo, descripcion, locacion, req.user?.id, severidad]
    );

    await createNotificationForUser(
      req.user!.id,
      'Incidencia registrada',
      `La incidencia ${titulo} fue registrada con severidad ${severidad}.`
    );

    await createNotificationForRole(
      'SUPER_ADMIN',
      'Nueva incidencia registrada',
      `${req.user?.email} registró la incidencia ${titulo} en ${locacion}.`
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = req.user?.role === 'SUPER_ADMIN'
      ? await query('SELECT id, titulo, descripcion, locacion, supervisor_id, severidad, created_at, updated_at FROM incidencias ORDER BY created_at DESC')
      : await query(
        'SELECT id, titulo, descripcion, locacion, supervisor_id, severidad, created_at, updated_at FROM incidencias WHERE supervisor_id = $1 ORDER BY created_at DESC',
        [req.user?.id]
      );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

router.put('/:id', requireRole('SUPERVISOR', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { titulo, descripcion, locacion, severidad } = req.body;

  try {
    const result = await query(
      'UPDATE incidencias SET titulo = $1, descripcion = $2, locacion = $3, severidad = $4, updated_at = NOW() WHERE id = $5 AND (supervisor_id = $6 OR $7 = \'SUPER_ADMIN\') RETURNING id, titulo, descripcion, locacion, supervisor_id, severidad, created_at, updated_at',
      [titulo, descripcion, locacion, severidad, id, req.user?.id, req.user?.role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found or no permission' });
    }

    await createNotificationForUser(
      result.rows[0].supervisor_id,
      'Incidencia actualizada',
      `La incidencia ${titulo} fue actualizada con severidad ${severidad}.`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

router.delete('/:id', requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM incidencias WHERE id = $1 RETURNING id, titulo, supervisor_id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    await createNotificationForUser(
      result.rows[0].supervisor_id,
      'Incidencia eliminada',
      `La incidencia ${result.rows[0].titulo} fue eliminada por un administrador.`
    );

    res.json({ message: 'Incident deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete incident' });
  }
});

export default router;