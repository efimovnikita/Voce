import { describe, it, expect } from 'vitest';
import { getYoutubeVideoId, isYoutubeUrl } from './youtube';

describe('YouTube API Utils', () => {
  describe('isYoutubeUrl', () => {
    it('should identify regular YouTube URLs', () => {
      expect(isYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isYoutubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should identify YouTube Shorts URLs', () => {
      expect(isYoutubeUrl('https://www.youtube.com/shorts/STAUjvb-H0o')).toBe(true);
      expect(isYoutubeUrl('https://youtube.com/shorts/STAUjvb-H0o')).toBe(true);
      expect(isYoutubeUrl('https://m.youtube.com/shorts/STAUjvb-H0o')).toBe(true);
    });
  });

  describe('getYoutubeVideoId', () => {
    it('should extract ID from regular watch URL', () => {
      expect(getYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from shortened URL', () => {
      expect(getYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from URL with extra params', () => {
        expect(getYoutubeVideoId('https://youtu.be/Yefms8A2WWg?si=DKi_0YjIx2wQVi39')).toBe('Yefms8A2WWg');
    });

    it('should extract ID from Shorts URL', () => {
      expect(getYoutubeVideoId('https://www.youtube.com/shorts/STAUjvb-H0o')).toBe('STAUjvb-H0o');
      expect(getYoutubeVideoId('https://youtube.com/shorts/STAUjvb-H0o')).toBe('STAUjvb-H0o');
      expect(getYoutubeVideoId('https://m.youtube.com/shorts/STAUjvb-H0o')).toBe('STAUjvb-H0o');
      expect(getYoutubeVideoId('https://www.youtube.com/shorts/STAUjvb-H0o?feature=share')).toBe('STAUjvb-H0o');
    });
  });
});
