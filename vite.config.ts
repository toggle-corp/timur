import { ValidateEnv as validateEnv } from '@julr/vite-plugin-validate-env';
import reactSwc from '@vitejs/plugin-react-swc';
import { execSync } from 'child_process';
import { visualizer } from 'rollup-plugin-visualizer';
import {
    defineConfig,
    type HtmlTagDescriptor,
    loadEnv,
    type UserConfig,
} from 'vite';
import checker from 'vite-plugin-checker';
import { compression } from 'vite-plugin-compression2';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';
import webfontDownload from 'vite-plugin-webfont-dl';
import tsconfigPaths from 'vite-tsconfig-paths';

/* Get commit hash */
const commitHash = execSync('git rev-parse --short HEAD').toString();

function umamiPlugin(options: { id: string | undefined, src: string | undefined }) {
    return {
        name: 'html-transform',
        transformIndexHtml: () => {
            if (!options.id || !options.src) {
                console.warn('Umami src and id not set.');
                return [];
            }
            const tags: HtmlTagDescriptor[] = [
                {
                    tag: 'script',
                    attrs: {
                        async: true,
                        defer: true,
                        'data-website-id': options.id,
                        src: options.src,
                    },
                },
            ];
            return tags;
        },
    };
}

export default defineConfig(({ mode }) => {
    const isProd = mode === 'production';
    const isDev = mode === 'development';
    console.log('Mode:', mode);
    const env = loadEnv(mode, process.cwd(), '');

    const config: UserConfig = {
        define: {
            'import.meta.env.APP_COMMIT_HASH': JSON.stringify(commitHash),
            'import.meta.env.APP_VERSION': JSON.stringify(env.npm_package_version),
        },
        plugins: [
            isProd ? checker({
                // typescript: true,
                eslint: {
                    lintCommand: 'eslint ./src',
                },
                stylelint: {
                    lintCommand: 'stylelint "./src/**/*.css"',
                },
            }) : undefined,
            isProd ? umamiPlugin({
                id: env.APP_UMAMI_ID,
                src: env.APP_UMAMI_SRC,
            }) : undefined,
            VitePWA({
                disable: isDev,
                // buildBase: './build/',
                strategies: 'generateSW',
                registerType: 'prompt',
                // NOTE: registration is done using useRegisterSW
                injectRegister: false,
                devOptions: { enabled: false },
                includeAssets: ['app-icon.svg'],
                manifest: {
                    id: 'timur-app',
                    name: 'Timur',
                    short_name: 'Timur',
                    description: 'Timur - Phase Zero',
                    lang: 'en',
                    start_url: '/',
                    scope: '/',
                    display: 'standalone',
                    display_override: ['standalone'],
                    orientation: 'any',
                    theme_color: '#fafaf0',
                    background_color: '#fafaf0',
                    categories: ['productivity'],
                    // NOTE: handle_links lets the installed PWA capture in-scope URLs opened from Custom Tabs or external browsers (e.g. OAuth callback). launch_handler then routes that capture into the existing PWA window instead of opening a fresh blank one.
                    handle_links: 'preferred',
                    launch_handler: {
                        client_mode: 'navigate-existing',
                    },
                    shortcuts: [
                        {
                            name: 'Daily Journal',
                            short_name: 'Journal',
                            description: 'Open today\'s journal',
                            url: '/daily-journal',
                        },
                        {
                            name: 'Daily Standup',
                            short_name: 'Standup',
                            description: 'Open today\'s standup',
                            url: '/daily-standup',
                        },
                    ],
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
                    cleanupOutdatedCaches: true,
                    navigateFallbackDenylist: [/^\/api/, /^\/admin/, /^\/graphql/],
                    runtimeCaching: [
                        {
                            // NOTE: Google profile picture URLs are content-addressed (the URL changes when the image changes), so CacheFirst is safe and avoids redundant network round-trips.
                            urlPattern: ({ url }) => (
                                /\.googleusercontent\.com$/.test(url.hostname)
                            ),
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'google-user-images',
                                expiration: {
                                    maxEntries: 60,
                                    maxAgeSeconds: 60 * 60 * 24 * 30,
                                },
                                cacheableResponse: { statuses: [0, 200] },
                            },
                        },
                        {
                            urlPattern: ({ request, sameOrigin }) => (
                                !sameOrigin && request.destination === 'image'
                            ),
                            handler: 'StaleWhileRevalidate',
                            options: {
                                cacheName: 'external-images',
                                expiration: {
                                    maxEntries: 100,
                                    maxAgeSeconds: 60 * 60 * 24 * 7,
                                },
                                cacheableResponse: { statuses: [0, 200] },
                            },
                        },
                    ],
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
            validateEnv({
                configFile: 'env',
            }),
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
            strictPort: true,
            host: '0.0.0.0',
            hmr: {
                clientPort: 5173,
            },
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
                        'codemirror-vim-mode': ['@replit/codemirror-vim'],
                    },
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
    return config;
});
