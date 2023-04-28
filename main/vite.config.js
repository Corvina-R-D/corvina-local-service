import ViteYaml from '@modyfi/vite-plugin-yaml';
import { join } from 'node:path';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
    },
  },
  build: {
    ssr: true,
    sourcemap: 'inline',
    target: `node18`,
    outDir: 'dist',
    assetsDir: '.',
    minify: false && process.env.MODE !== 'development',
    lib: {
      entry: 'src/main.ts',
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      }
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  plugins: [
    ViteYaml()
  ],
};

export default config;