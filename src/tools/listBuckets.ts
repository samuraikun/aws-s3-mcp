import { createErrorResponse } from "../helpers/createErrorResponse.ts";
import type { S3Resource } from "../resources/s3.ts";
import type { IMCPTool } from "../types.ts";

/**
 * List available S3 buckets
 */
export class ListBucketsTool implements IMCPTool {
  /**
   * Tool name
   */
  readonly name = "list-buckets";

  /**
   * Tool description
   */
  readonly description = "List available S3 buckets";

  /**
   * Parameter definition (empty for this tool)
   */
  readonly parameters = {} as const;

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
   * @param args Empty for this tool
   */
  async execute(_args: Record<string, never>) {
    try {
      const buckets = await this.s3Resource.listBuckets();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(buckets, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(
        error,
        `Error listing buckets: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
