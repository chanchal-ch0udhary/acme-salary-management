import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Employee } from '../api/types';
import { SalaryChangeDialog } from './SalaryChangeDialog';

const employee: Employee = {
  id: 7, code: 'EMP-00007', full_name: 'Asha Verma', email: 'a@x.io', gender: 'F', department: 'Engineering', job_title: 'Engineer',
  level: 3, country: 'US', currency: 'USD', salary: 100_000, salary_usd: 100_000, hire_date: '2022-01-01', status: 'active', created_at: '', updated_at: '',
};

const renderDialog = (onClose = vi.fn()) => {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <SalaryChangeDialog employee={employee} open onClose={onClose} />
    </QueryClientProvider>,
  );
  return onClose;
};

describe('SalaryChangeDialog', () => {
  const fetchMock = vi.fn();
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => { vi.unstubAllGlobals(); fetchMock.mockReset(); });

  it('keeps Save disabled until there is a different salary AND a reason', async () => {
    renderDialog();
    const save = screen.getByRole('button', { name: /save change/i });
    expect(save).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/new annual salary/i), '100000'); // same as current
    await userEvent.type(screen.getByLabelText(/reason/i), 'Annual review');
    expect(save).toBeDisabled();

    await userEvent.clear(screen.getByLabelText(/new annual salary/i));
    await userEvent.type(screen.getByLabelText(/new annual salary/i), '110000');
    expect(save).toBeEnabled();
  });

  it('shows the percentage change live', async () => {
    renderDialog();
    await userEvent.type(screen.getByLabelText(/new annual salary/i), '110000');
    expect(screen.getByText('+10.0% vs current')).toBeInTheDocument();
  });

  it('posts the change and closes on success', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ...employee, salary: 110_000 }), { status: 200 }));
    const onClose = renderDialog();
    await userEvent.type(screen.getByLabelText(/new annual salary/i), '110000');
    await userEvent.type(screen.getByLabelText(/reason/i), 'Promotion');
    await userEvent.click(screen.getByRole('button', { name: /save change/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/employees/7/salary');
    expect(JSON.parse(init.body as string)).toMatchObject({ new_salary: 110_000, reason: 'Promotion' });
  });

  it('surfaces server validation errors without closing', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { code: 'CONFLICT', message: 'Cannot change the salary of an inactive employee' } }), { status: 409 }));
    const onClose = renderDialog();
    await userEvent.type(screen.getByLabelText(/new annual salary/i), '110000');
    await userEvent.type(screen.getByLabelText(/reason/i), 'Promotion');
    await userEvent.click(screen.getByRole('button', { name: /save change/i }));

    expect(await screen.findByText(/inactive employee/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
