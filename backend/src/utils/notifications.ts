import { query } from '../database';

export async function createNotificationForUser(usuarioId: string, titulo: string, descripcion: string) {
  await query(
    'INSERT INTO notificaciones (usuario_id, titulo, descripcion, is_read, created_at) VALUES ($1, $2, $3, FALSE, NOW())',
    [usuarioId, titulo, descripcion]
  );
}

export async function createNotificationForRole(role: 'SUPER_ADMIN' | 'SUPERVISOR' | 'GUARD', titulo: string, descripcion: string) {
  const result = await query('SELECT id FROM usuarios WHERE role = $1 AND is_active = TRUE', [role]);

  await Promise.all(
    result.rows.map((row: { id: string }) => createNotificationForUser(row.id, titulo, descripcion))
  );
}