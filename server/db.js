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
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Ativa chaves estrangeiras e modo WAL
db.exec('PRAGMA foreign_keys = ON;');

// Migração suave: se a tabela registrations tiver o formato antigo, atualiza
try {
  const regCols = db.prepare('PRAGMA table_info(registrations)').all().map(c => c.name);
  if (regCols.length > 0 && !regCols.includes('student_number')) {
    db.exec('DROP TABLE registrations;');
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

  CREATE INDEX IF NOT EXISTS idx_registrations_activity ON registrations(activity_id);
  CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
`);

// Seed inicial caso a tabela de atividades esteja vazia
const countStmt = db.prepare('SELECT COUNT(*) as count FROM activities');
const { count } = countStmt.get();

if (count === 0) {
  const insertActivity = db.prepare(`
    INSERT INTO activities (id, title, description, category, status, date, time, location, max_capacity, speaker, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();

  // Atividade a decorrer
  insertActivity.run(
    'act-git-docker-2026',
    'Workshop Prático: Git, GitHub e Docker na Prática',
    'Aprende a dominar controlo de versões profissional com Git e a empacotar as tuas aplicações com Docker para os teus projetos curriculares e profissionais.',
    'Workshop',
    'ongoing',
    '2026-03-25',
    '14:30 - 17:30',
    'Laboratório 1.15, Edifício 1, Campus de Gambelas',
    35,
    'Equipa Técnica NEEI',
    now
  );

  // Atividades futuras para o calendário
  insertActivity.run(
    'act-gamejam-2026',
    'NEEI Game Jam 2026: 48h de Criação',
    'A maratona anual de desenvolvimento de videojogos do NEEI. Junta uma equipa ou vem sozinho criar um jogo do zero sobre o tema surpresa.',
    'Hackathon',
    'upcoming',
    '2026-04-10',
    'Sexta 18:00 até Domingo 18:00',
    'Complexo Pedagógico da Penha & Online',
    50,
    'NEEI & Convidados da Indústria',
    now
  );

  insertActivity.run(
    'act-ai-palestra-2026',
    'Palestra: Inteligência Artificial Generativa e o Futuro da Engenharia',
    'Uma visão prática sobre agentes autónomos, LLMs locais e o impacto da IA no recrutamento tecnológico com engenheiros convidados de topo.',
    'Palestra',
    'upcoming',
    '2026-04-22',
    '15:00 - 16:30',
    'Anfiteatro Paulo Freire, Campus de Gambelas',
    100,
    'Investigadores & Engenheiros de Software',
    now
  );

  insertActivity.run(
    'act-torneio-codigo-2026',
    'Torneio de Programação Inter-Cadeiras',
    'Desafios algorítmicos em C, Java e Python para estudantes de todos os anos da Licenciatura em Engenharia Informática, com prémios para os melhores classificados.',
    'Torneio',
    'upcoming',
    '2026-05-08',
    '14:00 - 18:00',
    'Laboratórios de Informática, Edifício 1',
    40,
    'Núcleo Pedagógico NEEI',
    now
  );
}

/**
 * Verifica se uma data (YYYY-MM-DD) ocorre na mesma semana da data atual (segunda-feira a domingo)
 */
export function isDateInCurrentWeek(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const cleanDate = dateStr.trim();
  const target = new Date(cleanDate + 'T00:00:00');
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
      a.id, a.title, a.description, a.category, a.status, a.date, a.time, a.location, a.max_capacity, a.speaker, a.created_at,
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
  const trimmed = input.trim().toLowerCase().replace(/@ualg\.pt$/i, '');
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
  const existingStmt = db.prepare('SELECT id FROM registrations WHERE activity_id = ? AND student_number = ?');
  const existing = existingStmt.get(activityId, studentNumber);

  if (existing) {
    const err = new Error(`O número de aluno ${studentNumber} já se encontra inscrito nesta atividade`);
    err.statusCode = 409;
    throw err;
  }

  // Verifica lotação máxima se configurada
  if (activity.max_capacity && activity.max_capacity > 0) {
    const countRegStmt = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE activity_id = ?');
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
    registeredAt
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

  return activities.map(act => ({
    ...act,
    registrations: regMap.get(act.id) || []
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
  const id = data.id || ('act-' + crypto.randomUUID());
  const now = new Date().toISOString();

  const existingStmt = db.prepare('SELECT id FROM activities WHERE id = ?');
  const existing = existingStmt.get(id);

  let finalStatus = data.status || 'upcoming';
  if (finalStatus === 'upcoming' && isDateInCurrentWeek(data.date)) {
    finalStatus = 'ongoing';
  }

  if (existing) {
    const updateStmt = db.prepare(`
      UPDATE activities 
      SET title = ?, description = ?, category = ?, status = ?, date = ?, time = ?, location = ?, max_capacity = ?, speaker = ?
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
      id
    );
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO activities (id, title, description, category, status, date, time, location, max_capacity, speaker, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      now
    );
  }

  return { id, ...data };
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
