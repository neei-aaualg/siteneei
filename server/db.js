import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || path.resolve(__dirname, '../data/activities.db');

// Assegura que o diretório da base de dados existe
const dbDir = path.dirname(DB_PATH);
try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (err) {
  console.error(`[DB ERROR] Não foi possível verificar/criar a pasta ${dbDir}:`, err);
}

console.log(`[DB] Base de dados ativa em: ${DB_PATH}`);

export const db = new DatabaseSync(DB_PATH);

// Ativa chaves estrangeiras e modo WAL
db.exec('PRAGMA foreign_keys = ON;');

// Migração suave: se a tabela registrations tiver o formato antigo, atualiza
try {
  const regCols = db
    .prepare('PRAGMA table_info(registrations)')
    .all()
    .map((c) => c.name);
  if (regCols.length > 0 && !regCols.includes('student_number')) {
    db.exec('DROP TABLE registrations;');
  }
} catch (e) {
  // Ignora se não existir
}

// Migração: adiciona coluna open_soon à tabela activities se não existir
try {
  const actCols = db
    .prepare('PRAGMA table_info(activities)')
    .all()
    .map((c) => c.name);
  if (!actCols.includes('open_soon')) {
    db.exec('ALTER TABLE activities ADD COLUMN open_soon INTEGER DEFAULT 0;');
  }
} catch (e) {
  // Ignora se não existir
}

// Migração: adiciona coluna registration_opens_at à tabela activities se não existir
try {
  const actCols = db
    .prepare('PRAGMA table_info(activities)')
    .all()
    .map((c) => c.name);
  if (!actCols.includes('registration_opens_at')) {
    db.exec('ALTER TABLE activities ADD COLUMN registration_opens_at TEXT;');
  }
} catch (e) {
  // Ignora se não existir
}

// Criação das tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('ongoing', 'upcoming', 'completed')),
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    max_capacity INTEGER DEFAULT 0,
    speaker TEXT,
    open_soon INTEGER DEFAULT 0,
    registration_opens_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_number TEXT NOT NULL,
    registered_at TEXT NOT NULL,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    UNIQUE(activity_id, student_number)
  );

  CREATE TABLE IF NOT EXISTS collaborator_applications (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    student_number TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    course TEXT NOT NULL DEFAULT 'LEI',
    areas_of_interest TEXT NOT NULL,
    motivation TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'contacted', 'accepted', 'rejected')),
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS job_offers (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Estágio',
    location TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    link TEXT,
    description TEXT NOT NULL,
    requirements TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'published', 'rejected')),
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_registrations_activity ON registrations(activity_id);
  CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
  CREATE INDEX IF NOT EXISTS idx_collab_status ON collaborator_applications(status);
  CREATE INDEX IF NOT EXISTS idx_collab_created ON collaborator_applications(created_at);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_offers(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_created ON job_offers(created_at);

  CREATE TABLE IF NOT EXISTS shop_campaigns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_price REAL NOT NULL,
    shipping_fee REAL NOT NULL,
    image_url TEXT NOT NULL,
    deadline_date TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    allow_pickup INTEGER NOT NULL DEFAULT 1,
    allow_shipping INTEGER NOT NULL DEFAULT 1,
    pickup_location TEXT NOT NULL,
    sizes_available TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS shop_orders (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    nif TEXT NOT NULL DEFAULT '999999990',
    size TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'Preto',
    delivery_type TEXT NOT NULL CHECK(delivery_type IN ('pickup', 'shipping')),
    shipping_address TEXT,
    shipping_postal_code TEXT,
    shipping_city TEXT,
    item_price REAL NOT NULL,
    shipping_fee REAL NOT NULL,
    total_amount REAL NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'expired', 'failed')),
    payment_provider TEXT NOT NULL DEFAULT 'ifthenpay',
    payment_ref TEXT,
    order_status TEXT NOT NULL DEFAULT 'pending_payment' CHECK(order_status IN ('pending_payment', 'confirmed', 'in_production', 'ready_for_pickup', 'shipped', 'delivered', 'test')),
    email_sent INTEGER NOT NULL DEFAULT 0,
    email_sent_at TEXT,
    moloni_document_id TEXT,
    moloni_status TEXT NOT NULL DEFAULT 'none' CHECK(moloni_status IN ('none', 'pending', 'issued', 'error')),
    created_at TEXT NOT NULL,
    paid_at TEXT,
    FOREIGN KEY (campaign_id) REFERENCES shop_campaigns(id)
  );

  CREATE INDEX IF NOT EXISTS idx_shop_orders_campaign ON shop_orders(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(payment_status);
  CREATE INDEX IF NOT EXISTS idx_shop_orders_created ON shop_orders(created_at);
`);

// Migração: adiciona suporte ao estado 'test' na tabela shop_orders se necessário
try {
  const shopOrderTable = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='shop_orders'")
    .get();
  if (shopOrderTable && shopOrderTable.sql && !shopOrderTable.sql.includes("'test'")) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE IF NOT EXISTS shop_orders_migrated (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        student_email TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        nif TEXT NOT NULL DEFAULT '999999990',
        size TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'Preto',
        delivery_type TEXT NOT NULL CHECK(delivery_type IN ('pickup', 'shipping')),
        shipping_address TEXT,
        shipping_postal_code TEXT,
        shipping_city TEXT,
        item_price REAL NOT NULL,
        shipping_fee REAL NOT NULL,
        total_amount REAL NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'expired', 'failed')),
        payment_provider TEXT NOT NULL DEFAULT 'ifthenpay',
        payment_ref TEXT,
        order_status TEXT NOT NULL DEFAULT 'pending_payment' CHECK(order_status IN ('pending_payment', 'confirmed', 'in_production', 'ready_for_pickup', 'shipped', 'delivered', 'test')),
        email_sent INTEGER NOT NULL DEFAULT 0,
        email_sent_at TEXT,
        moloni_document_id TEXT,
        moloni_status TEXT NOT NULL DEFAULT 'none' CHECK(moloni_status IN ('none', 'pending', 'issued', 'error')),
        created_at TEXT NOT NULL,
        paid_at TEXT,
        FOREIGN KEY (campaign_id) REFERENCES shop_campaigns(id)
      );
      INSERT INTO shop_orders_migrated SELECT * FROM shop_orders;
      DROP TABLE shop_orders;
      ALTER TABLE shop_orders_migrated RENAME TO shop_orders;
      CREATE INDEX IF NOT EXISTS idx_shop_orders_campaign ON shop_orders(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(payment_status);
      CREATE INDEX IF NOT EXISTS idx_shop_orders_created ON shop_orders(created_at);
      PRAGMA foreign_keys = ON;
    `);
  }
} catch (e) {
  // Ignora se não existir
}

// Limpeza de encomendas não confirmadas: apenas encomendas pagas devem permanecer na tabela shop_orders
try {
  db.exec("DELETE FROM shop_orders WHERE payment_status != 'paid';");
} catch (e) {
  // Ignora se tabela ainda não existir
}

// Seed da Campanha de Pré-encomenda das Sweats (se ainda não existir)
try {
  const defaultCampId = 'camp-sweat-ei-2026';
  const existingCamp = db.prepare('SELECT id FROM shop_campaigns WHERE id = ?').get(defaultCampId);
  if (!existingCamp) {
    db.prepare(
      `
      INSERT INTO shop_campaigns (
        id, title, description, item_name, item_price, shipping_fee, image_url, deadline_date,
        is_active, allow_pickup, allow_shipping, pickup_location, sizes_available, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `
    ).run(
      defaultCampId,
      'Sweats Oficiais Engenharia Informática 2026',
      'Campanha oficial de pré-encomenda das sweats do curso de Engenharia Informática da UAlg. Produção em algodão de alta gramagem, corte confortável e bordado exclusivo NEEI.',
      'Sweat Oficial Engenharia Informática',
      25.0,
      3.5,
      '/assets/sweat_mockup.jpg',
      '2026-10-31',
      1,
      1,
      1,
      'Gabinete do NEEI (Sala 0.18, Edifício 1, Campus de Gambelas)',
      JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']),
      new Date().toISOString()
    );
  }
} catch (e) {
  console.error('[DB ERROR] Falha ao inicializar campanha de loja:', e);
}

// Lista de atividades iniciais oficiais do Calendário NEEI
export const INITIAL_ACTIVITIES = [
  {
    id: 'act-workshop-intro-prog-1',
    title: 'Workshop: Introdução à Programação',
    description:
      'Workshop prático introdutório focado nos conceitos fundamentais de lógica de programação, algoritmos e resolução de problemas para os novos estudantes de LEI e MEI.',
    category: 'Workshop',
    status: 'ongoing',
    date: '2026-09-30',
    time: '14:30 - 17:00',
    location: 'Laboratórios de Informática, Campus de Gambelas',
    max_capacity: 30,
    speaker: 'David Rodrigues',
  },
  {
    id: 'act-workshop-intro-prog-2',
    title: 'Workshop: Introdução à Programação (Sessão 2)',
    description:
      'Segunda sessão prática do workshop de introdução à programação, aprofundando estruturas de decisão, ciclos e modularização.',
    category: 'Workshop',
    status: 'upcoming',
    date: '2026-10-05',
    time: '14:30 - 16:30',
    location: 'Laboratórios de Informática, Campus de Gambelas',
    max_capacity: 30,
    speaker: 'David Rodrigues',
  },
  {
    id: 'act-workshop-intro-prog-3',
    title: 'Continuação do Workshop de Introdução à Programação',
    description:
      'Sessão de continuação, consolidação de conceitos e resolução guiada de exercícios práticos.',
    category: 'Workshop',
    status: 'upcoming',
    date: '2026-10-07',
    time: '14:30 - 16:30',
    location: 'Laboratórios de Informática, Campus de Gambelas',
    max_capacity: 30,
    speaker: 'David Rodrigues',
  },
  {
    id: 'act-churrasco-penha-2026',
    title: 'Churrasco Convívio LEI e MEI com BeerPong',
    description:
      'Grande convívio e churrasco de integração aberto aos estudantes de LEI e MEI com torneio de BeerPong.',
    category: 'Convívio',
    status: 'upcoming',
    date: '2026-10-15',
    time: '17:00 - 22:30',
    location: 'Campus da Penha',
    max_capacity: 0,
    speaker: 'João Baptista',
  },
  {
    id: 'act-palestra-neei-2026',
    title: 'Palestra NEEI: Engenharia e Tecnologia',
    description:
      'Sessão formativa e palestra técnica promovida pelo NEEI sobre desafios tecnológicos, ferramentas essenciais e futuro da engenharia informática.',
    category: 'Palestra',
    status: 'upcoming',
    date: '2026-10-28',
    time: '15:00 - 16:30',
    location: 'Grande Auditório, Campus de Gambelas',
    max_capacity: 0,
    speaker: 'NEEI',
  },
  {
    id: 'act-workshop-bot-discord-2026',
    title: 'Workshop: Desenvolvimento de Bot para Discord',
    description:
      'Aprende a criar um bot interativo para Discord utilizando Node.js/JavaScript, gerindo comandos slash, eventos e integração com serviços externos.',
    category: 'Workshop',
    status: 'upcoming',
    date: '2026-11-04',
    time: '14:30 - 17:30',
    location: 'Laboratório de Informática, Campus da Penha',
    max_capacity: 35,
    speaker: 'Martim Neves',
  },
  {
    id: 'act-torneio-jogos-1-2026',
    title: 'Torneio de Jogos NEEI',
    description:
      'Tarde de competição e convívio gamer para os estudantes do curso com modalidades competitivas e prémios para os melhores classificados.',
    category: 'Torneio',
    status: 'upcoming',
    date: '2026-11-11',
    time: '14:30 - 19:00',
    location: 'Sala de Convívio / Laboratórios NEEI, Campus da Penha',
    max_capacity: 32,
    speaker: 'NEEI',
  },
  {
    id: 'act-torneio-jogos-2-2026',
    title: 'Torneio de Jogos NEEI (2ª Edição)',
    description:
      'Segunda ronda dos torneios de videojogos do NEEI aberta à participação de todos os alunos.',
    category: 'Torneio',
    status: 'upcoming',
    date: '2026-11-18',
    time: '14:30 - 19:00',
    location: 'Sala de Convívio / Laboratórios NEEI, Campus da Penha',
    max_capacity: 32,
    speaker: 'NEEI',
  },
];

const LEGACY_MOCK_IDS = [
  'act-git-docker-2026',
  'act-gamejam-2026',
  'act-ai-palestra-2026',
  'act-torneio-codigo-2026',
];

// Migração: se a base de dados ainda tiver as atividades mock antigas e não o calendário novo, atualiza
try {
  const hasLegacy = db
    .prepare(
      `SELECT COUNT(*) as count FROM activities WHERE id IN (${LEGACY_MOCK_IDS.map(() => '?').join(',')})`
    )
    .get(...LEGACY_MOCK_IDS);
  const hasNewSeed = db
    .prepare("SELECT COUNT(*) as count FROM activities WHERE id = 'act-workshop-intro-prog-1'")
    .get();
  if (hasLegacy && hasLegacy.count > 0 && hasNewSeed && hasNewSeed.count === 0) {
    console.log(
      '[DB] A substituir atividades mock antigas pelas atividades do calendário oficial NEEI...'
    );
    const deleteLegacy = db.prepare(
      `DELETE FROM activities WHERE id IN (${LEGACY_MOCK_IDS.map(() => '?').join(',')})`
    );
    deleteLegacy.run(...LEGACY_MOCK_IDS);
  }
} catch (mErr) {
  console.warn('[DB Migration Warning]:', mErr.message);
}

// Seed inicial caso a tabela de atividades esteja vazia
const countStmt = db.prepare('SELECT COUNT(*) as count FROM activities');
const { count } = countStmt.get();

if (count === 0) {
  console.log('[DB] A carregar 8 atividades do calendário oficial NEEI...');
  const insertActivity = db.prepare(`
    INSERT INTO activities (id, title, description, category, status, date, time, location, max_capacity, speaker, open_soon, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const act of INITIAL_ACTIVITIES) {
    insertActivity.run(
      act.id,
      act.title,
      act.description,
      act.category,
      act.status,
      act.date,
      act.time,
      act.location,
      act.max_capacity,
      act.speaker,
      act.open_soon ? 1 : 0,
      now
    );
  }
  console.log(
    `[DB] ${INITIAL_ACTIVITIES.length} atividades oficiais do calendário carregadas com sucesso.`
  );
} else {
  console.log(`[DB] Base de dados carregada com sucesso com ${count} atividade(s) persistida(s).`);
}

/**
 * Verifica se uma data (YYYY-MM-DD) ocorre na mesma semana da data atual (segunda-feira a domingo)
 */
export function isDateInCurrentWeek(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const cleanDate = dateStr.trim();
  let isoDate = cleanDate;
  if (/^\d{2}-\d{2}-\d{4}$/.test(cleanDate)) {
    const [d, m, y] = cleanDate.split('-');
    isoDate = `${y}-${m}-${d}`;
  }
  const target = new Date(isoDate + 'T00:00:00');
  if (isNaN(target.getTime())) return false;

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const distanceToMonday = (dayOfWeek + 6) % 7;

  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return target >= monday && target <= sunday;
}

/**
 * Sincroniza automaticamente para 'ongoing' quaisquer atividades agendadas para a semana corrente
 */
export function syncActivitiesWeeklyStatus() {
  try {
    const upcoming = db.prepare("SELECT id, date FROM activities WHERE status = 'upcoming'").all();
    const updateStmt = db.prepare("UPDATE activities SET status = 'ongoing' WHERE id = ?");
    let changed = 0;
    for (const act of upcoming) {
      if (isDateInCurrentWeek(act.date)) {
        updateStmt.run(act.id);
        changed++;
      }
    }
    return changed;
  } catch (err) {
    console.error('Error syncing weekly activities status:', err);
    return 0;
  }
}

/**
 * Retorna atividades públicas (ongoing e upcoming) com a contagem de inscrições
 */
export function getPublicActivities() {
  // Sincroniza automaticamente eventos da semana corrente para 'ongoing'
  syncActivitiesWeeklyStatus();

  const stmt = db.prepare(`
    SELECT 
      a.id, a.title, a.description, a.category, a.status, a.date, a.time, a.location, a.max_capacity, a.speaker, a.open_soon, a.registration_opens_at, a.created_at,
      COUNT(r.id) as registrations_count
    FROM activities a
    LEFT JOIN registrations r ON a.id = r.activity_id
    WHERE a.status IN ('ongoing', 'upcoming')
    GROUP BY a.id
    ORDER BY 
      CASE a.status
        WHEN 'ongoing' THEN 1
        WHEN 'upcoming' THEN 2
        ELSE 3
      END,
      a.date ASC
  `);

  return stmt.all();
}

/**
 * Limpa e normaliza o número de aluno (ex.: '74123' ou 'a74123' -> 'a74123')
 */
export function cleanStudentNumber(input) {
  if (typeof input !== 'string') return null;
  // Remove espaços e eventual sufixo @ualg.pt
  const trimmed = input
    .trim()
    .toLowerCase()
    .replace(/@ualg\.pt$/i, '');
  // Aceita letra 'a' opcional seguida de 4 a 7 dígitos
  const match = trimmed.match(/^a?(\d{4,7})$/i);
  if (!match) return null;
  return 'a' + match[1];
}

/**
 * Inscreve um aluno com nome e número de aluno numa atividade a decorrer
 */
export function registerStudent(activityId, rawName, rawStudentNumber) {
  if (!activityId) {
    throw new Error('Identificador da atividade é obrigatório');
  }

  const cleanName = (rawName || '').trim();
  if (cleanName.length < 2) {
    const err = new Error('Por favor insere o teu nome completo');
    err.statusCode = 400;
    throw err;
  }

  const studentNumber = cleanStudentNumber(rawStudentNumber);
  if (!studentNumber) {
    const err = new Error('Número de aluno inválido. Exemplo: a74123 ou 74123');
    err.statusCode = 400;
    throw err;
  }

  // Verifica se a atividade existe e está a decorrer
  const actStmt = db.prepare('SELECT * FROM activities WHERE id = ?');
  const activity = actStmt.get(activityId);

  if (!activity) {
    const err = new Error('Atividade não encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Se a atividade estiver como 'upcoming' mas acontecer nesta semana, atualiza para 'ongoing'
  if (activity.status === 'upcoming' && isDateInCurrentWeek(activity.date)) {
    db.prepare("UPDATE activities SET status = 'ongoing' WHERE id = ?").run(activityId);
    activity.status = 'ongoing';
  }

  if (activity.status !== 'ongoing') {
    const err = new Error('As inscrições para esta atividade não se encontram abertas no momento');
    err.statusCode = 400;
    throw err;
  }

  // Verifica se o aluno já está inscrito através do número de aluno
  const existingStmt = db.prepare(
    'SELECT id FROM registrations WHERE activity_id = ? AND student_number = ?'
  );
  const existing = existingStmt.get(activityId, studentNumber);

  if (existing) {
    const err = new Error(
      `O número de aluno ${studentNumber} já se encontra inscrito nesta atividade`
    );
    err.statusCode = 409;
    throw err;
  }

  // Verifica lotação máxima se configurada
  if (activity.max_capacity && activity.max_capacity > 0) {
    const countRegStmt = db.prepare(
      'SELECT COUNT(*) as count FROM registrations WHERE activity_id = ?'
    );
    const { count } = countRegStmt.get(activityId);
    if (count >= activity.max_capacity) {
      const err = new Error('A capacidade máxima para esta atividade foi atingida');
      err.statusCode = 409;
      throw err;
    }
  }

  // Insere a inscrição
  const regId = 'reg-' + crypto.randomUUID();
  const registeredAt = new Date().toISOString();

  const insertStmt = db.prepare(`
    INSERT INTO registrations (id, activity_id, student_name, student_number, registered_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertStmt.run(regId, activityId, cleanName, studentNumber, registeredAt);

  return {
    id: regId,
    activityId,
    studentName: cleanName,
    studentNumber,
    registeredAt,
  };
}

/**
 * Consulta todas as atividades com a lista completa de inscritos (área de administração)
 */
export function getAllActivitiesWithRegistrations() {
  // Sincroniza automaticamente eventos da semana corrente para 'ongoing'
  syncActivitiesWeeklyStatus();

  const activitiesStmt = db.prepare('SELECT * FROM activities ORDER BY date DESC, created_at DESC');
  const activities = activitiesStmt.all();

  const registrationsStmt = db.prepare('SELECT * FROM registrations ORDER BY registered_at ASC');
  const allRegistrations = registrationsStmt.all();

  // Agrupa inscrições por activity_id
  const regMap = new Map();
  for (const reg of allRegistrations) {
    if (!regMap.has(reg.activity_id)) {
      regMap.set(reg.activity_id, []);
    }
    regMap.get(reg.activity_id).push(reg);
  }

  return activities.map((act) => ({
    ...act,
    registrations: regMap.get(act.id) || [],
  }));
}

/**
 * Remove uma inscrição pelo ID
 */
export function removeRegistration(registrationId) {
  const stmt = db.prepare('DELETE FROM registrations WHERE id = ?');
  const result = stmt.run(registrationId);
  return result.changes > 0;
}

/**
 * Cria ou atualiza uma atividade
 */
export function saveActivity(data) {
  const id = data.id || 'act-' + crypto.randomUUID();
  const now = new Date().toISOString();

  const existingStmt = db.prepare('SELECT id FROM activities WHERE id = ?');
  const existing = existingStmt.get(id);

  let finalStatus = data.status || 'upcoming';
  if (finalStatus === 'upcoming' && isDateInCurrentWeek(data.date)) {
    finalStatus = 'ongoing';
  }

  const openSoon = data.open_soon ? 1 : 0;
  const regOpensAt = data.registration_opens_at ? String(data.registration_opens_at).trim() : null;

  if (existing) {
    const updateStmt = db.prepare(`
      UPDATE activities 
      SET title = ?, description = ?, category = ?, status = ?, date = ?, time = ?, location = ?, max_capacity = ?, speaker = ?, open_soon = ?, registration_opens_at = ?
      WHERE id = ?
    `);
    updateStmt.run(
      data.title,
      data.description,
      data.category,
      finalStatus,
      data.date,
      data.time,
      data.location,
      data.max_capacity || 0,
      data.speaker || '',
      openSoon,
      regOpensAt,
      id
    );
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO activities (id, title, description, category, status, date, time, location, max_capacity, speaker, open_soon, registration_opens_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(
      id,
      data.title,
      data.description,
      data.category,
      finalStatus,
      data.date,
      data.time,
      data.location,
      data.max_capacity || 0,
      data.speaker || '',
      openSoon,
      regOpensAt,
      now
    );
  }

  return { id, ...data, open_soon: openSoon, registration_opens_at: regOpensAt };
}

/**
 * Altera o estado de uma atividade ('ongoing' | 'upcoming' | 'completed')
 */
export function updateActivityStatus(activityId, status) {
  const stmt = db.prepare('UPDATE activities SET status = ? WHERE id = ?');
  const result = stmt.run(status, activityId);
  return result.changes > 0;
}

/**
 * Elimina uma atividade
 */
export function deleteActivity(activityId) {
  const stmt = db.prepare('DELETE FROM activities WHERE id = ?');
  const result = stmt.run(activityId);
  return result.changes > 0;
}

/**
 * Regista uma nova candidatura a colaborador
 */
export function createCollaboratorApplication(data) {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    const err = new Error('Nome inválido (mínimo 2 caracteres)');
    err.statusCode = 400;
    throw err;
  }

  const cleanNum = (data.student_number || '')
    .trim()
    .toLowerCase()
    .replace(/@ualg\.pt$/i, '');
  if (!/^a?\d{4,7}$/i.test(cleanNum)) {
    const err = new Error('Número de aluno inválido (ex.: a74123 ou 74123)');
    err.statusCode = 400;
    throw err;
  }
  const studentNumber = cleanNum.startsWith('a') ? cleanNum : `a${cleanNum}`;

  const cleanPhone = (data.phone || '').trim().replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 9) {
    const err = new Error('Número de telemóvel inválido (apenas dígitos, mín. 9 algarismos)');
    err.statusCode = 400;
    throw err;
  }

  const email = (data.email || '').trim() || `${studentNumber}@ualg.pt`;
  const course = (data.course || 'LEI (Licenciatura em Eng. Informática)').trim();
  let academicYear = (data.academic_year || '1º Ano').trim();

  // Validar limites de anos consoante o curso:
  // Mestrado só tem 2 anos, Pós-graduação só tem 1 ano
  if (
    (course.includes('Mestrado') || course.includes('MEI')) &&
    !['1º Ano', '2º Ano'].includes(academicYear)
  ) {
    academicYear = '1º Ano';
  } else if (
    (course.includes('Pós Graduação') || course.includes('PSC')) &&
    academicYear !== '1º Ano'
  ) {
    academicYear = '1º Ano';
  }
  const areasOfInterest = Array.isArray(data.areas_of_interest)
    ? data.areas_of_interest.join(', ')
    : (data.areas_of_interest || '').trim();
  const motivation = (data.motivation || '').trim();
  if (motivation.length < 5) {
    const err = new Error('Por favor escreve um pequeno texto de motivação');
    err.statusCode = 400;
    throw err;
  }

  const id = `collab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO collaborator_applications (
      id, name, student_number, email, phone, academic_year, course, areas_of_interest, motivation, status, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', ?)
  `);

  stmt.run(
    id,
    data.name.trim(),
    studentNumber,
    email,
    cleanPhone,
    academicYear,
    course,
    areasOfInterest,
    motivation,
    now
  );

  return {
    id,
    name: data.name.trim(),
    student_number: studentNumber,
    email,
    phone: cleanPhone,
    academic_year: academicYear,
    course,
    areas_of_interest: areasOfInterest,
    motivation,
    status: 'pending',
    notes: '',
    created_at: now,
  };
}

/**
 * Obtém todas as candidaturas a colaborador ordenadas pela data mais recente
 */
export function getAllCollaboratorApplications() {
  const stmt = db.prepare('SELECT * FROM collaborator_applications ORDER BY created_at DESC');
  return stmt.all();
}

/**
 * Atualiza o estado ou notas de uma candidatura a colaborador
 */
export function updateCollaboratorStatus(id, status, notes) {
  const validStatuses = ['pending', 'contacted', 'accepted', 'rejected'];
  if (status && !validStatuses.includes(status)) {
    const err = new Error('Estado inválido');
    err.statusCode = 400;
    throw err;
  }

  if (status && notes !== undefined) {
    const stmt = db.prepare(
      'UPDATE collaborator_applications SET status = ?, notes = ? WHERE id = ?'
    );
    const res = stmt.run(status, notes, id);
    return res.changes > 0;
  } else if (status) {
    const stmt = db.prepare('UPDATE collaborator_applications SET status = ? WHERE id = ?');
    const res = stmt.run(status, id);
    return res.changes > 0;
  } else if (notes !== undefined) {
    const stmt = db.prepare('UPDATE collaborator_applications SET notes = ? WHERE id = ?');
    const res = stmt.run(notes, id);
    return res.changes > 0;
  }
  return false;
}

/**
 * Elimina uma candidatura a colaborador
 */
export function deleteCollaboratorApplication(id) {
  const stmt = db.prepare('DELETE FROM collaborator_applications WHERE id = ?');
  const res = stmt.run(id);
  return res.changes > 0;
}

/**
 * Cria uma nova oferta de emprego ou estágio
 */
export function createJobOffer(data) {
  if (!data || typeof data !== 'object') {
    const err = new Error('Dados inválidos para submissão de vaga');
    err.statusCode = 400;
    throw err;
  }

  const company = (data.company || '').trim();
  const title = (data.title || '').trim();
  const type = (data.type || 'Estágio').trim();
  const location = (data.location || '').trim();
  const email = (data.email || '').trim();
  const cleanPhone = (data.phone || '').trim().replace(/\D/g, '');
  const link = (data.link || '').trim();
  const description = (data.description || '').trim();
  const requirements = (data.requirements || '').trim();

  if (company.length < 2) {
    const err = new Error('Nome da empresa é obrigatório (mínimo 2 caracteres)');
    err.statusCode = 400;
    throw err;
  }

  if (title.length < 2) {
    const err = new Error('Título da função é obrigatório');
    err.statusCode = 400;
    throw err;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error('Email de contacto válido é obrigatório');
    err.statusCode = 400;
    throw err;
  }

  if (!cleanPhone || cleanPhone.length < 9) {
    const err = new Error(
      'Número de contacto válido é obrigatório (apenas dígitos, mín. 9 algarismos)'
    );
    err.statusCode = 400;
    throw err;
  }

  if (location.length < 2) {
    const err = new Error('Localização é obrigatória');
    err.statusCode = 400;
    throw err;
  }

  if (description.length < 10) {
    const err = new Error('Descrição da vaga é obrigatória (mínimo 10 caracteres)');
    err.statusCode = 400;
    throw err;
  }

  const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO job_offers (
      id, company, title, type, location, email, phone, link, description, requirements, status, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', ?)
  `);

  stmt.run(
    id,
    company,
    title,
    type,
    location,
    email,
    cleanPhone,
    link || null,
    description,
    requirements || null,
    now
  );

  return {
    id,
    company,
    title,
    type,
    location,
    email,
    phone: cleanPhone,
    link,
    description,
    requirements,
    status: 'pending',
    notes: '',
    created_at: now,
  };
}

/**
 * Obtém todas as ofertas de emprego (para o painel de administração)
 */
export function getAllJobOffers() {
  const stmt = db.prepare('SELECT * FROM job_offers ORDER BY created_at DESC');
  return stmt.all();
}

/**
 * Obtém apenas as ofertas publicadas (para a página pública /vagas)
 */
export function getPublishedJobOffers() {
  const stmt = db.prepare(
    "SELECT * FROM job_offers WHERE status = 'published' ORDER BY created_at DESC"
  );
  return stmt.all();
}

/**
 * Atualiza o estado ou notas de uma oferta de emprego
 */
export function updateJobOfferStatus(id, status, notes) {
  const validStatuses = ['pending', 'published', 'rejected'];
  if (status && !validStatuses.includes(status)) {
    const err = new Error('Estado de vaga inválido');
    err.statusCode = 400;
    throw err;
  }

  if (status && notes !== undefined) {
    const stmt = db.prepare('UPDATE job_offers SET status = ?, notes = ? WHERE id = ?');
    const res = stmt.run(status, notes, id);
    return res.changes > 0;
  } else if (status) {
    const stmt = db.prepare('UPDATE job_offers SET status = ? WHERE id = ?');
    const res = stmt.run(status, id);
    return res.changes > 0;
  } else if (notes !== undefined) {
    const stmt = db.prepare('UPDATE job_offers SET notes = ? WHERE id = ?');
    const res = stmt.run(notes, id);
    return res.changes > 0;
  }
  return false;
}

/**
 * Elimina uma oferta de emprego
 */
export function deleteJobOffer(id) {
  const stmt = db.prepare('DELETE FROM job_offers WHERE id = ?');
  const res = stmt.run(id);
  return res.changes > 0;
}

/* =========================================================================
   MÓDULO LOJA NEEI (SWEATS E PRÉ-ENCOMENDAS)
   ========================================================================= */

/**
 * Avalia se as sweats estão disponíveis com base na variável SWEATS_AVAILABLE
 * Aceita 'false', '0', 'f', 'no', 'off' como valor falso.
 */
export function isSweatsAvailableEnv() {
  const val = process.env.SWEATS_AVAILABLE ?? process.env.VITE_SWEATS_AVAILABLE;
  if (val === undefined || val === null || val === '') return true;
  const s = String(val).trim().toLowerCase();
  return !['false', '0', 'f', 'no', 'off', 'disabled'].includes(s);
}

/**
 * Avalia se a loja de teste para administradores está ativa com base na variável SHOW_TEST_SHOP
 * Aceita 'false', '0', 'f', 'no', 'off', 'disabled' como valor falso.
 */
export function isShowTestShopEnv() {
  const val = process.env.SHOW_TEST_SHOP ?? process.env.VITE_SHOW_TEST_SHOP;
  if (val === undefined || val === null || val === '') return true;
  const s = String(val).trim().toLowerCase();
  return !['false', '0', 'f', 'no', 'off', 'disabled'].includes(s);
}

/**
 * Obtém a campanha de loja ativa
 * Se isAdminPreview for verdadeiro e SHOW_TEST_SHOP estiver ativo,
 * ativa a loja com preço de teste de 0.50€ (mínimo Stripe) para testes da equipa.
 */
export function getActiveShopCampaign(isAdminPreview = false) {
  const row = db
    .prepare('SELECT * FROM shop_campaigns WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1')
    .get();

  if (!row) {
    return null;
  }

  let sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  try {
    sizes = JSON.parse(row.sizes_available);
  } catch (e) {
    // fallback
  }

  const isSweatsAvailable = isSweatsAvailableEnv();
  const isTestShopAllowed = isShowTestShopEnv();
  const isTestingMode = Boolean(isAdminPreview && isTestShopAllowed);
  const effectivePrice = isTestingMode ? 0.50 : Number(row.item_price);
  const effectiveAvailable = Boolean(row.is_active) && (isSweatsAvailable || isTestingMode);
  const effectiveImage = (isSweatsAvailable || isTestingMode) ? row.image_url : null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    item_name: row.item_name,
    item_price: effectivePrice,
    shipping_fee: Number(row.shipping_fee),
    image_url: effectiveImage,
    deadline_date: row.deadline_date,
    is_active: Boolean(row.is_active),
    is_available: effectiveAvailable,
    allow_pickup: Boolean(row.allow_pickup),
    allow_shipping: Boolean(row.allow_shipping),
    pickup_location: row.pickup_location,
    sizes_available: sizes,
    isAdminPreview: isTestingMode,
  };
}

/**
 * Atualiza configurações da campanha
 */
export function updateShopCampaign(id, data) {
  const current = db.prepare('SELECT * FROM shop_campaigns WHERE id = ?').get(id);
  if (!current) {
    throw new Error('Campanha não encontrada');
  }

  const title = data.title !== undefined ? data.title : current.title;
  const description = data.description !== undefined ? data.description : current.description;
  const item_name = data.item_name !== undefined ? data.item_name : current.item_name;
  const item_price = data.item_price !== undefined ? Number(data.item_price) : current.item_price;
  const shipping_fee =
    data.shipping_fee !== undefined ? Number(data.shipping_fee) : current.shipping_fee;
  const deadline_date =
    data.deadline_date !== undefined ? data.deadline_date : current.deadline_date;
  const is_active = data.is_active !== undefined ? (data.is_active ? 1 : 0) : current.is_active;
  const allow_pickup =
    data.allow_pickup !== undefined ? (data.allow_pickup ? 1 : 0) : current.allow_pickup;
  const allow_shipping =
    data.allow_shipping !== undefined ? (data.allow_shipping ? 1 : 0) : current.allow_shipping;
  const pickup_location =
    data.pickup_location !== undefined ? data.pickup_location : current.pickup_location;
  const sizes_available = data.sizes_available
    ? JSON.stringify(data.sizes_available)
    : current.sizes_available;

  const stmt = db.prepare(`
    UPDATE shop_campaigns SET
      title = ?, description = ?, item_name = ?, item_price = ?, shipping_fee = ?,
      deadline_date = ?, is_active = ?, allow_pickup = ?, allow_shipping = ?,
      pickup_location = ?, sizes_available = ?
    WHERE id = ?
  `);

  stmt.run(
    title,
    description,
    item_name,
    item_price,
    shipping_fee,
    deadline_date,
    is_active,
    allow_pickup,
    allow_shipping,
    pickup_location,
    sizes_available,
    id
  );

  return getActiveShopCampaign(data.isAdminPreview);
}

// Cache em memória de encomendas pendentes de pagamento (não inseridas na BD até confirmação)
export const pendingOrdersCache = new Map();

/**
 * Valida e prepara uma encomenda pendente de pagamento em memória.
 * NÃO insere na tabela shop_orders até o pagamento ser confirmado.
 */
export function preparePendingShopOrder(orderData, isAdminPreview = false) {
  const isSweatsAvailable = isSweatsAvailableEnv();
  const isTestShopAllowed = isShowTestShopEnv();
  const isTestingMode = Boolean(isAdminPreview && isTestShopAllowed);

  if (!isSweatsAvailable && !isTestingMode) {
    const err = new Error(
      'As sweats não se encontram disponíveis de momento. Ficarão disponíveis brevemente! Acompanha o Instagram @neeiualg para mais informações.'
    );
    err.statusCode = 400;
    throw err;
  }

  const campaign = getActiveShopCampaign(isTestingMode);
  if (!campaign || !campaign.is_active) {
    const err = new Error('A campanha de pré-encomenda das sweats encontra-se encerrada.');
    err.statusCode = 400;
    throw err;
  }

  // Validação do tamanho
  const size = (orderData.size || '').toUpperCase().trim();
  if (!campaign.sizes_available.includes(size)) {
    const err = new Error(
      `Tamanho inválido. Opções disponíveis: ${campaign.sizes_available.join(', ')}`
    );
    err.statusCode = 400;
    throw err;
  }

  // Validação dos dados do estudante
  const studentName = (orderData.student_name || '').trim();
  if (!studentName || studentName.length < 3) {
    const err = new Error('Nome do aluno é obrigatório (mínimo 3 caracteres).');
    err.statusCode = 400;
    throw err;
  }

  const studentEmail = (orderData.student_email || '').toLowerCase().trim();
  if (!studentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
    const err = new Error('Email de contacto válido é obrigatório.');
    err.statusCode = 400;
    throw err;
  }

  // Validação do número de telemóvel (formato português: 9 dígitos a começar por 9)
  const rawPhone = (orderData.phone_number || '').replace(/\s+/g, '').replace(/^\+351/, '');
  if (!/^9\d{8}$/.test(rawPhone)) {
    const err = new Error(
      'Número de telemóvel inválido (deve ter 9 dígitos e começar por 9).'
    );
    err.statusCode = 400;
    throw err;
  }

  // Tipo de entrega
  const deliveryType = orderData.delivery_type === 'shipping' ? 'shipping' : 'pickup';
  let shippingAddress = null;
  let shippingPostalCode = null;
  let shippingCity = null;
  let shippingFee = 0;

  if (deliveryType === 'shipping') {
    if (!campaign.allow_shipping) {
      const err = new Error('Envio por morada não disponível nesta campanha.');
      err.statusCode = 400;
      throw err;
    }
    shippingAddress = (orderData.shipping_address || '').trim();
    shippingPostalCode = (orderData.shipping_postal_code || '').trim();
    shippingCity = (orderData.shipping_city || '').trim();

    if (!shippingAddress || !shippingPostalCode || !shippingCity) {
      const err = new Error(
        'Morada, código postal e localidade são obrigatórios para envio por correio.'
      );
      err.statusCode = 400;
      throw err;
    }
    shippingFee = campaign.shipping_fee;
  }

  const itemPrice = campaign.item_price;
  const totalAmount = Number((itemPrice + shippingFee).toFixed(2));

  // NIF (opcional, por omissão Consumidor Final)
  const nif = (orderData.nif || '').replace(/\s+/g, '') || 'Consumidor Final';

  // Geração de ID human-readable
  const randomSuffix = crypto.randomInt(1000, 9999);
  const now = new Date();
  const year = now.getFullYear();
  const orderId = `SW-${year}-${randomSuffix}`;
  const createdAt = now.toISOString();

  const pendingOrder = {
    id: orderId,
    campaign_id: campaign.id,
    student_name: studentName,
    student_email: studentEmail,
    phone_number: rawPhone,
    nif,
    size,
    color: 'Preto',
    delivery_type: deliveryType,
    shipping_address: shippingAddress,
    shipping_postal_code: shippingPostalCode,
    shipping_city: shippingCity,
    item_price: itemPrice,
    shipping_fee: shippingFee,
    total_amount: totalAmount,
    payment_status: 'pending',
    payment_provider: 'stripe',
    payment_ref: null,
    order_status: 'pending_payment',
    email_sent: false,
    email_sent_at: null,
    moloni_document_id: null,
    moloni_status: 'none',
    created_at: createdAt,
    paid_at: null,
    isAdminPreview: Boolean(isTestingMode),
  };

  pendingOrdersCache.set(orderId, pendingOrder);

  // Limpeza de cache se exceder 500 pedidos em memória
  if (pendingOrdersCache.size > 500) {
    const oldestKey = pendingOrdersCache.keys().next().value;
    pendingOrdersCache.delete(oldestKey);
  }

  return pendingOrder;
}

/**
 * Obtém uma encomenda pendente em memória
 */
export function getPendingShopOrder(orderId) {
  if (!orderId) return null;
  return pendingOrdersCache.get(orderId) || null;
}

/**
 * Regista definitivamente uma encomenda na tabela shop_orders apenas quando o pagamento é confirmado
 */
export function recordPaidShopOrder(orderDataOrId, paymentRef = null, paidAt = null) {
  let orderData = orderDataOrId;
  if (typeof orderDataOrId === 'string') {
    const existing = getShopOrderById(orderDataOrId);
    if (existing) {
      return updateShopOrderPaymentStatus(orderDataOrId, 'paid', paymentRef, paidAt);
    }
    orderData = getPendingShopOrder(orderDataOrId);
    if (!orderData) {
      throw new Error(`Encomenda pendente ${orderDataOrId} não encontrada para confirmação`);
    }
  }

  const existingInDb = getShopOrderById(orderData.id);
  if (existingInDb) {
    return updateShopOrderPaymentStatus(orderData.id, 'paid', paymentRef, paidAt);
  }

  const now = new Date().toISOString();
  const actualPaidAt = paidAt || now;
  const actualPaymentRef = paymentRef || orderData.payment_ref || null;
  const isTest = Boolean(orderData.isAdminPreview || orderData.is_admin_preview);
  const orderStatus = isTest ? 'test' : 'confirmed';

  const stmt = db.prepare(`
    INSERT INTO shop_orders (
      id, campaign_id, student_name, student_email, phone_number, nif,
      size, color, delivery_type, shipping_address, shipping_postal_code, shipping_city,
      item_price, shipping_fee, total_amount, payment_status, payment_provider,
      payment_ref, order_status, email_sent, moloni_status, created_at, paid_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, 'paid', ?,
      ?, ?, 0, 'none', ?, ?
    )
  `);

  stmt.run(
    orderData.id,
    orderData.campaign_id || 'camp-sweat-ei-2026',
    orderData.student_name,
    orderData.student_email,
    orderData.phone_number,
    orderData.nif || 'Consumidor Final',
    orderData.size,
    orderData.color || 'Preto',
    orderData.delivery_type || 'pickup',
    orderData.shipping_address || null,
    orderData.shipping_postal_code || null,
    orderData.shipping_city || null,
    Number(orderData.item_price),
    Number(orderData.shipping_fee || 0),
    Number(orderData.total_amount),
    orderData.payment_provider || 'stripe',
    actualPaymentRef,
    orderStatus,
    orderData.created_at || now,
    actualPaidAt
  );

  pendingOrdersCache.delete(orderData.id);

  return getShopOrderById(orderData.id);
}

/**
 * Cria uma nova encomenda em estado pending_payment (em memória, sem gravar na BD até pagamento)
 */
export function createShopOrder(orderData, isAdminPreview = false, options = {}) {
  const pending = preparePendingShopOrder(orderData, isAdminPreview);
  if (options.recordAsPaid || options.saveToDb || orderData.payment_status === 'paid') {
    return recordPaidShopOrder(pending, orderData.payment_ref);
  }
  return pending;
}

/**
 * Obtém uma encomenda pelo ID
 */
export function getShopOrderById(orderId) {
  const row = db.prepare('SELECT * FROM shop_orders WHERE id = ?').get(orderId);
  if (!row) return null;

  return {
    id: row.id,
    campaign_id: row.campaign_id,
    student_name: row.student_name,
    student_email: row.student_email,
    phone_number: row.phone_number,
    nif: row.nif,
    size: row.size,
    color: row.color,
    delivery_type: row.delivery_type,
    shipping_address: row.shipping_address,
    shipping_postal_code: row.shipping_postal_code,
    shipping_city: row.shipping_city,
    item_price: Number(row.item_price),
    shipping_fee: Number(row.shipping_fee),
    total_amount: Number(row.total_amount),
    payment_status: row.payment_status,
    payment_provider: row.payment_provider,
    payment_ref: row.payment_ref,
    order_status: row.order_status,
    email_sent: Boolean(row.email_sent),
    email_sent_at: row.email_sent_at,
    moloni_document_id: row.moloni_document_id,
    moloni_status: row.moloni_status,
    created_at: row.created_at,
    paid_at: row.paid_at,
  };
}

/**
 * Atualiza o estado de pagamento de uma encomenda
 */
export function updateShopOrderPaymentStatus(orderId, paymentStatus, paymentRef, paidAt) {
  const validStatuses = ['pending', 'paid', 'expired', 'failed'];
  if (!validStatuses.includes(paymentStatus)) {
    throw new Error('Estado de pagamento inválido');
  }

  let current = getShopOrderById(orderId);
  if (!current) {
    const pending = getPendingShopOrder(orderId);
    if (pending) {
      if (paymentStatus === 'paid') {
        return recordPaidShopOrder(pending, paymentRef, paidAt);
      }
      pending.payment_status = paymentStatus;
      if (paymentRef !== undefined) pending.payment_ref = paymentRef;
      return pending;
    }
    throw new Error('Encomenda não encontrada');
  }

  const orderStatus = paymentStatus === 'paid' ? 'confirmed' : current.order_status;
  const actualPaidAt =
    paymentStatus === 'paid' ? paidAt || new Date().toISOString() : current.paid_at;
  const actualRef = paymentRef !== undefined ? paymentRef : current.payment_ref;

  const stmt = db.prepare(`
    UPDATE shop_orders SET
      payment_status = ?,
      order_status = ?,
      payment_ref = ?,
      paid_at = ?
    WHERE id = ?
  `);

  stmt.run(paymentStatus, orderStatus, actualRef, actualPaidAt, orderId);
  return getShopOrderById(orderId);
}

/**
 * Marca o email como enviado
 */
export function updateShopOrderEmailSent(orderId) {
  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE shop_orders SET email_sent = 1, email_sent_at = ? WHERE id = ?');
  stmt.run(now, orderId);
}

/**
 * Atualiza o status do Moloni
 */
export function updateShopOrderMoloni(orderId, documentId, status) {
  const stmt = db.prepare(`
    UPDATE shop_orders SET
      moloni_document_id = ?,
      moloni_status = ?
    WHERE id = ?
  `);
  stmt.run(documentId || null, status, orderId);
}

/**
 * Atualiza o estado da encomenda pelo admin
 */
export function updateShopOrderStatus(orderId, orderStatus) {
  const valid = [
    'pending_payment',
    'confirmed',
    'in_production',
    'ready_for_pickup',
    'shipped',
    'delivered',
    'test',
  ];
  if (!valid.includes(orderStatus)) {
    throw new Error('Estado de encomenda inválido');
  }
  const pending = getPendingShopOrder(orderId);
  if (pending && !getShopOrderById(orderId)) {
    pending.order_status = orderStatus;
    return true;
  }
  const stmt = db.prepare('UPDATE shop_orders SET order_status = ? WHERE id = ?');
  const res = stmt.run(orderStatus, orderId);
  return res.changes > 0;
}

/**
 * Atualiza o estado de múltiplas encomendas pelo admin
 */
export function updateMultipleShopOrderStatus(orderIds, orderStatus) {
  const valid = [
    'pending_payment',
    'confirmed',
    'in_production',
    'ready_for_pickup',
    'shipped',
    'delivered',
    'test',
  ];
  if (!valid.includes(orderStatus)) {
    throw new Error('Estado de encomenda inválido');
  }
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return 0;
  }

  let pendingCount = 0;
  for (const id of orderIds) {
    const p = getPendingShopOrder(id);
    if (p && !getShopOrderById(id)) {
      p.order_status = orderStatus;
      pendingCount++;
    }
  }

  const dbOrderIds = orderIds.filter((id) => Boolean(getShopOrderById(id)));
  if (dbOrderIds.length > 0) {
    const placeholders = dbOrderIds.map(() => '?').join(',');
    const stmt = db.prepare(`UPDATE shop_orders SET order_status = ? WHERE id IN (${placeholders})`);
    const res = stmt.run(orderStatus, ...dbOrderIds);
    return res.changes + pendingCount;
  }
  return pendingCount;
}

/**
 * Lista todas as encomendas para o painel de administração (por omissão apenas pagas)
 */
export function getAllShopOrders(filters = {}) {
  let query = 'SELECT * FROM shop_orders';
  const conditions = [];
  const params = [];

  // Apenas encomendas confirmadas de pago são listadas na tabela
  if (filters.payment_status && filters.payment_status !== 'all') {
    conditions.push('payment_status = ?');
    params.push(filters.payment_status);
  } else if (!filters.payment_status) {
    // Por omissão, apenas exibe encomendas com pagamento confirmado
    conditions.push("payment_status = 'paid'");
  }

  if (filters.order_status) {
    conditions.push('order_status = ?');
    params.push(filters.order_status);
  }

  if (filters.size) {
    conditions.push('size = ?');
    params.push(filters.size);
  }

  if (filters.delivery_type) {
    conditions.push('delivery_type = ?');
    params.push(filters.delivery_type);
  }

  if (filters.search) {
    conditions.push(
      '(student_name LIKE ? OR student_email LIKE ? OR phone_number LIKE ? OR id LIKE ? OR nif LIKE ?)'
    );
    const s = `%${filters.search.trim()}%`;
    params.push(s, s, s, s, s);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params);
  return rows.map((row) => ({
    ...row,
    item_price: Number(row.item_price),
    shipping_fee: Number(row.shipping_fee),
    total_amount: Number(row.total_amount),
    email_sent: Boolean(row.email_sent),
  }));
}

/**
 * Obtém resumo estatístico da loja para o dashboard /admin
 */
export function getShopSummaryStats() {
  const allOrders = db.prepare("SELECT * FROM shop_orders WHERE payment_status = 'paid'").all();
  // Não contabiliza encomendas em estado 'test' na produção de fábrica
  const paidOrders = allOrders.filter((o) => o.payment_status === 'paid' && o.order_status !== 'test');

  const sizeCounts = {
    XS: 0,
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
    '3XL': 0,
  };

  let pickupCount = 0;
  let shippingCount = 0;
  let totalRevenue = 0;

  for (const order of paidOrders) {
    totalRevenue += Number(order.total_amount);
    if (sizeCounts[order.size] !== undefined) {
      sizeCounts[order.size]++;
    }
    if (order.delivery_type === 'shipping') {
      shippingCount++;
    } else {
      pickupCount++;
    }
  }

  return {
    totalOrders: allOrders.length,
    totalPaidOrders: paidOrders.length,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    sizeCounts,
    pickupCount,
    shippingCount,
    testOrdersCount: allOrders.filter((o) => o.order_status === 'test').length,
  };
}

/**
 * Obtém dados para exportação CSV da fábrica de confeção (exclui encomendas marcadas como teste)
 */
export function getFactoryExportData() {
  const paidOrders = db
    .prepare(
      "SELECT * FROM shop_orders WHERE payment_status = 'paid' AND order_status != 'test' ORDER BY size ASC, student_name ASC"
    )
    .all();

  return paidOrders.map((o) => ({
    id: o.id,
    aluno: o.student_name,
    email: o.student_email,
    telemovel: o.phone_number,
    tamanho: o.size,
    cor: o.color,
    entrega: o.delivery_type === 'shipping' ? 'Envio CTT' : 'Recolha Gabinete NEEI',
    morada_completa:
      o.delivery_type === 'shipping'
        ? `${o.shipping_address || ''}, ${o.shipping_postal_code || ''} ${o.shipping_city || ''}`
        : 'Gabinete NEEI',
    nif: o.nif,
    total_pago: `${Number(o.total_amount).toFixed(2)}€`,
    data_pagamento: o.paid_at || o.created_at,
  }));
}
