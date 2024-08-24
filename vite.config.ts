import { ValidateEnv as validateEnv } from '@julr/vite-plugin-validate-env';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import webfontDownload from 'vite-plugin-webfont-dl';
import reactSwc from '@vitejs/plugin-react-swc';
import { execSync } from 'child_process';
import { visualizer } from 'rollup-plugin-visualizer';
import checker from 'vite-plugin-checker';
import { compression } from 'vite-plugin-compression2';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

import envConfig from './env';

/* Get commit hash */
const commitHash = execSync('git rev-parse --short HEAD').toString();

export default defineConfig(({ mode }) => {
    const isProd = mode === 'production';
    console.log('Mode:', mode);
    const env = loadEnv(mode, process.cwd(), '')

    return {
        define: {
            'import.meta.env.APP_COMMIT_HASH': JSON.stringify(commitHash),
            'import.meta.env.APP_VERSION': JSON.stringify(env.npm_package_version),
        },
        plugins: [
            !isProd ? basicSsl() : undefined,
            isProd ? checker({
                // typescript: true,
                eslint: {
                    lintCommand: 'eslint ./src',
                },
                stylelint: {
                    lintCommand: 'stylelint "./src/**/*.css"',
                },
            }) : undefined,
            VitePWA({
                // buildBase: './build/',
                strategies: 'generateSW',
                registerType: 'prompt',
                injectRegister: 'script',
                devOptions: { enabled: false },
                includeAssets: ['app-icon.svg'],
                manifest: {
                    name: 'Timur',
                    short_name: 'Timur',
                    description: 'Timur - Phase Zero',
                    theme_color: '#FFFFFF',
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
                    // cleanupOutdatedCaches: true,
                    clientsClaim: true,
                    skipWaiting: true,
                    // swDest: './build',
                },
                pwaAssets: {
                    config: true,
                    overrideManifestIcons: true,
                },
            }),
            svgr(),
            reactSwc(),
            tsconfigPaths(),
            webfontDownload(),
            validateEnv(envConfig),
            isProd ? compression() : undefined,
            isProd ? visualizer({ sourcemap: true }) : undefined,
        ],
        css: {
            devSourcemap: isProd,
            modules: {
                scopeBehaviour: 'local',
                localsConvention: 'camelCaseOnly',
            },
        },
        envPrefix: 'APP_',
        server: {
            port: 3000,
            host: 'local.timur.dev.togglecorp.com',
            strictPort: true,
            https: true,
        },
        build: {
            outDir: './build',
            sourcemap: isProd,
            emptyOutDir: true,
            rollupOptions: {
                output: {
                    chunkFileNames: 'chunk-[name].[hash].js',
                    entryFileNames: 'entry-[name].[hash].js',
                    assetFileNames: 'asset-[name]-[hash].[ext]',
                    manualChunks: {
                        'code-mirror': [
                            '@codemirror/lang-markdown',
                            '@uiw/codemirror-theme-github',
                            '@uiw/react-codemirror',
                        ],
                        'codemirror-vim-mode': ['@replit/codemirror-vim']
                    }
                },
            },
        },
        test: {
            environment: 'happy-dom',
            coverage: {
                enabled: true,
                reporter: 'html',
            },
        },
    };
});
