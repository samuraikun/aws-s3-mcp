import type { S3Resource } from "../resources/s3.ts";
import type { IMCPTool } from "../types.ts";
import { GetObjectTool } from "./getObject.ts";
import { ListBucketsTool } from "./listBuckets.ts";
import { ListObjectsTool } from "./listObjects.ts";

/**
 * Create all tool instances
 * @param s3Resource S3Resource instance to be used by all tools
 * @returns Array of all tools
 */
export function createTools(s3Resource: S3Resource): IMCPTool[] {
  return [
    new ListBucketsTool(s3Resource),
    new ListObjectsTool(s3Resource),
    new GetObjectTool(s3Resource),
  ];
}

// Export all tool classes
export { ListBucketsTool, ListObjectsTool, GetObjectTool };
