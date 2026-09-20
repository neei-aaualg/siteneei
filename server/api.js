import {
  getPublicActivities,
  registerStudent,
  getAllActivitiesWithRegistrations,
  removeRegistration,
  saveActivity,
  updateActivityStatus,
  deleteActivity,
  createCollaboratorApplication,
  getAllCollaboratorApplications,
  updateCollaboratorStatus,
  deleteCollaboratorApplication,
  createJobOffer,
  getAllJobOffers,
  getPublishedJobOffers,
  updateJobOfferStatus,
  deleteJobOffer,
} from './db.js';
import { authenticateAdmin, verifyAdminToken } from './auth.js';

export function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2e6) {
        const err = new Error('Payload too large');
        err.statusCode = 413;
        req.destroy();
        reject(err);
      }
    });
    req.on('end', () => {
      resolve(raw);
    });
    req.on('error', reject);
  });
}

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        const err = new Error('Payload too large');
        err.statusCode = 413;
        req.destroy();
        reject(err);
      }
    });
    req.on('end', () => {
      try {
        const data = raw ? JSON.parse(raw) : {};
        resolve(data);
      } catch (err) {
        const invalidError = new Error('Formato JSON inválido');
        invalidError.statusCode = 400;
        reject(invalidError);
      }
    });
    req.on('error', reject);
  });
}

export function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}

/**
 * Roteador de endpoints REST para Atividades, Colaboradores e Administração
 */
export async function handleActivitiesApi(req, res, pathname) {
  try {
    // GET /api/config - Configurações públicas da aplicação (ex.: visibilidade do calendário)
    if (pathname === '/api/config' && req.method === 'GET') {
      const rawShow = process.env.SHOW_CALENDAR ?? process.env.VITE_SHOW_CALENDAR;
      const showCalendar = rawShow === undefined ? true : rawShow !== 'false' && rawShow !== '0';
      return sendJson(res, 200, { showCalendar });
    }

    // GET /api/activities - Lista pública de atividades a decorrer e futuras
    if (pathname === '/api/activities' && req.method === 'GET') {
      const rawShow = process.env.SHOW_CALENDAR ?? process.env.VITE_SHOW_CALENDAR;
      const showCalendar = rawShow === undefined ? true : rawShow !== 'false' && rawShow !== '0';
      if (!showCalendar) {
        return sendJson(res, 200, []);
      }
      const activities = getPublicActivities();
      return sendJson(res, 200, activities);
    }

    // POST /api/activities/register - Inscrição numa atividade a decorrer
    if (pathname === '/api/activities/register' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = registerStudent(body.activityId, body.name, body.studentNumber);
      return sendJson(res, 201, {
        success: true,
        message: 'Inscrição confirmada com sucesso!',
        registration: result,
      });
    }

    // POST /api/collaborators/apply - Submeter candidatura a colaborador
    if (pathname === '/api/collaborators/apply' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const app = createCollaboratorApplication(body);
      return sendJson(res, 201, {
        success: true,
        message: 'Candidatura enviada com sucesso! Entraremos em contacto brevemente.',
        application: app,
      });
    }

    // POST /api/jobs/submit - Submeter oferta de emprego ou estágio (Empresas)
    if (pathname === '/api/jobs/submit' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const job = createJobOffer(body);
      return sendJson(res, 201, {
        success: true,
        message:
          'Oferta de emprego submetida com sucesso! A equipa do NEEI irá analisá-la brevemente.',
        job,
      });
    }

    // GET /api/jobs - Listar ofertas de emprego publicadas
    if (pathname === '/api/jobs' && req.method === 'GET') {
      const jobs = getPublishedJobOffers();
      return sendJson(res, 200, jobs);
    }

    // POST /api/admin/login - Autenticação da equipa
    if (pathname === '/api/admin/login' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const auth = authenticateAdmin(body.password);
      return sendJson(res, 200, auth);
    }

    // --- Rotas Protegidas de Administração ---
    if (pathname.startsWith('/api/admin/')) {
      if (!verifyAdminToken(req)) {
        return sendJson(res, 401, {
          error: 'Acesso restrito. Sessão de administrador inválida ou expirada.',
        });
      }

      // GET /api/admin/activities - Lista detalhada de atividades e inscritos
      if (pathname === '/api/admin/activities' && req.method === 'GET') {
        const all = getAllActivitiesWithRegistrations();
        return sendJson(res, 200, all);
      }

      // POST /api/admin/activities - Criar ou editar atividade
      if (pathname === '/api/admin/activities' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const saved = saveActivity(body);
        return sendJson(res, 200, { success: true, activity: saved });
      }

      // POST /api/admin/activities/status - Alterar status de atividade
      if (pathname === '/api/admin/activities/status' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const updated = updateActivityStatus(body.activityId, body.status);
        return sendJson(res, 200, { success: updated });
      }

      // DELETE /api/admin/registrations/:id - Remover inscrição
      if (pathname.startsWith('/api/admin/registrations/') && req.method === 'DELETE') {
        const regId = pathname.replace('/api/admin/registrations/', '').trim();
        const removed = removeRegistration(regId);
        return sendJson(res, 200, { success: removed, id: regId });
      }

      // DELETE /api/admin/activities/:id - Eliminar atividade
      if (pathname.startsWith('/api/admin/activities/') && req.method === 'DELETE') {
        const actId = pathname.replace('/api/admin/activities/', '').trim();
        const removed = deleteActivity(actId);
        return sendJson(res, 200, { success: removed, id: actId });
      }

      // GET /api/admin/collaborators - Listar todas as candidaturas a colaborador
      if (pathname === '/api/admin/collaborators' && req.method === 'GET') {
        const list = getAllCollaboratorApplications();
        return sendJson(res, 200, list);
      }

      // POST /api/admin/collaborators/status - Atualizar estado/notas de candidatura
      if (pathname === '/api/admin/collaborators/status' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const updated = updateCollaboratorStatus(body.id, body.status, body.notes);
        return sendJson(res, 200, { success: updated });
      }

      // DELETE /api/admin/collaborators/:id - Eliminar candidatura
      if (pathname.startsWith('/api/admin/collaborators/') && req.method === 'DELETE') {
        const collabId = pathname.replace('/api/admin/collaborators/', '').trim();
        const removed = deleteCollaboratorApplication(collabId);
        return sendJson(res, 200, { success: removed, id: collabId });
      }

      // GET /api/admin/jobs - Listar todas as ofertas de emprego
      if (pathname === '/api/admin/jobs' && req.method === 'GET') {
        const jobs = getAllJobOffers();
        return sendJson(res, 200, jobs);
      }

      // POST /api/admin/jobs/status - Atualizar estado/notas de oferta de emprego
      if (pathname === '/api/admin/jobs/status' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const updated = updateJobOfferStatus(body.id, body.status, body.notes);
        return sendJson(res, 200, { success: updated });
      }

      // DELETE /api/admin/jobs/:id - Eliminar oferta de emprego
      if (pathname.startsWith('/api/admin/jobs/') && req.method === 'DELETE') {
        const jobId = pathname.replace('/api/admin/jobs/', '').trim();
        const removed = deleteJobOffer(jobId);
        return sendJson(res, 200, { success: removed, id: jobId });
      }
    }

    return false; // Não tratado por este handler
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendJson(res, statusCode, {
      error: err.message || 'Erro interno no servidor',
    });
  }
}
