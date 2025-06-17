import { Readable } from "node:stream";
import type { Bucket, S3ClientConfig, _Object } from "@aws-sdk/client-s3";
import {
  GetObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import pdfParse from "pdf-parse";
import { P, match } from "ts-pattern";
import type { S3ObjectData } from "../types";

export class S3Resource {
  private client: S3Client;
  private maxBuckets: number;
  private configuredBuckets: string[];

  constructor(region = "us-east-1", maxBuckets?: number) {
    // S3 client configuration options
    const clientOptions: S3ClientConfig = {
      region: process.env.AWS_REGION || region,
    };

    // Custom endpoint configuration for MinIO
    if (process.env.AWS_ENDPOINT) {
      clientOptions.endpoint = process.env.AWS_ENDPOINT;
    }

    // Path style URL setting (required for MinIO)
    if (process.env.AWS_S3_FORCE_PATH_STYLE === "true") {
      clientOptions.forcePathStyle = true;
    }

    this.client = new S3Client(clientOptions);

    // Get maxBuckets from environment variable if not explicitly provided
    if (maxBuckets !== undefined) {
      this.maxBuckets = maxBuckets;
    } else {
      const envMaxBuckets = process.env.S3_MAX_BUCKETS;
      this.maxBuckets = envMaxBuckets ? Number.parseInt(envMaxBuckets, 10) : 5;
    }

    this.configuredBuckets = this.getConfiguredBuckets();
  }

  private getConfiguredBuckets(): string[] {
    // Get bucket information from environment variables
    const bucketsEnv = process.env.S3_BUCKETS || "";
    return bucketsEnv.split(",").filter((bucket) => bucket.trim() !== "");
  }

  private logError(message: string, error: unknown): void {
    // Skip logging in test environments or when NODE_ENV is test
    if (process.env.NODE_ENV === "test" || process.env.VITEST) {
      return;
    }
    console.error(message, error);
  }

  // List all buckets or filtered buckets based on configuration
  async listBuckets(): Promise<Bucket[]> {
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

      // Check if response body is a readable stream
      if (!(response.Body instanceof Readable)) {
        throw new Error("Unexpected response body type");
      }

      // Handle the response body as a stream
      const chunks: Buffer[] = [];
      for await (const chunk of response.Body) {
        chunks.push(Buffer.from(chunk));
      }
      const data = Buffer.concat(chunks);

      // Use pattern matching to determine file type and return appropriate data
      return match({
        isText: this.isTextFile(key, contentType),
        isPdf: this.isPdfFile(key, contentType),
      })
        .with({ isText: true }, async () => ({
          data: data.toString("utf-8"),
          contentType,
        }))
        .with({ isPdf: true }, async () => ({
          data: await this.convertPdfToText(data),
          contentType,
        }))
        .otherwise(() => ({
          data,
          contentType,
        }));
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
  async convertPdfToText(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      this.logError("Error converting PDF to text:", error);
      return "Error: Could not extract text from PDF file.";
    }
  }
}
