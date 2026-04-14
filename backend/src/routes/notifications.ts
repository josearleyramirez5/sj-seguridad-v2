import express, { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../database';

const router = express.Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, usuario_id, titulo, descripcion, is_read, created_at FROM notificaciones WHERE usuario_id = $1 ORDER BY created_at DESC',
      [req.user?.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await query('UPDATE notificaciones SET is_read = TRUE WHERE usuario_id = $1 AND is_read = FALSE', [req.user?.id]);
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

router.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'UPDATE notificaciones SET is_read = TRUE WHERE id = $1 AND usuario_id = $2 RETURNING id, usuario_id, titulo, descripcion, is_read, created_at',
      [req.params.id, req.user?.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

export default router;