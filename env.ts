import { defineConfig, Schema } from '@julr/vite-plugin-validate-env';

export default defineConfig({
    APP_TITLE: Schema.string(),
    APP_ENVIRONMENT: Schema.enum(['development', 'testing', 'staging', 'production'] as const),
})
