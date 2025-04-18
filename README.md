# S3 MCP Server

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

You can run the server with Node.js:

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

## Debugging on MCP Inspector

To debug the server using MCP Inspector, you can run `sh run-inspector.sh`

```bash
sh run-inspector.sh
```

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
