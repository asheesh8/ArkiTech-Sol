import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VideoAdPage } from './VideoAdPage';
import { packages, process, reels } from './videoAdContent';

function renderPage() {
  return render(<MemoryRouter><VideoAdPage /></MemoryRouter>);
}

it('leads with the video ad offer', () => {
  renderPage();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/fifteen seconds/i);
});

it('renders every package with its price and a booking action', () => {
  renderPage();
  for (const plan of packages) {
    const card = screen.getByRole('heading', { level: 3, name: plan.name }).closest('article');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText(plan.price)).toBeInTheDocument();
    expect(within(card as HTMLElement).getByRole('link', { name: /book a shoot/i })).toHaveAttribute('href', '#book');
  }
});

it('lays the process out in order', () => {
  renderPage();
  const steps = screen.getAllByRole('listitem').filter((item) => item.parentElement?.tagName === 'OL');
  expect(steps.map((item) => item.querySelector('h3')?.textContent)).toEqual(process.map((item) => item.title));
});

it('shows a poster frame instead of a dead player while no reel file is configured', () => {
  const { container } = renderPage();
  expect(container.querySelectorAll('video')).toHaveLength(reels.filter((reel) => reel.src).length);
  expect(screen.getAllByRole('img', { name: /preview frame/i }).length).toBeGreaterThan(0);
});

it('exposes the section anchors the nav links to', () => {
  const { container } = renderPage();
  for (const id of ['work', 'process', 'pricing', 'book']) {
    expect(container.querySelector(`#${id}`)).not.toBeNull();
  }
});
