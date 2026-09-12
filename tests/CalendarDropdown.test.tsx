import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarDropdown from '../components/CalendarDropdown';
import { Activity } from '../types/activities';

const activity = {
  id: 'act-1',
  title: 'Workshop AED',
  description: 'Aprende AED',
  category: 'Workshop',
  status: 'ongoing' as const,
  date: '2026-09-30',
  time: '14:30',
  location: 'Faro',
  max_capacity: 30,
} as Activity;

describe('CalendarDropdown', () => {
  it('abre e fecha o menu (variante botão)', async () => {
    const user = userEvent.setup();
    render(<CalendarDropdown activity={activity} />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Adicionar ao Calendário' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('Outlook Calendar')).toBeInTheDocument();
    expect(screen.getByText('iPhone & Apple Calendar')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('constrói os URLs do Google e Outlook', async () => {
    const user = userEvent.setup();
    render(<CalendarDropdown activity={activity} />);

    await user.click(screen.getByRole('button', { name: 'Adicionar ao Calendário' }));

    const googleLink = screen.getByText('Google Calendar').closest('a');
    const outlookLink = screen.getByText('Outlook Calendar').closest('a');

    expect(googleLink?.getAttribute('href')).toContain('calendar.google.com/calendar/render');
    expect(googleLink).toHaveAttribute('target', '_blank');
    expect(googleLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(outlookLink?.getAttribute('href')).toContain(
      'outlook.live.com/calendar/0/action/compose'
    );
  });

  it('usa a variante de ícone com title acessível', async () => {
    const user = userEvent.setup();
    render(<CalendarDropdown activity={activity} variant="icon" />);

    const iconButton = screen.getByTitle('Adicionar ao Calendário (Google, Outlook, iPhone)');
    expect(iconButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(iconButton);
    expect(iconButton).toHaveAttribute('aria-expanded', 'true');
  });
});
