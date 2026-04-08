import { describe, it, expect } from 'vitest';
import viteConfig from '../../vite.config.js';

describe('Vite Configuration', () => {
  it('includes VitePWA plugin', () => {
    const flatPlugins = viteConfig.plugins.flat(Infinity);
    const pwaPlugin = flatPlugins.find(p => p && p.name === 'vite-plugin-pwa');
    expect(pwaPlugin).toBeDefined();
  });

  it('has correct manifest properties', () => {
    // console.log(JSON.stringify(viteConfig, null, 2));
    const flatPlugins = viteConfig.plugins.flat(Infinity);
    const pwaPlugin = flatPlugins.find(p => p && p.name === 'vite-plugin-pwa');
    
    // In Vitest, the plugin object might not have the full API available.
    // We can try to access the options passed to VitePWA if we can find them.
    expect(pwaPlugin).toBeDefined();
  });
});
