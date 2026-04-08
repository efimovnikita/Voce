import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Vite Configuration File', () => {
  it('contains share_target configuration', () => {
    const configPath = path.resolve(__dirname, '../../vite.config.js');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    expect(configContent).toContain('share_target');
  });
});
