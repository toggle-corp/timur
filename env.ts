import { defineConfig, Schema } from '@julr/vite-plugin-validate-env';

export default defineConfig({
    APP_TITLE: Schema.string(),
    APP_ENVIRONMENT: (key, value) => {
        // NOTE: APP_ENVIRONMENT_PLACEHOLDER is meant to be used with image builds
        // The value will be later replaced with the actual value
        const regex = /^production|staging|testing|alpha-\d+|development|APP_ENVIRONMENT_PLACEHOLDER$/;
        const valid = !!value && (value.match(regex) !== null);
        if (!valid) {
            throw new Error(`Value for environment variable "${key}" must match regex "${regex}", instead received "${value}"`);
        }
        if (value === 'APP_ENVIRONMENT_PLACEHOLDER') {
            console.warn(`Using ${value} for app environment. Make sure to not use this for builds without nginx-serve`)
        }
        return value as ('production' | 'staging' | 'testing' | `alpha-${number}` | 'development' | 'APP_ENVIRONMENT_PLACEHOLDER');
    },
    APP_GRAPHQL_CODEGEN_ENDPOINT: Schema.string(),
    APP_GRAPHQL_DOMAIN: Schema.string(),
    APP_UMAMI_SRC: Schema.string.optional(),
    APP_UMAMI_ID: Schema.string.optional(),
    APP_SENTRY_DSN: Schema.string.optional(),
});
