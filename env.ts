import { defineConfig, Schema } from '@julr/vite-plugin-validate-env';

export default defineConfig({
    APP_TITLE: Schema.string(),
    APP_ENVIRONMENT: Schema.enum(['development', 'testing', 'staging', 'production'] as const),
    APP_GRAPHQL_CODEGEN_ENDPOINT: Schema.string(),
    APP_GRAPHQL_ENDPOINT: Schema.string(),
    APP_AUTH_URL: Schema.string(),
})
