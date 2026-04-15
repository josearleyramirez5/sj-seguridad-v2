import express, { Request, Response } from 'express';
import { AuthRequest, requireRole } from '../middleware/auth';
import { query } from '../database';
import { createNotificationForRole, createNotificationForUser } from '../utils/notifications';
import { canViewStructuredReport, parseStructuredRoutingData, withGuardObservation } from '../utils/report-structure';

const router = express.Router();

// Crear reporte
router.post('/', requireRole('SUPERVISOR', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { titulo, descripcion, locacion, fecha } = req.body;

  if (!titulo || !descripcion || !locacion) {
    return res.status(400).json({ error: 'Required fields: titulo, descripcion, locacion' });
  }

  try {
    const result = await query(
      'INSERT INTO reportes (titulo, descripcion, locacion, supervisor_id, fecha, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, titulo, descripcion, locacion, supervisor_id, fecha, created_at',
      [titulo, descripcion, locacion, req.user?.id, fecha || new Date()]
    );

    await createNotificationForUser(
      req.user!.id,
      'Reporte registrado',
      `El reporte ${titulo} fue creado correctamente.`
    );

    await createNotificationForRole(
      'SUPER_ADMIN',
      'Nuevo reporte registrado',
      `${req.user?.email} registró el reporte ${titulo} en ${locacion}.`
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
    const result = await query('SELECT id, titulo, descripcion, locacion, supervisor_id, fecha, created_at FROM reportes ORDER BY created_at DESC');

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
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Actualizar reporte
router.put('/:id', requireRole('SUPERVISOR', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { titulo, descripcion, locacion } = req.body;

  try {
    const currentReport = await query('SELECT descripcion, supervisor_id FROM reportes WHERE id = $1', [id]);

    if (currentReport.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found or no permission' });
    }

    const metadata = parseStructuredRoutingData(currentReport.rows[0].descripcion || '');
    const canEditAssignedReport = req.user?.role === 'SUPERVISOR' && metadata?.assignedSupervisor?.id === req.user.id;

    const result = await query(
      'UPDATE reportes SET titulo = $1, descripcion = $2, locacion = $3, updated_at = NOW() WHERE id = $4 AND (supervisor_id = $5 OR $6 = \'SUPER_ADMIN\') RETURNING id, titulo, descripcion, locacion, supervisor_id, fecha, created_at',
      [titulo, descripcion, locacion, id, req.user?.id, req.user?.role]
    );

    if (result.rows.length === 0 && canEditAssignedReport) {
      const assignedResult = await query(
        'UPDATE reportes SET titulo = $1, descripcion = $2, locacion = $3, updated_at = NOW() WHERE id = $4 RETURNING id, titulo, descripcion, locacion, supervisor_id, fecha, created_at',
        [titulo, descripcion, locacion, id]
      );

      if (assignedResult.rows.length > 0) {
        await createNotificationForUser(
          assignedResult.rows[0].supervisor_id,
          'Reporte actualizado',
          `El reporte ${titulo} fue actualizado en ${locacion}.`
        );

        return res.json(assignedResult.rows[0]);
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found or no permission' });
    }

    await createNotificationForUser(
      result.rows[0].supervisor_id,
      'Reporte actualizado',
      `El reporte ${titulo} fue actualizado en ${locacion}.`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

router.post('/:id/guard-observation', requireRole('GUARD'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { observation } = req.body;

  if (!observation || !String(observation).trim()) {
    return res.status(400).json({ error: 'Observation is required' });
  }

  try {
    const currentReport = await query('SELECT id, titulo, descripcion FROM reportes WHERE id = $1', [id]);

    if (currentReport.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const metadata = parseStructuredRoutingData(currentReport.rows[0].descripcion || '');

    if (!metadata || metadata.guard?.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const updatedDescription = withGuardObservation(currentReport.rows[0].descripcion, String(observation).trim());

    if (!updatedDescription) {
      return res.status(400).json({ error: 'Structured report data is required' });
    }

    const result = await query(
      'UPDATE reportes SET descripcion = $1, updated_at = NOW() WHERE id = $2 RETURNING id, titulo, descripcion, locacion, supervisor_id, fecha, created_at',
      [updatedDescription, id]
    );

    if (metadata.assignedSupervisor?.id) {
      await createNotificationForUser(
        metadata.assignedSupervisor.id,
        'Observación del guarda',
        `${req.user?.email} registró una observación sobre el reporte ${currentReport.rows[0].titulo}.`
      );
    }

    await createNotificationForRole(
      'SUPER_ADMIN',
      'Observación enviada por guarda',
      `${req.user?.email} envió una observación para el reporte ${currentReport.rows[0].titulo}.`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save guard observation' });
  }
});

// Eliminar reporte
router.delete('/:id', requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM reportes WHERE id = $1 RETURNING id, titulo, supervisor_id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await createNotificationForUser(
      result.rows[0].supervisor_id,
      'Reporte eliminado',
      `El reporte ${result.rows[0].titulo} fue eliminado por un administrador.`
    );

    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
