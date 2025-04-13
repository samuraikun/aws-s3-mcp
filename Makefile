# AWS S3 MCP Server Makefile
# Includes commands for both Node.js and Deno environments

# Environment variables
ENV_FILE := .env
REQUIRED_ENV_VARS := AWS_REGION AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
DOCKER_COMPOSE := docker-compose
CONTAINER_NAME := aws-s3-mcp-aws-s3-mcp-1

# Check for required environment variables
env-check:
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "ERROR: $(ENV_FILE) file not found. Please create one based on .env.sample"; \
		echo "Make sure to fill in your AWS credentials."; \
		exit 1; \
	fi
	@. $(ENV_FILE) && \
	missing="" && \
	for var in $(REQUIRED_ENV_VARS); do \
		if [ -z "$${!var}" ]; then \
			missing="$$missing $$var"; \
		fi; \
	done && \
	if [ -n "$$missing" ]; then \
		echo "ERROR: Missing required environment variables:$$missing"; \
		echo "Please set them in $(ENV_FILE) file."; \
		exit 1; \
	fi

# Node.js commands
.PHONY: build test test-watch test-coverage lint format

build: env-check
	npm run build

start: build
	node dist/index.js

test:
	npm run test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

lint:
	npm run lint

format:
	npm run format

check-format:
	npm run check:format

fix-format:
	npx @biomejs/biome check --fix

# MCP Inspector with Node.js
inspector-node: build
	@echo "Launching MCP Inspector with Node.js S3 MCP server..."
	@echo "This will open in your browser. If it doesn't, check the terminal output for a URL to open."
	npx @modelcontextprotocol/inspector node ./dist/index.js

# Docker with Node.js
docker-build:
	docker build -t aws-s3-mcp .

docker-run: docker-build
	docker run --rm --name aws-s3-mcp -p 3000:3000 aws-s3-mcp

# Deno with Docker commands
.PHONY: deno-build deno-start deno-stop deno-restart deno-logs deno-test deno-inspector

deno-build:
	docker build -t aws-s3-mcp .

deno-start: env-check
	$(DOCKER_COMPOSE) up -d --build
	@echo "Deno S3 MCP server started in Docker container"

deno-stop:
	$(DOCKER_COMPOSE) down
	@echo "Deno S3 MCP server stopped"

deno-restart: deno-stop deno-start

deno-logs:
	docker logs $(CONTAINER_NAME)

deno-test:
	@if ! docker ps | grep -q "$(CONTAINER_NAME)"; then \
		echo "Starting container for tests..."; \
		$(DOCKER_COMPOSE) up -d; \
		sleep 2; \
	fi
	@echo "Running Deno tests..."
	@echo "================================================================================"
	docker exec -i $(CONTAINER_NAME) deno test --allow-net --allow-env --allow-read --allow-sys /app/test/deno/
	@echo "================================================================================"
	@echo "Tests completed"

# MCP Inspector with Deno
deno-inspector: env-check
	@if ! docker ps | grep -q "$(CONTAINER_NAME)"; then \
		echo "Starting Deno S3 MCP server with docker-compose..."; \
		$(DOCKER_COMPOSE) up -d --build; \
		sleep 2; \
		if ! docker ps | grep -q "$(CONTAINER_NAME)"; then \
			echo "ERROR: Deno S3 MCP server failed to start."; \
			docker logs $(CONTAINER_NAME); \
			exit 1; \
		fi; \
	fi
	@echo "Launching MCP Inspector with Deno S3 MCP server..."
	@echo "This will open in your browser. If it doesn't, check the terminal output for a URL to open."
	npx @modelcontextprotocol/inspector docker exec -i $(CONTAINER_NAME) deno run --allow-net --allow-env --allow-read --allow-sys /app/src/index.ts

# Stop containers when done with inspector
deno-inspector-cleanup: deno-stop
	@echo "Done! MCP Inspector session ended."

# Default target
.DEFAULT_GOAL := help

# Help command
help:
	@echo "AWS S3 MCP Server Makefile"
	@echo ""
	@echo "Node.js Commands:"
	@echo "  make build              - Build the Node.js version"
	@echo "  make start              - Start the Node.js server"
	@echo "  make test               - Run tests with Vitest"
	@echo "  make test-watch         - Run tests in watch mode"
	@echo "  make test-coverage      - Run tests with coverage"
	@echo "  make lint               - Run linter"
	@echo "  make format             - Format code"
	@echo "  make check-format       - Check formatting"
	@echo "  make inspector-node     - Run MCP Inspector with Node.js"
	@echo "  make docker-build       - Build Docker image for Node.js"
	@echo "  make docker-run         - Run Docker container for Node.js"
	@echo ""
	@echo "Deno Commands:"
	@echo "  make deno-build         - Build Deno Docker image"
	@echo "  make deno-start         - Start Deno in Docker container"
	@echo "  make deno-stop          - Stop Deno Docker container"
	@echo "  make deno-restart       - Restart Deno Docker container"
	@echo "  make deno-logs          - View Deno container logs"
	@echo "  make deno-test          - Run Node.js tests with Deno compatibility layer"
	@echo "  make deno-native-test   - Run Deno native tests"
	@echo "  make deno-inspector     - Run MCP Inspector with Deno Docker"
	@echo "  make deno-inspector-cleanup - Cleanup after Inspector"
	@echo ""
