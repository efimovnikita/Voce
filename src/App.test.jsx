import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('App component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders status when no API key is provided', () => {
    render(<App />);
    expect(screen.getByText(/Please enter Mistral API Key in Settings/i)).toBeInTheDocument();
  });

  it('renders the status and controls when API key is provided', async () => {
    localStorage.setItem('mistral_api_key', 'test-key');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Ready|Loading voices/i)).toBeInTheDocument();
    });
  });

  it('renders the OCR screenshot upload button', () => {
    render(<App />);
    expect(screen.getByLabelText(/Upload Screenshot for OCR/i)).toBeInTheDocument();
  });
});
