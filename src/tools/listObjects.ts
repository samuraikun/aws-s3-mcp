import { z } from "zod";
import { createErrorResponse } from "../helpers/createErrorResponse.ts";
import type { S3Resource } from "../resources/s3.ts";
import type { IMCPTool, InferZodParams } from "../types.ts";

/**
 * List objects in an S3 bucket
 */
export class ListObjectsTool implements IMCPTool {
  /**
   * Tool name
   */
  readonly name = "list-objects";

  /**
   * Tool description
   */
  readonly description = "List objects in an S3 bucket";

  /**
   * Parameter definition
   */
  readonly parameters = {
    bucket: z.string().describe("Name of the S3 bucket"),
    prefix: z.string().optional().describe("Prefix to filter objects (like a folder)"),
    maxKeys: z.number().optional().describe("Maximum number of objects to return"),
  } as const;

  /**
   * S3Resource instance
   */
  private s3Resource: S3Resource;

  /**
   * Constructor
   */
  constructor(s3Resource: S3Resource) {
    this.s3Resource = s3Resource;
  }

  /**
   * Execute function
   */
  async execute(args: InferZodParams<typeof this.parameters>) {
    const { bucket, prefix, maxKeys } = args;

    try {
      const objects = await this.s3Resource.listObjects(bucket, prefix || "", maxKeys || 1000);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(objects, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `Error listing objects in bucket ${bucket}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
