#!/usr/bin/env -S deno run --allow-net --allow-env --allow-npm

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { S3Resource } from "./resources/s3.ts";
import { createTools } from "./tools/index.ts";

// Process command-line arguments
const args = Deno.args;
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
aws-s3-mcp - S3 Model Context Protocol Server

Usage:
  aws-s3-mcp [options]

Options:
  -h, --help     Show this help message
  -v, --version  Show version information

Environment Variables:
  AWS_REGION            AWS region where your S3 buckets are located
  S3_BUCKETS            Comma-separated list of allowed S3 bucket names
  S3_MAX_BUCKETS        Maximum number of buckets to return in listing
  AWS_ACCESS_KEY_ID     AWS access key (if using explicit credentials)
  AWS_SECRET_ACCESS_KEY AWS secret key (if using explicit credentials)

For more information, visit: https://github.com/samuraikun/aws-s3-mcp
  `);
  Deno.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
  console.log("aws-s3-mcp v0.2.5");
  Deno.exit(0);
}

// Create server instance
const server = new McpServer({
  name: "s3-mcp-server",
  version: "0.2.5",
});

// Initialize S3Resource class
const s3Resource = new S3Resource();

// Create and register all tools
const tools = createTools(s3Resource);
for (const tool of tools) {
  // Register tool with MCP server while avoiding Deno type checks
  server.tool(
    tool.name,
    tool.description,
    // @ts-ignore - Convert zod-formatted parameters to the format expected by MCP server
    tool.parameters,
    // Bind execute function to preserve context
    tool.execute.bind(tool),
  );
}

// Start the server
async function main() {
  try {
    // Handle interruption signal
    Deno.addSignalListener("SIGINT", async () => {
      console.log("Shutting down server...");
      await server.close();
      Deno.exit(0);
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("S3 MCP server running on stdio transport");
  } catch (error) {
    console.error("Error starting server:", error);
    Deno.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  Deno.exit(1);
});
