import {
  GetObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import pdfParse from "pdf-parse";
import { P, match } from "ts-pattern";
import type { S3ObjectData, _Object } from "../types.ts";

export class S3Resource {
  private client: S3Client;
  private maxBuckets: number;
  private configuredBuckets: string[];

  constructor(region = "us-east-1", maxBuckets?: number) {
    // S3 client configuration options
    const clientOptions: {
      region: string;
      credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
      };
      endpoint?: string;
      forcePathStyle?: boolean;
    } = {
      region: Deno.env.get("AWS_REGION") || region,
    };

    // Set credentials if provided in environment variables
    if (Deno.env.get("AWS_ACCESS_KEY_ID") && Deno.env.get("AWS_SECRET_ACCESS_KEY")) {
      clientOptions.credentials = {
        accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || "",
        secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
      };
    }

    // Custom endpoint configuration for MinIO
    if (Deno.env.get("AWS_ENDPOINT")) {
      clientOptions.endpoint = Deno.env.get("AWS_ENDPOINT");
    }

    // Path style URL setting (required for MinIO)
    if (Deno.env.get("AWS_S3_FORCE_PATH_STYLE") === "true") {
      clientOptions.forcePathStyle = true;
    }

    this.client = new S3Client(clientOptions);

    // Get maxBuckets from environment variable if not explicitly provided
    if (maxBuckets !== undefined) {
      this.maxBuckets = maxBuckets;
    } else {
      const envMaxBuckets = Deno.env.get("S3_MAX_BUCKETS");
      this.maxBuckets = envMaxBuckets ? Number.parseInt(envMaxBuckets, 10) : 5;
    }

    this.configuredBuckets = this.getConfiguredBuckets();
  }

  private getConfiguredBuckets(): string[] {
    // Get bucket information from environment variables
    const bucketsEnv = Deno.env.get("S3_BUCKETS") || "";
    return bucketsEnv.split(",").filter((bucket: string) => bucket.trim() !== "");
  }

  private logError(message: string, error: unknown): void {
    // Skip logging in test environments
    if (Deno.env.get("DENO_ENV") === "test") {
      return;
    }
    console.error(message, error);
  }

  // List all buckets or filtered buckets based on configuration
  async listBuckets() {
    try {
      const command = new ListBucketsCommand({});
      const response = await this.client.send(command);

      const buckets = response.Buckets || [];

      // Use pattern matching to filter buckets
      return match({ buckets, hasConfiguredBuckets: this.configuredBuckets.length > 0 })
        .with({ hasConfiguredBuckets: true }, ({ buckets }) =>
          buckets
            .filter((bucket) => bucket.Name && this.configuredBuckets.includes(bucket.Name))
            .slice(0, this.maxBuckets),
        )
        .otherwise(({ buckets }) => buckets.slice(0, this.maxBuckets));
    } catch (error) {
      this.logError("Error listing buckets:", error);
      throw error;
    }
  }

  // List objects in a bucket
  async listObjects(bucketName: string, prefix = "", maxKeys = 1000): Promise<_Object[]> {
    try {
      // Use pattern matching to check bucket accessibility
      await match({
        hasConfiguredBuckets: this.configuredBuckets.length > 0,
        isAllowed: this.configuredBuckets.includes(bucketName),
      })
        .with({ hasConfiguredBuckets: true, isAllowed: false }, () => {
          throw new Error(`Bucket ${bucketName} is not in the allowed buckets list`);
        })
        .otherwise(() => Promise.resolve());

      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.client.send(command);
      return response.Contents || [];
    } catch (error) {
      this.logError(`Error listing objects in bucket ${bucketName}:`, error);
      throw error;
    }
  }

  // Get a specific object from a bucket
  async getObject(bucketName: string, key: string): Promise<S3ObjectData> {
    try {
      // Use pattern matching to check bucket accessibility
      await match({
        hasConfiguredBuckets: this.configuredBuckets.length > 0,
        isAllowed: this.configuredBuckets.includes(bucketName),
      })
        .with({ hasConfiguredBuckets: true, isAllowed: false }, () => {
          throw new Error(`Bucket ${bucketName} is not in the allowed buckets list`);
        })
        .otherwise(() => Promise.resolve());

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      const contentType = response.ContentType || "application/octet-stream";

      // Handle the response body based on environment (Node.js vs Deno)
      let bodyContents: Uint8Array;

      if (response.Body?.transformToByteArray) {
        // Deno environment
        bodyContents = await response.Body.transformToByteArray();
      } else if (response.Body && this.isNodeJsReadableStream(response.Body)) {
        // Node.js environment (stream)
        bodyContents = await this.streamToBuffer(response.Body as any);
      } else {
        throw new Error("Unexpected response body type");
      }

      if (!bodyContents) {
        throw new Error("Empty response body");
      }

      // Use pattern matching to determine file type and return appropriate data
      return match({
        isText: this.isTextFile(key, contentType),
        isPdf: this.isPdfFile(key, contentType),
      })
        .with({ isText: true }, async () => ({
          data: new TextDecoder().decode(bodyContents),
          contentType,
        }))
        .with({ isPdf: true }, async () => ({
          data: await this.convertPdfToText(bodyContents),
          contentType,
        }))
        .otherwise(() => {
          // For binary data, convert to Buffer if we're in Node.js environment
          const isNodeEnvironment =
            typeof process !== "undefined" && process.versions && process.versions.node;

          // Use Buffer only in Node.js environment
          const data = isNodeEnvironment
            ? // @ts-ignore: Node.js Buffer
              Buffer.from(bodyContents)
            : bodyContents;

          return {
            data,
            contentType,
          };
        });
    } catch (error) {
      this.logError(`Error getting object ${key} from bucket ${bucketName}:`, error);
      throw error;
    }
  }

  // Check if a file is a text file based on extension and content type
  isTextFile(key: string, contentType?: string): boolean {
    // Use pattern matching to determine if file is text
    return match({ key: key.toLowerCase(), contentType: contentType || "" })
      .with(
        {
          contentType: P.when(
            (type) =>
              type.startsWith("text/") ||
              type === "application/json" ||
              type === "application/xml" ||
              type === "application/javascript",
          ),
        },
        () => true,
      )
      .with(
        {
          key: P.when((k) =>
            [
              ".txt",
              ".json",
              ".xml",
              ".html",
              ".htm",
              ".css",
              ".js",
              ".ts",
              ".md",
              ".csv",
              ".yml",
              ".yaml",
              ".log",
              ".sh",
              ".bash",
              ".py",
              ".rb",
              ".java",
              ".c",
              ".cpp",
              ".h",
              ".cs",
              ".php",
            ].some((ext) => k.endsWith(ext)),
          ),
        },
        () => true,
      )
      .otherwise(() => false);
  }

  // Check if a file is a PDF file
  isPdfFile(key: string, contentType?: string): boolean {
    // Use pattern matching to determine if file is PDF
    return match({ key: key.toLowerCase(), contentType: contentType || "" })
      .with({ contentType: "application/pdf" }, () => true)
      .with({ key: P.when((k) => k.endsWith(".pdf")) }, () => true)
      .otherwise(() => false);
  }

  // Convert PDF buffer to text
  async convertPdfToText(buffer: Uint8Array): Promise<string> {
    try {
      // @ts-ignore: pdf-parse types are not fully compatible with Deno
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      this.logError("Error converting PDF to text:", error);
      return "Error: Could not extract text from PDF file.";
    }
  }

  // Helper method to check if an object is a Node.js Readable stream
  private isNodeJsReadableStream(obj: unknown): boolean {
    return (
      obj !== null &&
      typeof obj === "object" &&
      // Check for common stream properties

      // @ts-ignore: Node.js stream specific properties
      (typeof obj.pipe === "function" ||
        // @ts-ignore: Node.js stream specific properties
        typeof obj.on === "function" ||
        // @ts-ignore: Node.js stream specific properties
        typeof obj.read === "function")
    );
  }

  // Helper method to convert a Node.js stream to a buffer
  private async streamToBuffer(stream: any): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const chunks: Array<Uint8Array> = [];

      // @ts-ignore: Node.js stream methods
      stream.on("data", (chunk: Uint8Array) => {
        chunks.push(chunk);
      });

      // @ts-ignore: Node.js stream methods
      stream.on("error", (err: Error) => {
        reject(err);
      });

      // @ts-ignore: Node.js stream methods
      stream.on("end", () => {
        // Combine chunks into a single Uint8Array
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);

        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }

        resolve(result);
      });
    });
  }
}
