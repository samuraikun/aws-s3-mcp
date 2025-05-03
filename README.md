[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/samuraikun-aws-s3-mcp-badge.png)](https://mseep.ai/app/samuraikun-aws-s3-mcp)

# S3 MCP Server

[![CI](https://img.shields.io/github/actions/workflow/status/samuraikun/aws-s3-mcp/test.yml?branch=main&style=flat-square&logo=github&label=tests)](https://github.com/samuraikun/aws-s3-mcp/actions/workflows/test.yml)
[![Trivy Scan](https://img.shields.io/github/actions/workflow/status/samuraikun/aws-s3-mcp/docker.yml?branch=main&label=trivy&style=flat-square&logo=aquasecurity)](https://github.com/samuraikun/aws-s3-mcp/actions/workflows/docker.yml)
[![npm version](https://img.shields.io/npm/v/aws-s3-mcp?style=flat-square&logo=npm)](https://www.npmjs.com/package/aws-s3-mcp)
[![npm downloads](https://img.shields.io/npm/dm/aws-s3-mcp?style=flat-square&logo=npm)](https://www.npmjs.com/package/aws-s3-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/aws-s3-mcp?style=flat-square&logo=nodedotjs)](https://nodejs.org/)

An Amazon S3 Model Context Protocol (MCP) server that provides tools for interacting with S3 buckets and objects.

https://github.com/user-attachments/assets/d05ff0f1-e2bf-43b9-8d0c-82605abfb666

## Overview

This MCP server allows Large Language Models (LLMs) like Claude to interact with AWS S3 storage. It provides tools for:

- Listing available S3 buckets
- Listing objects within a bucket
- Retrieving object contents

The server is built using TypeScript and the MCP SDK, providing a secure and standardized way for LLMs to interface with S3.

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- AWS credentials configured (either through environment variables or AWS credentials file)
- Docker (optional, for containerized setup)

### Setup

1. Install via npm:

```bash
# Install globally via npm
npm install -g aws-s3-mcp

# Or as a dependency in your project
npm install aws-s3-mcp
```

2. If building from source:

```bash
# Clone the repository
git clone https://github.com/samuraikun/aws-s3-mcp.git
cd aws-s3-mcp

# Install dependencies and build
npm install
npm run build
```

3. Configure AWS credentials and S3 access:

Create a `.env` file with your AWS configuration:

```
AWS_REGION=us-east-1
S3_BUCKETS=bucket1,bucket2,bucket3
S3_MAX_BUCKETS=5
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

Or set these as environment variables.

## Configuration

The server can be configured using the following environment variables:

| Variable                | Description                                       | Default           |
| ----------------------- | ------------------------------------------------- | ----------------- |
| `AWS_REGION`            | AWS region where your S3 buckets are located      | `us-east-1`       |
| `S3_BUCKETS`            | Comma-separated list of allowed S3 bucket names   | (empty)           |
| `S3_MAX_BUCKETS`        | Maximum number of buckets to return in listing    | `5`               |
| `AWS_ACCESS_KEY_ID`     | AWS access key (if not using default credentials) | (from AWS config) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (if not using default credentials) | (from AWS config) |

## Running the Server

### Direct Node.js Execution

You can run the server directly with Node.js:

```bash
# Using npx (without installing)
npx aws-s3-mcp

# If installed globally
npm install -g aws-s3-mcp
aws-s3-mcp

# If running from cloned repository
npm start

# Or directly
node dist/index.js
```

### Docker Setup 🐳

You can run the S3 MCP server as a Docker container using either Docker CLI or Docker Compose.

#### Using Docker CLI

1. Build the Docker image:

```bash
docker build -t aws-s3-mcp .
```

2. Run the container with environment variables:

```bash
# Option 1: Pass environment variables directly
docker run -d \
  -e AWS_REGION=us-east-1 \
  -e S3_BUCKETS=bucket1,bucket2 \
  -e S3_MAX_BUCKETS=5 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  --name aws-s3-mcp-server \
  aws-s3-mcp

# Option 2: Use environment variables from .env file
docker run -d \
  --env-file .env \
  --name aws-s3-mcp-server \
  aws-s3-mcp
```

3. Check container logs:

```bash
docker logs aws-s3-mcp-server
```

4. Stop and remove the container:

```bash
docker stop aws-s3-mcp-server
docker rm aws-s3-mcp-server
```

Note that the container doesn't expose any ports because it's designed to be used with Claude Desktop through Docker exec rather than direct HTTP connections.

#### Using Docker Compose

1. Build and start the Docker container:

```bash
# Build and start the container
docker compose up -d s3-mcp

# View logs
docker compose logs -f s3-mcp
```

2. To stop the container:

```bash
docker compose down
```

#### Using Docker with MinIO for Testing

The Docker Compose setup includes a MinIO service for local testing:

```bash
# Start MinIO and the MCP server
docker compose up -d

# Access MinIO console at http://localhost:9001
# Default credentials: minioadmin/minioadmin
```

The MinIO service automatically creates two test buckets (`test-bucket-1` and `test-bucket-2`) and uploads sample files for testing.

## Debugging on MCP Inspector

To debug the server using MCP Inspector:

```bash
# Run inspector with local Node.js
sh run-inspector.sh

# Run inspector with Docker Compose and MinIO
sh run-inspector.sh --docker-compose

# Run inspector with Docker CLI (without Docker Compose)
sh run-inspector.sh --docker
```

When using the `--docker-compose` option, the script will:

1. Start MinIO and the S3 MCP server containers if they aren't running
2. Launch the MCP Inspector connected to the S3 MCP server
3. You can then test the S3 tools against the local MinIO instance

## Connecting to Claude Desktop

To use this server with Claude Desktop:

1. Edit your Claude Desktop configuration file:

   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the S3 MCP server to the configuration:

```json
{
  "mcpServers": {
    "s3": {
      "command": "npx",
      "args": ["aws-s3-mcp"],
      "env": {
        "AWS_REGION": "us-east-1",
        "S3_BUCKETS": "bucket1,bucket2,bucket3",
        "S3_MAX_BUCKETS": "5",
        "AWS_ACCESS_KEY_ID": "your-access-key",
        "AWS_SECRET_ACCESS_KEY": "your-secret-key"
      }
    }
  }
}
```

### Docker Option for Claude Desktop 🐳

You can also configure Claude Desktop to use a running Docker container for the MCP server:

```json
{
  "mcpServers": {
    "s3": {
      "command": "docker",
      "args": ["exec", "-i", "aws-s3-mcp-server", "node", "dist/index.js"],
      "env": {}
    }
  }
}
```

> **⚠️ Important Prerequisites**: For this Docker configuration to work, you **MUST** first build and run the Docker container **BEFORE** launching Claude Desktop:
>
> ```bash
> # 1. First, build the Docker image (only needed once or after changes)
> docker build -t aws-s3-mcp .
>
> # 2. Then start the container (required each time before using with Claude)
> # Using Docker Compose (recommended)
> docker compose up -d s3-mcp
>
> # Or using Docker CLI
> docker run -d --name aws-s3-mcp-server --env-file .env aws-s3-mcp
> ```
>
> Without a running container, Claude Desktop will show errors when trying to use S3 tools.
>
> The Docker configuration above uses `exec` to send MCP requests directly to the running container. No port mapping is required since Claude communicates directly with the container instead of through a network port.

> **Note**: Ensure the container name in the configuration (`aws-s3-mcp-server`) matches the name of your running container.

> **Important**: Please note the following when using the configuration above
>
> - Replace `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with your actual credentials
> - `S3_BUCKETS` should contain a comma-separated list of buckets you want to allow access to
> - `AWS_REGION` should be set to the region where your buckets are located

### 💣 If error occurs on Claude Desktop

If you encounter errors with the above configuration in Claude Desktop, try using absolute paths as follows:

```bash
# Get the path of node and aws-s3-mcp
which node
which aws-s3-mcp
```

```json
{
  "globalShortcut": "",
  "mcpServers": {
    "s3": {
      "command": "your-absolute-path-to-node",
      "args": ["your-absolute-path-to-aws-s3-mcp/dist/index.js"],
      "env": {
        "AWS_REGION": "your-aws-region",
        "S3_BUCKETS": "your-s3-buckets",
        "S3_MAX_BUCKETS": "your-max-buckets",
        "AWS_ACCESS_KEY_ID": "your-access-key",
        "AWS_SECRET_ACCESS_KEY": "your-secret-key"
      }
    }
  }
}
```

## Available Tools

### list-buckets

Lists available S3 buckets that the server has permission to access. This tool respects the `S3_BUCKETS` configuration that limits which buckets are shown.

**Parameters:** None

**Example output:**

```json
[
  {
    "Name": "my-images-bucket",
    "CreationDate": "2022-03-15T10:30:00.000Z"
  },
  {
    "Name": "my-documents-bucket",
    "CreationDate": "2023-05-20T14:45:00.000Z"
  }
]
```

### list-objects

Lists objects in a specified S3 bucket.

**Parameters:**

- `bucket` (required): Name of the S3 bucket to list objects from
- `prefix` (optional): Prefix to filter objects (like a folder path)
- `maxKeys` (optional): Maximum number of objects to return

**Example output:**

```json
[
  {
    "Key": "sample.pdf",
    "LastModified": "2023-10-10T08:12:15.000Z",
    "Size": 2048576,
    "StorageClass": "STANDARD"
  },
  {
    "Key": "sample.md",
    "LastModified": "2023-10-12T15:30:45.000Z",
    "Size": 1536000,
    "StorageClass": "STANDARD"
  }
]
```

### get-object

Retrieves an object from a specified S3 bucket. Text files are returned as plain text, while binary files are returned with limited details.

**Parameters:**

- `bucket` (required): Name of the S3 bucket
- `key` (required): Key (path) of the object to retrieve

**Example text output:**

```
This is the content of a text file stored in S3.
It could be JSON, TXT, CSV or other text-based formats.
```

**Example binary output:**

```
Binary content (image/jpeg): base64 data is /9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof...
```

## Security Considerations

- The server will only access buckets specified in the `S3_BUCKETS` environment variable
- AWS credentials must have appropriate permissions to the buckets
- Use the principle of least privilege when configuring AWS permissions
- For production use, consider using IAM roles with specific S3 permissions

## Usage with Claude

When interacting with Claude in the desktop app, you can ask it to perform S3 operations like:

- "List all my S3 buckets"
- "Summarize PDF files in my-documents-bucket"
- "Get the README.txt file from my-documents-bucket"

Claude will use the appropriate MCP tool to carry out the request and show you the results.

## License

MIT
