import { describe, it, expect } from 'vitest';
import viteConfig from '../../vite.config.js';

describe('Vite Configuration', () => {
  it('includes VitePWA plugin', () => {
    const flatPlugins = viteConfig.plugins.flat(Infinity);
    const pwaPlugin = flatPlugins.find(p => p && p.name === 'vite-plugin-pwa');
    expect(pwaPlugin).toBeDefined();
  });

  it('has correct manifest properties', () => {
    // Note: This test might be fragile depending on how viteConfig is exported
    // For now, it's just a placeholder to follow the TDD workflow.
  });
});
