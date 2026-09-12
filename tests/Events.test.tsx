import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Events } from '../pages/Events';
import { Activity } from '../types/activities';
import {
  fetchPublicActivities,
  registerForActivity,
  fetchAppConfig,
} from '../services/activitiesService';
import confetti from 'canvas-confetti';

vi.mock('../services/activitiesService', () => ({
  fetchAppConfig: vi.fn(),
  fetchPublicActivities: vi.fn(),
  registerForActivity: vi.fn(),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

const ongoingActivity: Activity = {
  id: 'act-1',
  title: 'Workshop AED',
  description: 'Aprende algoritmos e estruturas de dados na prática.',
  category: 'Workshop',
  status: 'ongoing',
  date: '2026-09-30',
  time: '14:30 - 17:00',
  location: 'Laboratório 1.2',
  max_capacity: 30,
  registrations_count: 2,
  speaker: 'Prof. Exemplo',
};

const upcomingActivity: Activity = {
  id: 'act-2',
  title: 'Seminário Cibersegurança',
  description: 'Palestra sobre segurança informática.',
  category: 'Palestra',
  status: 'upcoming',
  date: '2026-10-20',
  time: '18:00 - 20:00',
  location: 'Anfiteatro',
};

describe('Events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchAppConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ showCalendar: true });
    (fetchPublicActivities as ReturnType<typeof vi.fn>).mockResolvedValue([
      ongoingActivity,
      upcomingActivity,
    ]);
  });

  it('apresenta as atividades a decorrer e futuras', async () => {
    render(<Events />);

    expect(await screen.findByText('Workshop AED')).toBeInTheDocument();
    expect(screen.getByText('Atividades a Decorrer')).toBeInTheDocument();
    expect(screen.getByText('Inscrições Abertas')).toBeInTheDocument();
    expect(screen.getByText('Seminário Cibersegurança')).toBeInTheDocument();
    expect(screen.getByText('Calendário de Atividades Futuras')).toBeInTheDocument();
    expect(
      screen.getByText('Aprende algoritmos e estruturas de dados na prática.')
    ).toBeInTheDocument();
  });

  it('mostra as estatísticas do calendário (a decorrer / agendadas)', async () => {
    render(<Events />);

    await screen.findByText('Workshop AED');
    expect(screen.getByText('A Decorrer')).toBeInTheDocument();
    expect(screen.getByText('Agendadas')).toBeInTheDocument();
  });

  it('mostra ecrã "brevemente" quando o calendário está oculto', async () => {
    (fetchAppConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ showCalendar: false });

    render(<Events />);

    expect(await screen.findByText(/Calendário será anunciado brevemente/)).toBeInTheDocument();
  });

  it('mostra o erro ao carregar atividades com botão de tentar novamente', async () => {
    (fetchPublicActivities as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Erro ao obter atividades (500)')
    );

    render(<Events />);

    expect(await screen.findByText('Erro ao carregar atividades')).toBeInTheDocument();
    expect(screen.getByText('Erro ao obter atividades (500)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar Novamente' })).toBeInTheDocument();
  });

  it('valida o formulário de inscrição (erro de nome)', async () => {
    const user = userEvent.setup();
    render(<Events />);

    await user.click(await screen.findByRole('button', { name: /Inscrever-me na Atividade/ }));

    await user.type(screen.getByLabelText('Nome Completo'), 'A');
    await user.type(screen.getByLabelText('Número de Aluno'), '74123');
    await user.click(screen.getByRole('button', { name: /Confirmar Inscrição/ }));

    expect(await screen.findByText('Por favor insere o teu nome completo')).toBeInTheDocument();
    expect(registerForActivity).not.toHaveBeenCalled();
  });

  it('valida o formulário de inscrição (erro de número de aluno)', async () => {
    const user = userEvent.setup();
    render(<Events />);

    await user.click(await screen.findByRole('button', { name: /Inscrever-me na Atividade/ }));

    await user.type(screen.getByLabelText('Nome Completo'), 'Afonso Bitoque');
    await user.type(screen.getByLabelText('Número de Aluno'), 'abc');
    await user.click(screen.getByRole('button', { name: /Confirmar Inscrição/ }));

    expect(
      await screen.findByText(/Por favor insere um número de aluno válido/)
    ).toBeInTheDocument();
    expect(registerForActivity).not.toHaveBeenCalled();
  });

  it('conclui com sucesso uma inscrição e celebra com confetti', async () => {
    const user = userEvent.setup();
    (registerForActivity as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      message: 'Inscrição confirmada com sucesso!',
    });

    render(<Events />);

    await user.click(await screen.findByRole('button', { name: /Inscrever-me na Atividade/ }));

    await user.type(screen.getByLabelText('Nome Completo'), 'Afonso Bitoque');
    await user.type(screen.getByLabelText('Número de Aluno'), '74123');
    await user.click(screen.getByRole('button', { name: /Confirmar Inscrição/ }));

    expect(await screen.findByText('Inscrição Confirmada!')).toBeInTheDocument();
    expect(registerForActivity).toHaveBeenCalledWith('act-1', 'Afonso Bitoque', 'a74123');
    expect(confetti).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Concluído' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mostra o erro do servidor no formulário', async () => {
    const user = userEvent.setup();
    (registerForActivity as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Já te encontras inscrito nesta atividade.')
    );

    render(<Events />);

    await user.click(await screen.findByRole('button', { name: /Inscrever-me na Atividade/ }));
    await user.type(screen.getByLabelText('Nome Completo'), 'Afonso Bitoque');
    await user.type(screen.getByLabelText('Número de Aluno'), '74123');
    await user.click(screen.getByRole('button', { name: /Confirmar Inscrição/ }));

    expect(
      await screen.findByText('Já te encontras inscrito nesta atividade.')
    ).toBeInTheDocument();
  });

  it('limpa o modal ao fechar', async () => {
    const user = userEvent.setup();
    render(<Events />);

    await user.click(await screen.findByRole('button', { name: /Inscrever-me na Atividade/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Fechar modal'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
