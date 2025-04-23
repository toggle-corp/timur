## Local Development (Using Docker)

We use a `docker-compose.yml` file (located at `./backend/docker-compose.yml`).
To run it, you need to set up a `.env` file.

Create a `.env` file with the following content:

```
# Include the backend services
COMPOSE_FILE=./backend/docker-compose.yml:docker-compose.yml

# Use the same .env file for both backend and web-app
BACKEND_ENV_FILE=../.env
```

> NOTE: `../` refers to the web-app folder, relative to `./backend/docker-compose.yml` (the main Docker Compose file).
