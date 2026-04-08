import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App component', () => {
  it('renders the Mistral Speaker header', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Mistral Speaker/i, level: 1 })).toBeInTheDocument();
  });
});
