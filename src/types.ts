import type {
  Bucket,
  GetObjectCommandOutput,
  S3ServiceException,
  _Object,
} from "@aws-sdk/client-s3";
import type { z } from "zod";

/**
 * S3 Object data with content type
 */
export interface S3ObjectData {
  data: string | Uint8Array;
  contentType: string;
}

/**
 * Helper type to infer parameters from zod schema
 */
export type InferZodParams<T extends Record<string, z.ZodType>> = {
  [K in keyof T]: z.infer<T[K]>;
};

/**
 * Interface for MCP tools
 */
export interface IMCPTool<TParams extends Record<string, z.ZodType> = Record<string, z.ZodType>> {
  /**
   * Tool name
   */
  readonly name: string;
  /**
   * Tool description
   */
  readonly description: string;
  /**
   * Parameter definitions
   */
  readonly parameters: TParams;
  /**
   * Execute the tool
   * @param args Parameters
   */
  execute(args: InferZodParams<TParams>): Promise<{
    content: {
      type: "text";
      text: string;
      [key: string]: unknown;
    }[];
    isError?: boolean;
    [key: string]: unknown;
  }>;
}

// Re-export types from AWS SDK
export type { Bucket, GetObjectCommandOutput, _Object, S3ServiceException };
