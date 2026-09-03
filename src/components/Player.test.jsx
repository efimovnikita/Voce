import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Player from './Player';

describe('Player Component', () => {
  const defaultProps = {
    isPlaying: false,
    isLoading: false,
    onPlayPause: vi.fn(),
    playbackRate: 1,
    onSpeedChange: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    hasPrevious: false,
    hasNext: false,
    onPreviousChunk: vi.fn(),
    onNextChunk: vi.fn(),
    hasPreviousChunk: false,
    hasNextChunk: false,
  };

  it('renders playback controls', () => {
    render(<Player {...defaultProps} />);
    expect(screen.getByRole('button', { name: /^Play$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Change playback speed/i })).toBeInTheDocument();
  });

  it('shows pause button when playing', () => {
    render(<Player {...defaultProps} isPlaying={true} />);
    expect(screen.getByRole('button', { name: /^Pause$/i })).toBeInTheDocument();
  });

  it('calls onPlayPause when play/pause button is clicked', () => {
    render(<Player {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^Play$/i }));
    expect(defaultProps.onPlayPause).toHaveBeenCalled();
  });

  it('calls onSpeedChange when speed button is clicked', () => {
    render(<Player {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Change playback speed/i }));
    expect(defaultProps.onSpeedChange).toHaveBeenCalled();
  });
});
