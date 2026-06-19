import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

it('renders the command dashboard and primary navigation', async () => {
  render(<App />);

  expect(await screen.findByRole('heading', { name: /good morning, ashish/i })).toBeInTheDocument();
  for (const label of ['Command', 'Leads', 'Review Tool', 'Clients', 'Settings']) {
    expect(screen.getAllByRole('link', { name: new RegExp(label, 'i') }).length).toBeGreaterThan(0);
  }
  expect(screen.getByText('Active clients')).toBeInTheDocument();
  expect(screen.getByText('Follow-up queue')).toBeInTheDocument();
});

it('creates a lead and exposes it in instant search', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click((await screen.findAllByRole('link', { name: /^leads$/i }))[0]);
  await screen.findByRole('heading', { name: /lead pipeline/i });
  await user.click(screen.getByRole('button', { name: /add lead/i }));
  await user.type(screen.getByLabelText(/business name/i), 'Northstar Dental');
  await user.type(screen.getByLabelText(/owner name/i), 'Jules Carter');
  await user.type(screen.getByLabelText(/^city/i), 'Baltimore');
  await user.click(screen.getByRole('button', { name: /save lead/i }));

  const search = screen.getByPlaceholderText(/search businesses/i);
  await user.type(search, 'Northstar Dental');
  expect(await screen.findByText('Northstar Dental')).toBeVisible();
});

it('builds a review snapshot and saves it as a lead', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click((await screen.findAllByRole('link', { name: /review tool/i }))[0]);
  await screen.findByRole('heading', { name: /review tool/i });
  await user.type(screen.getByLabelText(/business name/i), 'Fells Point Dental');
  await user.type(screen.getByLabelText(/^city/i), 'Baltimore');
  await user.click(screen.getByRole('button', { name: /build snapshot/i }));

  expect(await screen.findByRole('heading', { name: /competitor gap/i })).toBeVisible();
  await user.click(screen.getByRole('button', { name: /generate script/i }));
  expect(await screen.findByText(/free trial close/i)).toBeVisible();
  await user.click(screen.getByRole('button', { name: /save as lead/i }));
  expect(await screen.findByRole('heading', { name: /fells point dental/i })).toBeVisible();
});

it('shows billing and payment history for a client', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click((await screen.findAllByRole('link', { name: /^clients$/i }))[0]);
  const clientCard = await screen.findByTestId('client-card-client-homeshine');
  await user.click(within(clientCard).getByRole('link', { name: /view client/i }));

  expect(await screen.findByText('Billing command')).toBeVisible();
  expect(screen.getByRole('button', { name: /charge client/i })).toBeVisible();
  expect(screen.getByText(/payment history/i)).toBeVisible();
});

it('sends a templated email and logs it on the lead timeline', async () => {
  const user = userEvent.setup();
  window.history.replaceState({}, '', '/leads/lead-harbor');
  render(<App />);
  await user.click(await screen.findByRole('button', { name: /^email$/i }));
  expect(screen.getByRole('dialog', { name: /email harbor dental/i })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /send email/i }));
  expect(await screen.findByText(/email sent: quick follow-up for harbor dental/i)).toBeVisible();
});

it('records a one-time client charge from billing command', async () => {
  const user = userEvent.setup();
  window.history.replaceState({}, '', '/clients/client-brightpath');
  render(<App />);
  await user.click(await screen.findByRole('button', { name: /charge client/i }));
  await user.clear(screen.getByLabelText(/charge amount/i));
  await user.type(screen.getByLabelText(/charge amount/i), '250');
  await user.click(screen.getByRole('button', { name: /confirm charge/i }));
  expect(await screen.findByText('$250')).toBeVisible();
});
