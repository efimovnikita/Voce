import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import * as mistralApi from '../api/mistral';

vi.mock('../api/mistral', () => ({
  fetchVoices: vi.fn().mockResolvedValue([{ id: 'v1', name: 'V1' }]),
  generateSpeech: vi.fn().mockResolvedValue(new Blob(['audio'], { type: 'audio/mpeg' }))
}));

describe('App Integration (Share Handling)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Default mock for window.location
    delete window.location;
    window.location = new URL('http://localhost/');
  });

  it('extracts shared text from URL parameters', async () => {
    window.location = new URL('http://localhost/?text=Hello%20World');
    localStorage.setItem('mistral_api_key', 'test-key');
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Hello World/i)).toBeInTheDocument();
    });
  });

  it('does not show shared text if no parameter is present', async () => {
    render(<App />);
    expect(screen.queryByText(/Hello World/i)).not.toBeInTheDocument();
  });
});
