import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Settings from './Settings';

describe('Settings Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders API Key input and Voice selection', () => {
    render(<Settings voices={[]} />);
    expect(screen.getByLabelText(/Mistral API Key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Select Voice/i)).toBeInTheDocument();
  });

  it('saves API Key to localStorage on change', () => {
    render(<Settings voices={[]} />);
    const input = screen.getByLabelText(/Mistral API Key/i);
    fireEvent.change(input, { target: { value: 'test-api-key' } });
    expect(localStorage.getItem('mistral_api_key')).toBe('test-api-key');
  });

  it('populates voices from props', () => {
    const mockVoices = [
      { id: 'voice1', name: 'Voice 1' },
      { id: 'voice2', name: 'Voice 2' }
    ];
    render(<Settings voices={mockVoices} />);
    const select = screen.getByLabelText(/Select Voice/i);
    expect(select.options.length).toBe(3); // Default (Select voice) + 2 voices
    expect(screen.getByText('Voice 1')).toBeInTheDocument();
    expect(screen.getByText('Voice 2')).toBeInTheDocument();
  });

  it('saves selected voice to localStorage', () => {
    const mockVoices = [{ id: 'voice1', name: 'Voice 1' }];
    render(<Settings voices={mockVoices} />);
    const select = screen.getByLabelText(/Select Voice/i);
    fireEvent.change(select, { target: { value: 'voice1' } });
    expect(localStorage.getItem('mistral_voice_id')).toBe('voice1');
  });
});
