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
});
