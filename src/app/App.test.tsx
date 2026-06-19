import { render, screen } from '@testing-library/react';
import { App } from './App';

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

it('opens directly to the focused business finder', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Business Finder' })).toBeVisible();
  expect(screen.getByRole('button', { name: /search businesses/i })).toBeVisible();
  expect(screen.queryByText(/demo workspace/i)).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /^leads$/i })).not.toBeInTheDocument();
});

it('keeps the sign-in route available', async () => {
  window.history.replaceState({}, '', '/login');
  render(<App />);
  expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeVisible();
});
