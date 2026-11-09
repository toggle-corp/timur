import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    schema: process.env.APP_GRAPHQL_CODEGEN_ENDPOINT,
    documents: [
        'src/**/*.tsx',
        'src/**/*.ts'
    ],
    ignoreNoDocuments: true, // for better experience with the watcher
    generates: {
        './generated/types/': {
            preset: 'client',
        }
    },
    config: {
        enumsAsTypes: true,
        scalars: {
            Date: 'string',
            DateTime: 'string',
            Time: 'string',
        },
    },
}

export default config;
