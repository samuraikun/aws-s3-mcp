# AWS S3 MCP Server (Deno Docker Version)

A secure Model Context Protocol (MCP) server for AWS S3, allowing AI agents like Claude Desktop, VSCode Copilot, and Cursor to interact with Amazon S3 buckets.

This implementation uses the official Deno Docker image along with permission-based security and containerization, following best practices from the [denoland/deno_docker](https://github.com/denoland/deno_docker) repository.

## Features

- List S3 buckets
- List objects within a bucket
- Retrieve and display S3 objects (supports text, PDFs, etc.)
- Environment variable configuration and security controls

## Security Enhancements

- **Deno's Permission System**: Limited to specific capabilities only
- **Official Deno Docker Image**: Using the maintained Debian-based image
- **Non-Root User**: Running as `deno` user (UID 1993) for reduced privileges
- **Persistent Caching**: Proper cache handling for dependencies
- **Container Isolation**: Process separation for enhanced security

## Prerequisites

- Docker and Docker Compose
- AWS credentials (access key ID and secret access key)
- Access permissions to S3 buckets
- MCP-supporting AI agent (Claude Desktop, VSCode Copilot, Cursor, etc.)

## Installation and Usage

### Running with Docker Compose (Recommended)

The simplest way to run the server with proper configuration:

1. Clone this repository

```bash
git clone https://github.com/samuraikun/aws-s3-mcp.git
cd aws-s3-mcp
```

2. Create a `.env` file with your AWS credentials

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKETS=bucket1,bucket2
```

3. Start with Docker Compose

```bash
docker-compose -f docker-compose.deno.yml up -d
```

This setup includes:

- Persistent cache volume for better performance
- Non-root user for enhanced security
- Properly configured permissions
- Auto-restart capability

### Debugging with MCP Inspector

For easier debugging and testing, you can use the included MCP Inspector script:

```bash
# Make the script executable if needed
chmod +x run-inspector-deno.sh

# Run the MCP Inspector with the Deno server
./run-inspector-deno.sh
```

This script:

- Builds the Deno Docker image if needed (or use --rebuild to force rebuild)
- Creates a dedicated Docker network for inspection
- Runs the Deno MCP server in a container
- Connects the MCP Inspector to the running container
- Cleans up all resources when you exit the inspector

You'll get a browser-based interface for testing all S3 tools interactively.

### Running with Docker Directly

For manual control:

```bash
# Build the image
docker build -t aws-s3-mcp-deno -f Dockerfile.deno .

# Run the container
docker run -it --rm \
  -e AWS_REGION="us-east-1" \
  -e AWS_ACCESS_KEY_ID="your-access-key" \
  -e AWS_SECRET_ACCESS_KEY="your-secret-key" \
  -e S3_BUCKETS="bucket1,bucket2" \
  -v "$(pwd)/deno-cache:/app/.deno-dir" \
  aws-s3-mcp-deno
```

### Running Directly with Deno (Development Only)

For development purposes only:

```bash
deno run --allow-net --allow-env --allow-npm --allow-read src/index.ts
```

## Connecting to AI Agents

### Claude Desktop

Add to your configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "aws-s3": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "${env:HOME}/.deno:/app/.deno-dir",
        "-e",
        "AWS_ACCESS_KEY_ID=${env:AWS_ACCESS_KEY_ID}",
        "-e",
        "AWS_SECRET_ACCESS_KEY=${env:AWS_SECRET_ACCESS_KEY}",
        "-e",
        "AWS_REGION=${env:AWS_REGION}",
        "-e",
        "S3_BUCKETS=${env:S3_BUCKETS}",
        "aws-s3-mcp-deno:latest",
        "deno",
        "run",
        "--allow-net",
        "--allow-env",
        "--allow-read",
        "--allow-sys",
        "/app/src/index.ts"
      ],
      "env": {}
    }
  }
}
```

### VSCode Copilot

Add to your settings file (`~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "aws-s3": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "${env:HOME}/.deno:/app/.deno-dir",
        "-e",
        "AWS_ACCESS_KEY_ID=${env:AWS_ACCESS_KEY_ID}",
        "-e",
        "AWS_SECRET_ACCESS_KEY=${env:AWS_SECRET_ACCESS_KEY}",
        "-e",
        "AWS_REGION=${env:AWS_REGION}",
        "-e",
        "S3_BUCKETS=${env:S3_BUCKETS}",
        "aws-s3-mcp-deno:latest",
        "deno",
        "run",
        "--allow-net",
        "--allow-env",
        "--allow-read",
        "--allow-sys",
        "/app/src/index.ts"
      ],
      "env": {}
    }
  }
}
```

## Environment Variables

| Variable Name             | Description                                                                          | Default     |
| ------------------------- | ------------------------------------------------------------------------------------ | ----------- |
| `AWS_REGION`              | AWS region where your S3 buckets are located                                         | `us-east-1` |
| `AWS_ACCESS_KEY_ID`       | AWS access key for authentication                                                    | Required    |
| `AWS_SECRET_ACCESS_KEY`   | AWS secret key for authentication                                                    | Required    |
| `S3_BUCKETS`              | Comma-separated list of allowed bucket names. If not set, all buckets are accessible | None        |
| `S3_MAX_BUCKETS`          | Maximum number of buckets to return in listings                                      | `5`         |
| `AWS_ENDPOINT`            | Custom endpoint (for MinIO, etc.)                                                    | None        |
| `AWS_S3_FORCE_PATH_STYLE` | Whether to force path-style URLs (required for MinIO)                                | `false`     |
| `DENO_DIR`                | Deno cache directory location                                                        | `/deno-dir` |

## Implementation Notes

This implementation follows the recommendations from the official [denoland/deno_docker](https://github.com/denoland/deno_docker) repository, including:

- Using the Debian-based image for better compatibility
- Running as the non-root `deno` user (UID 1993)
- Proper volume mounting for dependency caching
- Minimal permission model with explicit flags

## License

MIT
