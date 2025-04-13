// Deno native test for S3 functionality
import { assertEquals, assertExists } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { S3Client } from "https://deno.land/x/aws_sdk@v3.32.0-1/client-s3/mod.ts";
import {
  ListBucketsCommand,
  ListObjectsV2Command,
} from "https://deno.land/x/aws_sdk@v3.32.0-1/client-s3/mod.ts";

// Skip these tests if AWS credentials are not available
const hasAwsCredentials =
  Deno.env.get("AWS_ACCESS_KEY_ID") && Deno.env.get("AWS_SECRET_ACCESS_KEY");

// Test bucket configuration
const testBucket = Deno.env.get("TEST_BUCKET") || "";

Deno.test({
  name: "S3 client initialization",
  fn: async () => {
    const s3Client = new S3Client({
      region: Deno.env.get("AWS_REGION") || "us-east-1",
      credentials: {
        accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || "",
        secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
      },
    });

    assertExists(s3Client);

    // Properly clean up resources
    s3Client.destroy();
  },
});

// Only run these tests if we have credentials
if (hasAwsCredentials) {
  Deno.test({
    name: "List S3 buckets",
    fn: async () => {
      const s3Client = new S3Client({
        region: Deno.env.get("AWS_REGION") || "us-east-1",
        credentials: {
          accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || "",
          secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
        },
      });

      try {
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);

        assertExists(response.Buckets);
        console.log(`Found ${response.Buckets?.length} buckets`);
      } finally {
        // Clean up resources
        s3Client.destroy();
      }
    },
  });

  // Only run object tests if we have a test bucket
  if (testBucket) {
    Deno.test({
      name: "List objects in a bucket",
      fn: async () => {
        const s3Client = new S3Client({
          region: Deno.env.get("AWS_REGION") || "us-east-1",
          credentials: {
            accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || "",
            secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
          },
        });

        try {
          const command = new ListObjectsV2Command({
            Bucket: testBucket,
            MaxKeys: 10,
          });

          const response = await s3Client.send(command);

          assertExists(response.Contents);
          console.log(`Found ${response.Contents?.length} objects in bucket ${testBucket}`);
        } finally {
          // Clean up resources
          s3Client.destroy();
        }
      },
    });
  }
} else {
  console.log("Skipping AWS S3 tests: No credentials found");
}

// Always run mock tests
Deno.test({
  name: "Mock S3 functionality",
  fn: async () => {
    // Create a mock implementation
    const mockS3Client = {
      send: async (command: any) => {
        if (command instanceof ListBucketsCommand) {
          return {
            Buckets: [
              { Name: "test-bucket-1", CreationDate: new Date() },
              { Name: "test-bucket-2", CreationDate: new Date() },
            ],
          };
        }

        if (command instanceof ListObjectsV2Command) {
          return {
            Contents: [
              { Key: "test-file-1.txt", Size: 1024, LastModified: new Date() },
              { Key: "test-file-2.jpg", Size: 2048, LastModified: new Date() },
            ],
          };
        }

        throw new Error("Unexpected command");
      },
    };

    // Test with mock client
    const response = await mockS3Client.send(new ListBucketsCommand({}));
    // Ensure Buckets exist before testing
    assertExists(response.Buckets);
    assertEquals(response.Buckets.length, 2);
    assertEquals(response.Buckets[0].Name, "test-bucket-1");

    const objectsResponse = await mockS3Client.send(
      new ListObjectsV2Command({ Bucket: "test-bucket-1" }),
    );
    // Ensure Contents exist before testing
    assertExists(objectsResponse.Contents);
    assertEquals(objectsResponse.Contents.length, 2);
    assertEquals(objectsResponse.Contents[0].Key, "test-file-1.txt");
  },
});
