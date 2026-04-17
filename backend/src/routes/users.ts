import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest, requireRole } from '../middleware/auth';
import { getClient, query } from '../database';
import { createNotificationForRole, createNotificationForUser } from '../utils/notifications';

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

// Obtener usuario por rol
router.get('/by-role/:role', requireRole('SUPER_ADMIN', 'SUPERVISOR'), async (req: AuthRequest, res: Response) => {
  const { role } = req.params;

  if (req.user?.role === 'SUPERVISOR' && role !== 'GUARD') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  try {
    const result = await query(
      'SELECT id, nombre, email, role, is_active, created_at FROM usuarios WHERE role = $1 AND is_active = TRUE ORDER BY nombre ASC',
      [role]
    );
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
  const { nombre, role, is_active, email, password } = req.body;

  try {
    const currentUserResult = await query(
      'SELECT id, nombre, email, role, is_active, created_at FROM usuarios WHERE id = $1',
      [id]
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = currentUserResult.rows[0];
    const nextName = typeof nombre === 'string' && nombre.trim() ? nombre.trim() : currentUser.nombre;
    const nextEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : currentUser.email;
    const nextRole = typeof role === 'string' && role.trim() ? role.trim() : currentUser.role;
    const nextIsActive = typeof is_active === 'boolean' ? is_active : currentUser.is_active;
    const nextPasswordHash = typeof password === 'string' && password.trim()
      ? await bcrypt.hash(password.trim(), 10)
      : null;

    const result = await query(
      'UPDATE usuarios SET nombre = $1, email = $2, role = $3, is_active = $4, password_hash = COALESCE($5, password_hash), updated_at = NOW() WHERE id = $6 RETURNING id, nombre, email, role, is_active, created_at',
      [nextName, nextEmail, nextRole, nextIsActive, nextPasswordHash, id]
    );

    const updatedUser = result.rows[0];

    await createNotificationForUser(
      id,
      'Cuenta actualizada',
      `Tu perfil fue actualizado. Correo: ${updatedUser.email}. Rol: ${updatedUser.role}. Estado: ${updatedUser.is_active ? 'activo' : 'inactivo'}.`
    );

    await createNotificationForRole(
      'SUPER_ADMIN',
      'Usuario actualizado',
      `${updatedUser.nombre} fue actualizado por ${req.user?.email}.`
    );

    res.json(updatedUser);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }

    console.error(error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Eliminar usuario definitivamente (Solo SUPER_ADMIN)
router.delete('/:id', requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const client = await getClient();

  if (id === req.user?.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT id, nombre, email, role FROM usuarios WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const userToDelete = userResult.rows[0];

    await client.query('DELETE FROM notificaciones WHERE usuario_id = $1', [id]);
    await client.query('DELETE FROM ubicaciones WHERE usuario_id = $1', [id]);
    await client.query('DELETE FROM reportes WHERE supervisor_id = $1', [id]);
    await client.query('DELETE FROM rondas WHERE supervisor_id = $1', [id]);
    await client.query('DELETE FROM incidencias WHERE supervisor_id = $1', [id]);
    await client.query('DELETE FROM usuarios WHERE id = $1', [id]);

    await client.query('COMMIT');

    await createNotificationForRole(
      'SUPER_ADMIN',
      'Usuario eliminado',
      `${userToDelete.nombre} (${userToDelete.role}) fue eliminado definitivamente por ${req.user?.email}.`
    );

    res.json({ message: 'User deleted permanently' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    client.release();
  }
});

export default router;
