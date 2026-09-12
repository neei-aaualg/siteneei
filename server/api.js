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
  deleteCollaboratorApplication
} from './db.js';
import { authenticateAdmin, verifyAdminToken } from './auth.js';

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        const data = raw ? JSON.parse(raw) : {};
        resolve(data);
      } catch (err) {
        reject(new Error('Formato JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

export function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
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
      const showCalendar = rawShow === undefined ? true : (rawShow !== 'false' && rawShow !== '0');
      return sendJson(res, 200, { showCalendar });
    }

    // GET /api/activities - Lista pública de atividades a decorrer e futuras
    if (pathname === '/api/activities' && req.method === 'GET') {
      const rawShow = process.env.SHOW_CALENDAR ?? process.env.VITE_SHOW_CALENDAR;
      const showCalendar = rawShow === undefined ? true : (rawShow !== 'false' && rawShow !== '0');
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
        registration: result
      });
    }

    // POST /api/collaborators/apply - Submeter candidatura a colaborador
    if (pathname === '/api/collaborators/apply' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const app = createCollaboratorApplication(body);
      return sendJson(res, 201, {
        success: true,
        message: 'Candidatura enviada com sucesso! Entraremos em contacto brevemente.',
        application: app
      });
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
          error: 'Acesso restrito. Sessão de administrador inválida ou expirada.'
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
    }

    return false; // Não tratado por este handler
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendJson(res, statusCode, {
      error: err.message || 'Erro interno no servidor'
    });
  }
}
