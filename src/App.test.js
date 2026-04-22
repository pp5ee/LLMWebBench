import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app header', () => {
  render(<App />);
  const header = screen.getByText(/42labs LLM Web Bench/i);
  expect(header).toBeInTheDocument();
});
