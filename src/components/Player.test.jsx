import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Player from './Player';

describe('Player Component', () => {
  const defaultProps = {
    isPlaying: false,
    onPlayPause: vi.fn(),
    onRewind: vi.fn(),
    progress: 30,
    text: 'Test content to be read aloud'
  };

  it('renders playback controls and progress bar', () => {
    render(<Player {...defaultProps} />);
    expect(screen.getByLabelText(/Play/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rewind 10 seconds/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows pause button when playing', () => {
    render(<Player {...defaultProps} isPlaying={true} />);
    expect(screen.getByLabelText(/Pause/i)).toBeInTheDocument();
  });

  it('calls onPlayPause when play/pause button is clicked', () => {
    render(<Player {...defaultProps} />);
    fireEvent.click(screen.getByLabelText(/Play/i));
    expect(defaultProps.onPlayPause).toHaveBeenCalled();
  });

  it('calls onRewind when rewind button is clicked', () => {
    render(<Player {...defaultProps} />);
    fireEvent.click(screen.getByLabelText(/Rewind 10 seconds/i));
    expect(defaultProps.onRewind).toHaveBeenCalled();
  });

  it('displays the text being read', () => {
    render(<Player {...defaultProps} />);
    expect(screen.getByText(defaultProps.text)).toBeInTheDocument();
  });

  it('renders waveform placeholder', () => {
    render(<Player {...defaultProps} />);
    expect(screen.getByTestId('waveform')).toBeInTheDocument();
  });
});
