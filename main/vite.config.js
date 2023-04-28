import ViteYaml from '@modyfi/vite-plugin-yaml';
import typescript from "@rollup/plugin-typescript";
import { join } from 'node:path';
import tsc from "rollup-plugin-typescript2";

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '..');

typescript();

// automatically restart electron process on file change
export function restart() {
  let config;
  return {
    name: 'electron-restart',
    configResolved(_config) {
      config = _config;
    },
    closeBundle() {
      if (config.mode === 'production') {
        return;
      }
      process.stdin.emit('data', 'rs');
    },
  };
}

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
  esbuild: false,
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
    ViteYaml(), { ... tsc({
      tsconfig:  join(PACKAGE_ROOT, 'tsconfig.json'),
    }), enforce: 'pre'  }, restart()
  ],
};

export default config;