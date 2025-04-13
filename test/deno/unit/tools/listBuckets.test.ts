import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ListBucketsTool } from "../../../../src/tools/listBuckets.ts";

// Simple mock for S3Resource
function createMockS3Resource() {
  let mockBuckets: any[] = [];
  let mockError: Error | null = null;

  return {
    // The actual mocked object
    resource: {
      listBuckets: async () => {
        if (mockError) {
          throw mockError;
        }
        return mockBuckets;
      },
    },

    // Mock controls
    setMockBuckets: (buckets: any[]) => {
      mockBuckets = buckets;
    },

    setMockError: (error: Error | null) => {
      mockError = error;
    },
  };
}

// Helper to create mock bucket data
function createMockBuckets(count = 3) {
  return Array.from({ length: count }).map((_, i) => ({
    Name: `test-bucket-${i + 1}`,
    CreationDate: new Date(),
  }));
}

// Test proper name and description
Deno.test("ListBucketsTool should have the correct name and description", () => {
  const mockS3 = createMockS3Resource();
  const listBucketsTool = new ListBucketsTool(mockS3.resource as any);

  assertEquals(listBucketsTool.name, "list-buckets");
  assertEquals(listBucketsTool.description, "List available S3 buckets");
  assertEquals(listBucketsTool.parameters, {});
});

// Test successful bucket listing
Deno.test("ListBucketsTool should return buckets when successful", async () => {
  const mockS3 = createMockS3Resource();
  const listBucketsTool = new ListBucketsTool(mockS3.resource as any);

  // Set up mock data
  const mockBuckets = createMockBuckets(3);
  mockS3.setMockBuckets(mockBuckets);

  // Execute the method being tested
  const result = await listBucketsTool.execute({});

  // Assertions
  assertEquals(result.content[0].type, "text");

  // When comparing JSON parsed data, dates are converted to strings
  const parsedResult = JSON.parse(result.content[0].text);
  assertEquals(parsedResult.length, mockBuckets.length);

  for (let i = 0; i < mockBuckets.length; i++) {
    assertEquals(parsedResult[i].Name, mockBuckets[i].Name);
    // Only check that the date exists
    assertExists(parsedResult[i].CreationDate);
  }

  // Success responses don't have isError property or it's undefined
  assertEquals("isError" in result ? result.isError : undefined, undefined);
});

// Test error handling
Deno.test("ListBucketsTool should handle errors correctly", async () => {
  const mockS3 = createMockS3Resource();
  const listBucketsTool = new ListBucketsTool(mockS3.resource as any);

  // Set up mock error
  const errorMessage = "Network error";
  mockS3.setMockError(new Error(errorMessage));

  // Execute the method being tested
  const result = await listBucketsTool.execute({});

  // Assertions
  assertEquals(result.content[0].type, "text");
  assert(result.content[0].text.includes("Error"));
  assert(result.content[0].text.includes(errorMessage));
  assertEquals("isError" in result && result.isError, true);
});

// Helper function for string inclusion assertions
function assert(condition: boolean, message = "Assertion failed") {
  if (!condition) {
    throw new Error(message);
  }
}
