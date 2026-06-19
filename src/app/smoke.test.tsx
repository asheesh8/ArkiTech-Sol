import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the ArkiTech workspace entry', async () => {
  render(<App />);
  expect(await screen.findByText(/close the gaps/i)).toBeInTheDocument();
});
