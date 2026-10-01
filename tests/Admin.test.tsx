import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Admin, default as AdminDefault } from '../pages/Admin';
import {
  adminLogin,
  fetchAdminActivities,
  getStoredAdminToken,
  clearStoredAdminToken,
} from '../services/activitiesService';
import { fetchAdminCollaborators } from '../services/collaboratorsService';
import { fetchAdminJobs } from '../services/jobsService';

vi.mock('../services/activitiesService', () => ({
  adminLogin: vi.fn(),
  fetchAdminActivities: vi.fn(),
  removeRegistration: vi.fn(),
  updateActivityStatus: vi.fn(),
  saveActivity: vi.fn(),
  deleteActivity: vi.fn(),
  getStoredAdminToken: vi.fn(() => null),
  clearStoredAdminToken: vi.fn(),
}));

vi.mock('../services/collaboratorsService', () => ({
  fetchAdminCollaborators: vi.fn(),
  updateCollaboratorStatus: vi.fn(),
  deleteCollaboratorApplication: vi.fn(),
}));

vi.mock('../services/jobsService', () => ({
  fetchAdminJobs: vi.fn(),
  updateJobStatus: vi.fn(),
  deleteJobOffer: vi.fn(),
}));

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getStoredAdminToken as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fetchAdminActivities as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (fetchAdminCollaborators as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (fetchAdminJobs as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('exporta o componente por nome e por omissão', () => {
    expect(Admin).toBeDefined();
    expect(AdminDefault).toBeDefined();
  });

  it('mostra o ecrã de login quando não há token', () => {
    render(<Admin />);
    expect(screen.getByText('Painel de Controlo NEEI')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Insere a senha do NEEI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar no Painel/ })).toBeDisabled();
  });

  it('mostra erro de autenticação', async () => {
    const user = userEvent.setup();
    (adminLogin as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Senha de equipa incorreta.')
    );

    render(<Admin />);

    await user.type(screen.getByPlaceholderText('Insere a senha do NEEI'), 'senha-errada');
    await user.click(screen.getByRole('button', { name: /Entrar no Painel/ }));

    expect(await screen.findByText('Senha de equipa incorreta.')).toBeInTheDocument();
  });

  it('entra no painel e termina sessão', async () => {
    const user = userEvent.setup();
    (adminLogin as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, token: 'tok' });

    render(<Admin />);

    await user.type(screen.getByPlaceholderText('Insere a senha do NEEI'), 'neei-segredo');
    await user.click(screen.getByRole('button', { name: /Entrar no Painel/ }));

    expect(await screen.findByText('Painel de Administração')).toBeInTheDocument();
    expect(fetchAdminActivities).toHaveBeenCalledWith('tok');

    await user.click(screen.getByRole('button', { name: /Terminar Sessão/ }));
    expect(clearStoredAdminToken).toHaveBeenCalled();
    expect(await screen.findByText('Painel de Controlo NEEI')).toBeInTheDocument();
  });

  it('entra diretamente no dashboard quando existe token guardado', async () => {
    (getStoredAdminToken as ReturnType<typeof vi.fn>).mockReturnValue('tok-guardado');

    render(<Admin />);

    expect(await screen.findByText('Painel de Administração')).toBeInTheDocument();
    expect(fetchAdminActivities).toHaveBeenCalledWith('tok-guardado');
  });

  it('permite alterar o estado de uma atividade para concluída manualmente', async () => {
    const user = userEvent.setup();
    (getStoredAdminToken as ReturnType<typeof vi.fn>).mockReturnValue('tok-guardado');
    (fetchAdminActivities as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'act-1',
        title: 'Workshop AED',
        description: 'Algoritmos',
        category: 'Workshop',
        status: 'ongoing',
        date: '2026-10-10',
        time: '14:00',
        location: 'Lab 1',
        registrations: [],
      },
    ]);

    const { updateActivityStatus } = await import('../services/activitiesService');
    (updateActivityStatus as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    render(<Admin />);

    expect(await screen.findByText('Workshop AED')).toBeInTheDocument();
    expect(screen.getByText('Atividades Concluídas')).toBeInTheDocument();

    const completedBtn = screen.getByRole('button', { name: 'Concluída' });
    await user.click(completedBtn);

    expect(updateActivityStatus).toHaveBeenCalledWith('tok-guardado', 'act-1', 'completed');
  });

  it('permite ter mais que uma atividade expandida em simultâneo com os participantes de ambas visíveis', async () => {
    const user = userEvent.setup();
    (getStoredAdminToken as ReturnType<typeof vi.fn>).mockReturnValue('tok-guardado');
    (fetchAdminActivities as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'act-1',
        title: 'Workshop AED',
        description: 'Algoritmos',
        category: 'Workshop',
        status: 'upcoming',
        date: '2026-10-10',
        time: '14:00',
        location: 'Lab 1',
        registrations: [
          {
            id: 'reg-1',
            student_name: 'Carlos Silva',
            student_number: 'a71111',
            registered_at: '2026-10-01',
          },
        ],
      },
      {
        id: 'act-2',
        title: 'Torneio FIFA',
        description: 'Competição',
        category: 'Torneio',
        status: 'upcoming',
        date: '2026-10-15',
        time: '15:00',
        location: 'Sala Convívio',
        registrations: [
          {
            id: 'reg-2',
            student_name: 'Beatriz Costa',
            student_number: 'a72222',
            registered_at: '2026-10-01',
          },
        ],
      },
    ]);

    render(<Admin />);

    expect(await screen.findByText('Workshop AED')).toBeInTheDocument();
    expect(screen.getByText('Torneio FIFA')).toBeInTheDocument();

    // Clica na primeira atividade para expandir
    await user.click(screen.getByText('Workshop AED'));
    expect(await screen.findByText('Carlos Silva')).toBeInTheDocument();

    // Clica na segunda atividade para expandir
    await user.click(screen.getByText('Torneio FIFA'));
    expect(await screen.findByText('Beatriz Costa')).toBeInTheDocument();

    // Ambas as listas de inscritos devem estar no ecrã simultaneamente
    expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    expect(screen.getByText('Beatriz Costa')).toBeInTheDocument();
  });
});
