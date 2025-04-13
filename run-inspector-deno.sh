#!/bin/bash

# Run MCP Inspector for Deno S3 MCP Server
# This script launches the MCP Inspector connected to our Deno-based S3 MCP server

# Check if .env file exists
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Please create one based on .env.sample."
  echo "Make sure to fill in your AWS credentials."
  exit 1
fi

# Load environment variables from .env
export $(grep -v '^#' .env | xargs)

# Build the Docker image if it doesn't exist or rebuild is requested
if [[ "$1" == "--rebuild" ]] || ! docker images | grep -q "aws-s3-mcp"; then
  echo "Building Docker image for S3 MCP server..."
  docker build -t aws-s3-mcp .
fi

# docker-compose will automatically manage the network

# Start the Deno MCP server using docker-compose
echo "Starting Deno S3 MCP server with docker-compose..."

# Stop existing containers if they exist
docker-compose down

# Start the container
docker-compose up -d --build

# Container name is based on docker-compose naming structure
CONTAINER_NAME="aws-s3-mcp-aws-s3-mcp-1"

# Give the server a moment to start
sleep 2

# Check if the server started successfully
if ! docker ps | grep -q "$CONTAINER_NAME"; then
  echo "ERROR: Deno S3 MCP server failed to start. Check the logs:"
  docker logs $CONTAINER_NAME
  echo "Cleaning up..."
  docker rm -f $CONTAINER_NAME >/dev/null 2>&1
  exit 1
fi

# Launch the MCP Inspector connected to the Docker container
echo "Launching MCP Inspector with Deno S3 MCP server..."
echo "This will open in your browser. If it doesn't, check the terminal output for a URL to open."
echo "Test the S3 tools against your configured buckets as described in README.deno.md"
echo ""

# Direct connection to the Docker container
echo "Starting MCP Inspector..."
npx @modelcontextprotocol/inspector docker exec -i $CONTAINER_NAME deno run --allow-net --allow-env --allow-read --allow-sys /app/src/index.ts

# When the user exits the inspector, clean up
echo "Cleaning up..."
docker-compose down

echo "Done! MCP Inspector session ended."
exit 0
