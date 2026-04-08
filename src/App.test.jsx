import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App component', () => {
  it('renders the Get started text', () => {
    render(<App />);
    expect(screen.getByText(/Get started/i)).toBeInTheDocument();
  });
});
