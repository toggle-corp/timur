# -------------------------- Dev ---------------------------------------

FROM node:18-bullseye AS dev

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/* \
    # NOTE: yarn > 1.22.19 breaks yarn-install invoked by pnpm
    && npm install -g pnpm@8.6.0 yarn@1.22.19 --force \
    && git config --global --add safe.directory /code

WORKDIR /code

# -------------------------- Nginx - Builder --------------------------------
FROM dev AS nginx-build

COPY ./package.json ./pnpm-lock.yaml /code/

RUN pnpm install

COPY . /code/

# Build variables (Requires backend pulled)
ENV APP_GRAPHQL_CODEGEN_ENDPOINT=./backend/schema.graphql

RUN pnpm generate:type && pnpm build
