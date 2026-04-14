import { randomUUID } from 'crypto';

type Role = 'SUPER_ADMIN' | 'SUPERVISOR' | 'GUARD';

type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  nombre: string;
  telefono?: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ReportRecord = {
  id: string;
  titulo: string;
  descripcion: string;
  locacion: string;
  supervisor_id: string;
  fecha: string;
  created_at: string;
  updated_at: string;
};

type RoundRecord = {
  id: string;
  titulo: string;
  descripcion: string;
  locacion: string;
  supervisor_id: string;
  fecha: string;
  created_at: string;
  updated_at: string;
};

type QueryResult<T = any> = {
  rows: T[];
  rowCount: number;
};

type MemoryState = {
  users: UserRecord[];
  reports: ReportRecord[];
  rounds: RoundRecord[];
};

const adminCreatedAt = new Date().toISOString();

let state: MemoryState = {
  users: [
    {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'admin@sjseguridad.com',
      password_hash: '$2a$10$kFq1HAw5hlhnd31dDF9LZeM70Jp3GvUUR/wRMF3/47He8IYXROrMm',
      nombre: 'Administrador',
      telefono: null,
      role: 'SUPER_ADMIN',
      is_active: true,
      created_at: adminCreatedAt,
      updated_at: adminCreatedAt,
    },
  ],
  reports: [],
  rounds: [],
};

function cloneState(source: MemoryState): MemoryState {
  return {
    users: source.users.map((item) => ({ ...item })),
    reports: source.reports.map((item) => ({ ...item })),
    rounds: source.rounds.map((item) => ({ ...item })),
  };
}

function normalizeSql(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

function result<T>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length };
}

function findUserById(id?: string) {
  return state.users.find((user) => user.id === id);
}

function sortByCreatedAtDesc<T extends { created_at: string }>(items: T[]) {
  return [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function memoryQuery(text: string, params: any[] = []): Promise<QueryResult> {
  const sql = normalizeSql(text);

  if (sql === 'select now()') {
    return result([{ now: new Date().toISOString() }]);
  }

  if (sql.startsWith('select id, nombre, email, role, password_hash from usuarios where email = $1')) {
    const email = String(params[0] || '').toLowerCase();
    const user = state.users.find((item) => item.email.toLowerCase() === email);
    return result(user ? [{ id: user.id, nombre: user.nombre, email: user.email, role: user.role, password_hash: user.password_hash }] : []);
  }

  if (sql.startsWith('select role from usuarios where id = $1')) {
    const user = findUserById(params[0]);
    return result(user ? [{ role: user.role }] : []);
  }

  if (sql.startsWith('insert into usuarios')) {
    const [emailValue, passwordHash, nombre, role, isActive] = params;
    const email = String(emailValue || '').toLowerCase();
    const existingUser = state.users.find((item) => item.email.toLowerCase() === email);

    if (existingUser) {
      const duplicateError = new Error('Email already exists') as Error & { code?: string };
      duplicateError.code = '23505';
      throw duplicateError;
    }

    const timestamp = new Date().toISOString();
    const newUser: UserRecord = {
      id: randomUUID(),
      email,
      password_hash: passwordHash,
      nombre,
      telefono: null,
      role,
      is_active: Boolean(isActive),
      created_at: timestamp,
      updated_at: timestamp,
    };

    state.users.push(newUser);

    return result([{ id: newUser.id, email: newUser.email, nombre: newUser.nombre, role: newUser.role }]);
  }

  if (sql.startsWith('select id, nombre, email, role, is_active, created_at from usuarios order by created_at desc')) {
    return result(sortByCreatedAtDesc(state.users).map(({ id, nombre, email, role, is_active, created_at }) => ({ id, nombre, email, role, is_active, created_at })));
  }

  if (sql.startsWith('select id, nombre, email, role, is_active from usuarios where role = $1')) {
    const role = params[0];
    return result(state.users.filter((user) => user.role === role).map(({ id, nombre, email, role, is_active }) => ({ id, nombre, email, role, is_active })));
  }

  if (sql.startsWith('select id, nombre, email, role, is_active from usuarios where id = $1')) {
    const user = findUserById(params[0]);
    return result(user ? [{ id: user.id, nombre: user.nombre, email: user.email, role: user.role, is_active: user.is_active }] : []);
  }

  if (sql.startsWith('update usuarios set nombre = $1, role = $2, is_active = $3 where id = $4 returning id, nombre, email, role')) {
    const [nombre, role, isActive, id] = params;
    const user = findUserById(id);

    if (!user) {
      return result([]);
    }

    user.nombre = nombre;
    user.role = role;
    user.is_active = Boolean(isActive);
    user.updated_at = new Date().toISOString();

    return result([{ id: user.id, nombre: user.nombre, email: user.email, role: user.role }]);
  }

  if (sql.startsWith('update usuarios set is_active = false where id = $1 returning id')) {
    const user = findUserById(params[0]);

    if (!user) {
      return result([]);
    }

    user.is_active = false;
    user.updated_at = new Date().toISOString();

    return result([{ id: user.id }]);
  }

  if (sql.startsWith('insert into reportes')) {
    const [titulo, descripcion, locacion, supervisorId, fecha] = params;
    const timestamp = new Date().toISOString();
    const report: ReportRecord = {
      id: randomUUID(),
      titulo,
      descripcion: descripcion || '',
      locacion,
      supervisor_id: supervisorId,
      fecha: new Date(fecha || Date.now()).toISOString(),
      created_at: timestamp,
      updated_at: timestamp,
    };

    state.reports.push(report);
    return result([{ ...report }]);
  }

  if (sql.startsWith('select id, titulo, descripcion, locacion, supervisor_id, fecha, created_at from reportes order by created_at desc')) {
    return result(sortByCreatedAtDesc(state.reports).map(({ id, titulo, descripcion, locacion, supervisor_id, fecha, created_at }) => ({ id, titulo, descripcion, locacion, supervisor_id, fecha, created_at })));
  }

  if (sql.startsWith('select id, titulo, descripcion, locacion, supervisor_id, fecha, created_at from reportes where supervisor_id = $1 order by created_at desc')) {
    const supervisorId = params[0];
    return result(sortByCreatedAtDesc(state.reports.filter((report) => report.supervisor_id === supervisorId)).map(({ id, titulo, descripcion, locacion, supervisor_id, fecha, created_at }) => ({ id, titulo, descripcion, locacion, supervisor_id, fecha, created_at })));
  }

  if (sql.startsWith('update reportes set titulo = $1, descripcion = $2, locacion = $3 where id = $4 and (supervisor_id = $5 or $6 = \'super_admin\') returning id, titulo')) {
    const [titulo, descripcion, locacion, id, supervisorId, role] = params;
    const report = state.reports.find((item) => item.id === id && (item.supervisor_id === supervisorId || role === 'SUPER_ADMIN'));

    if (!report) {
      return result([]);
    }

    report.titulo = titulo;
    report.descripcion = descripcion;
    report.locacion = locacion;
    report.updated_at = new Date().toISOString();

    return result([{ id: report.id, titulo: report.titulo }]);
  }

  if (sql.startsWith('delete from reportes where id = $1 returning id')) {
    const reportIndex = state.reports.findIndex((item) => item.id === params[0]);

    if (reportIndex === -1) {
      return result([]);
    }

    const [removed] = state.reports.splice(reportIndex, 1);
    return result([{ id: removed.id }]);
  }

  if (sql.startsWith('insert into rondas')) {
    const [titulo, descripcion, locacion, supervisorId, fecha] = params;
    const timestamp = new Date().toISOString();
    const round: RoundRecord = {
      id: randomUUID(),
      titulo,
      descripcion: descripcion || '',
      locacion,
      supervisor_id: supervisorId,
      fecha: new Date(fecha || Date.now()).toISOString(),
      created_at: timestamp,
      updated_at: timestamp,
    };

    state.rounds.push(round);
    return result([{ ...round }]);
  }

  if (sql.startsWith('select id, titulo, locacion, supervisor_id, fecha, created_at from rondas order by created_at desc')) {
    return result(sortByCreatedAtDesc(state.rounds).map(({ id, titulo, locacion, supervisor_id, fecha, created_at }) => ({ id, titulo, locacion, supervisor_id, fecha, created_at })));
  }

  if (sql.startsWith('select id, titulo, locacion, supervisor_id, fecha, created_at from rondas where supervisor_id = $1 order by created_at desc')) {
    const supervisorId = params[0];
    return result(sortByCreatedAtDesc(state.rounds.filter((round) => round.supervisor_id === supervisorId)).map(({ id, titulo, locacion, supervisor_id, fecha, created_at }) => ({ id, titulo, locacion, supervisor_id, fecha, created_at })));
  }

  if (sql.startsWith('update rondas set titulo = $1, descripcion = $2, locacion = $3 where id = $4 and (supervisor_id = $5 or $6 = \'super_admin\') returning id, titulo')) {
    const [titulo, descripcion, locacion, id, supervisorId, role] = params;
    const round = state.rounds.find((item) => item.id === id && (item.supervisor_id === supervisorId || role === 'SUPER_ADMIN'));

    if (!round) {
      return result([]);
    }

    round.titulo = titulo;
    round.descripcion = descripcion;
    round.locacion = locacion;
    round.updated_at = new Date().toISOString();

    return result([{ id: round.id, titulo: round.titulo }]);
  }

  throw new Error(`Unsupported in-memory query: ${text}`);
}

export class MemoryClient {
  private snapshot: MemoryState | null = null;

  async query(text: string, params?: any[]) {
    const sql = normalizeSql(text);

    if (sql === 'begin') {
      this.snapshot = cloneState(state);
      return result([]);
    }

    if (sql === 'commit') {
      this.snapshot = null;
      return result([]);
    }

    if (sql === 'rollback') {
      if (this.snapshot) {
        state = cloneState(this.snapshot);
        this.snapshot = null;
      }

      return result([]);
    }

    return memoryQuery(text, params);
  }

  release() {}
}

export function createMemoryClient() {
  return new MemoryClient();
}