// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let tmpDir;
let db;
const originalDbPath = process.env.DATABASE_PATH;

beforeEach(async () => {
  vi.resetModules();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neei-db-test-'));
  process.env.DATABASE_PATH = path.join(tmpDir, 'test.db');
  db = await import('../../server/db.js');
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (originalDbPath === undefined) {
    delete process.env.DATABASE_PATH;
  } else {
    process.env.DATABASE_PATH = originalDbPath;
  }
  vi.useRealTimers();
});

const sampleActivity = {
  title: 'Teste Unitário',
  description: 'Atividade criada para testes.',
  category: 'Workshop',
  status: 'ongoing',
  date: '2026-06-15',
  time: '10:00 - 12:00',
  location: 'Sala de Testes',
  max_capacity: 0,
};

describe('server/db - cleanStudentNumber', () => {
  it('normaliza números de aluno para o formato oficial', () => {
    expect(db.cleanStudentNumber('74123')).toBe('a74123');
    expect(db.cleanStudentNumber('A74123')).toBe('a74123');
    expect(db.cleanStudentNumber(' 74123 ')).toBe('a74123');
    expect(db.cleanStudentNumber('a74123@ualg.pt')).toBe('a74123');
    expect(db.cleanStudentNumber('7412345')).toBe('a7412345');
  });

  it('rejeita números não conformes', () => {
    expect(db.cleanStudentNumber('')).toBeNull();
    expect(db.cleanStudentNumber('7412')).not.toBeNull();
    expect(db.cleanStudentNumber('741')).toBeNull();
    expect(db.cleanStudentNumber('abc')).toBeNull();
    expect(db.cleanStudentNumber(null)).toBeNull();
    expect(db.cleanStudentNumber(12345)).toBeNull();
    expect(db.cleanStudentNumber('12345678')).toBeNull();
  });
});

describe('server/db - registerStudent', () => {
  it('inscreve um aluno numa atividade a decorrer', () => {
    const reg = db.registerStudent('act-workshop-intro-prog-1', 'Maria Silva', '74123');
    expect(reg.studentNumber).toBe('a74123');
    expect(reg.studentName).toBe('Maria Silva');
    expect(reg.activityId).toBe('act-workshop-intro-prog-1');
    expect(reg.id).toMatch(/^reg-/);
    expect(reg.registeredAt).toBeTruthy();
  });

  it('rejeita nomes demasiado curtos', () => {
    try {
      db.registerStudent('act-workshop-intro-prog-1', 'A', '74123');
      throw new Error('deveria lançar');
    } catch (err) {
      expect(err.statusCode).toBe(400);
    }
  });

  it('rejeita números de aluno inválidos', () => {
    try {
      db.registerStudent('act-workshop-intro-prog-1', 'Maria', 'xx');
      throw new Error('deveria lançar');
    } catch (err) {
      expect(err.statusCode).toBe(400);
    }
  });

  it('rejeita atividades inexistentes', () => {
    try {
      db.registerStudent('act-inexistente', 'Maria', '74123');
      throw new Error('deveria lançar');
    } catch (err) {
      expect(err.statusCode).toBe(404);
    }
  });

  it('rejeita inscrições duplicadas com 409', () => {
    db.registerStudent('act-workshop-intro-prog-1', 'Maria', '74123');
    try {
      db.registerStudent('act-workshop-intro-prog-1', 'Outro', 'a74123');
      throw new Error('deveria lançar');
    } catch (err) {
      expect(err.statusCode).toBe(409);
      expect(err.message).toContain('a74123');
    }
  });

  it('marcar como grid a mesma inscrição com o número normalizado (a74123 vs 74123)', () => {
    db.registerStudent('act-workshop-intro-prog-1', 'Maria', '74123');
    try {
      db.registerStudent('act-workshop-intro-prog-1', 'Maria', 'a74123');
      throw new Error('deveria lançar');
    } catch (err) {
      expect(err.statusCode).toBe(409);
    }
  });

  it('rejeita inscrições em atividades futuras fora da semana corrente', () => {
    db.saveActivity({
      ...sampleActivity,
      id: 'act-futura',
      status: 'upcoming',
      date: '2099-01-01',
    });
    try {
      db.registerStudent('act-futura', 'Maria', '74123');
      throw new Error('deveria lançar');
    } catch (err) {
      expect(err.statusCode).toBe(400);
      expect(err.message).toContain('não se encontram abertas');
    }
  });

  it('respeita a capacidade máxima da atividade', () => {
    const act = db.saveActivity({
      ...sampleActivity,
      id: 'act-cap-1',
      status: 'ongoing',
      max_capacity: 1,
    });
    expect(act.id).toBe('act-cap-1');

    db.registerStudent('act-cap-1', 'Aluno Um', '11111');
    try {
      db.registerStudent('act-cap-1', 'Aluno Dois', '22222');
      throw new Error('deveria lançar');
    } catch (err) {
      expect(err.statusCode).toBe(409);
      expect(err.message).toContain('capacidade máxima');
    }
  });
});

describe('server/db - atividades públicas', () => {
  it('lista atividades a decorrer antes das futuras, com contagem de inscrições', () => {
    db.saveActivity({ ...sampleActivity, id: 'act-ord-1', status: 'ongoing', date: '2099-01-01' });
    db.saveActivity({ ...sampleActivity, id: 'act-ord-2', status: 'upcoming', date: '2099-06-01' });

    const list = db.getPublicActivities();
    const subset = list.filter((a) => a.id.startsWith('act-ord-'));
    expect(subset).toHaveLength(2);
    expect(subset[0].id).toBe('act-ord-1');
    expect(subset[1].id).toBe('act-ord-2');
    expect(subset[0]).toHaveProperty('registrations_count');
    expect(subset.every((a) => a.status !== 'completed')).toBe(true);
  });

  it('exclui atividades concluídas da lista pública', () => {
    db.saveActivity({ ...sampleActivity, id: 'act-done', status: 'completed' });
    const list = db.getPublicActivities();
    expect(list.some((a) => a.id === 'act-done')).toBe(false);
  });
});

describe('server/db - saveActivity e administração', () => {
  it('cria e atualiza atividades', () => {
    const created = db.saveActivity({ ...sampleActivity, id: 'act-nova' });
    expect(created.id).toBe('act-nova');
    expect(created.open_soon).toBe(0);

    const updated = db.saveActivity({
      ...sampleActivity,
      id: 'act-nova',
      title: 'Título Novo',
      status: 'upcoming',
    });
    expect(updated.title).toBe('Título Novo');
  });

  it('lista inscrições de cada atividade', () => {
    const reg = db.registerStudent('act-workshop-intro-prog-1', 'Maria', '74123');
    const all = db.getAllActivitiesWithRegistrations();
    const act = all.find((a) => a.id === 'act-workshop-intro-prog-1');
    expect(act.registrations.some((r) => r.id === reg.id)).toBe(true);
  });

  it('altera o estado de uma atividade', () => {
    expect(db.updateActivityStatus('act-workshop-intro-prog-1', 'completed')).toBe(true);
    expect(db.updateActivityStatus('act-inexistente', 'completed')).toBe(false);
  });

  it('remove inscrições', () => {
    const reg = db.registerStudent('act-workshop-intro-prog-1', 'Maria', '74123');
    expect(db.removeRegistration(reg.id)).toBe(true);
    expect(db.removeRegistration(reg.id)).toBe(false);
  });

  it('elimina atividades', () => {
    db.saveActivity({ ...sampleActivity, id: 'act-eliminar', status: 'ongoing' });
    expect(db.deleteActivity('act-eliminar')).toBe(true);
    expect(db.deleteActivity('act-eliminar')).toBe(false);
  });
});

describe('server/db - candidaturas a colaborador', () => {
  const validApplication = {
    name: 'Maria Silva',
    student_number: '74123',
    email: '',
    phone: '+351 912 345 678',
    course: 'LEI (Licenciatura em Eng. Informática)',
    academic_year: '3º Ano',
    areas_of_interest: ['Programação', 'Design'],
    motivation: 'Quero ajudar a organizar eventos do núcleo!',
  };

  it('cria uma candidatura e devolve os dados normalizados', () => {
    const app = db.createCollaboratorApplication(validApplication);
    expect(app.student_number).toBe('a74123');
    expect(app.email).toBe('a74123@ualg.pt');
    expect(app.phone).toBe('351912345678');
    expect(app.areas_of_interest).toBe('Programação, Design');
    expect(app.status).toBe('pending');
    expect(app.academic_year).toBe('3º Ano');
  });

  it('limita o ano académico de mestrados e pós-graduações', () => {
    const mestrado = db.createCollaboratorApplication({
      ...validApplication,
      student_number: '22000',
      course: 'MEI (Mestrado em Eng. Informática)',
      academic_year: '3º Ano',
    });
    expect(mestrado.academic_year).toBe('1º Ano');

    const posGrad = db.createCollaboratorApplication({
      ...validApplication,
      student_number: '22001',
      course: 'Pós Graduação em X',
      academic_year: '2º Ano',
    });
    expect(posGrad.academic_year).toBe('1º Ano');
  });

  it('valida os campos obrigatórios', () => {
    for (const badCase of [
      { ...validApplication, name: 'A' },
      { ...validApplication, student_number: 'xx' },
      { ...validApplication, phone: '12345' },
      { ...validApplication, motivation: 'cura' },
    ]) {
      try {
        db.createCollaboratorApplication(badCase);
        throw new Error('deveria lançar');
      } catch (err) {
        expect(err.statusCode).toBe(400);
      }
    }
  });

  it('atualiza estados e notas, e elimina candidaturas', () => {
    const app = db.createCollaboratorApplication(validApplication);
    expect(db.updateCollaboratorStatus(app.id, 'accepted', 'Boa candidata')).toBe(true);

    try {
      db.updateCollaboratorStatus(app.id, 'estado-invalido');
      throw new Error('deveria lançar');
    } catch (err) {
      expect(err.statusCode).toBe(400);
    }

    expect(db.deleteCollaboratorApplication(app.id)).toBe(true);
    expect(db.deleteCollaboratorApplication(app.id)).toBe(false);
  });
});

describe('server/db - ofertas de emprego', () => {
  const validJob = {
    company: 'Empresa X',
    title: 'Estágio em Desenvolvimento',
    type: 'Estágio',
    location: 'Faro',
    email: 'rh@empresa.pt',
    phone: '(+351) 912-345-678',
    link: '',
    description: 'Oportunidade para estudantes de LEI.',
    requirements: 'C, Java',
  };

  it('cria uma oferta e limpa o número de telefone', () => {
    const job = db.createJobOffer(validJob);
    expect(job.phone).toBe('351912345678');
    expect(job.status).toBe('pending');
    expect(job.link).toBe('');
  });

  it('valida campos obrigatórios', () => {
    for (const badCase of [
      { ...validJob, company: 'X' },
      { ...validJob, title: 'X' },
      { ...validJob, email: 'nao-e-email' },
      { ...validJob, phone: '12345' },
      { ...validJob, location: 'X' },
      { ...validJob, description: 'curto' },
    ]) {
      try {
        db.createJobOffer(badCase);
        throw new Error('deveria lançar');
      } catch (err) {
        expect(err.statusCode).toBe(400);
      }
    }
  });

  it('só publica na lista pública as ofertas com estado published', () => {
    const job = db.createJobOffer(validJob);
    expect(db.getPublishedJobOffers()).toHaveLength(0);

    expect(db.updateJobOfferStatus(job.id, 'published', 'Aprovado')).toBe(true);
    expect(db.getPublishedJobOffers()).toHaveLength(1);

    try {
      db.updateJobOfferStatus(job.id, 'estado-invalido');
      throw new Error('deveria lançar');
    } catch (err) {
      expect(err.statusCode).toBe(400);
    }

    expect(db.deleteJobOffer(job.id)).toBe(true);
    expect(db.getPublishedJobOffers()).toHaveLength(0);
  });
});

describe('server/db - isDateInCurrentWeek', () => {
  it('identifica datas da semana corrente (segunda a domingo)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-16T12:00:00Z')); // quarta-feira

    expect(db.isDateInCurrentWeek('2026-09-14')).toBe(true); // segunda
    expect(db.isDateInCurrentWeek('2026-09-16')).toBe(true);
    expect(db.isDateInCurrentWeek('2026-09-20')).toBe(true); // domingo
    expect(db.isDateInCurrentWeek('2026-09-13')).toBe(false); // domingo passado
    expect(db.isDateInCurrentWeek('2026-09-21')).toBe(false); // segunda seguinte
    expect(db.isDateInCurrentWeek('16-09-2026')).toBe(true); // formato DD-MM-AAAA

    // Entradas inválidas
    expect(db.isDateInCurrentWeek('')).toBe(false);
    expect(db.isDateInCurrentWeek('nao-e-uma-data')).toBe(false);
    expect(db.isDateInCurrentWeek(null)).toBe(false);
    expect(db.isDateInCurrentWeek(123)).toBe(false);
    expect(db.isDateInCurrentWeek(undefined)).toBe(false);
  });
});
