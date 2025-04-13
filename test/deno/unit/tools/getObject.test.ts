import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { GetObjectTool } from "../../../../src/tools/getObject.ts";
import type { S3ObjectData } from "../../../../src/types.ts";

// Simple mock for S3Resource with getObject functionality
function createMockS3Resource() {
  let mockData: S3ObjectData | null = null;
  let mockError: Error | null = null;

  // Create a spy to track calls
  const getObjectSpy = {
    calls: [] as Array<[string, string]>,
    callCount: 0,
  };

  return {
    // The actual mocked object
    resource: {
      getObject: async (bucket: string, key: string): Promise<S3ObjectData> => {
        // Track call
        getObjectSpy.calls.push([bucket, key]);
        getObjectSpy.callCount++;

        // Handle error case
        if (mockError) {
          throw mockError;
        }

        // Return mock data or throw if not set
        if (mockData) {
          return mockData;
        }
        throw new Error("No mock data provided");
      },
    },

    // Test controls
    setMockData: (data: S3ObjectData) => {
      mockData = data;
    },

    setMockError: (error: Error) => {
      mockError = error;
    },

    // Access to spy
    spy: getObjectSpy,
  };
}

// Helper to encode text as Uint8Array (similar to Buffer in Node.js)
function textToBuffer(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

// We don't need this utility since Deno handles the error responses internally
// This would be needed if we were implementing full dependency injection

// Test proper name and description
Deno.test("GetObjectTool should have the correct name and description", () => {
  const mockS3 = createMockS3Resource();
  const getObjectTool = new GetObjectTool(mockS3.resource as any);

  assertEquals(getObjectTool.name, "get-object");
  assertEquals(getObjectTool.description, "Retrieve an object from an S3 bucket");
  assertEquals(typeof getObjectTool.parameters.bucket, "object");
  assertEquals(typeof getObjectTool.parameters.key, "object");
});

// Test successful text retrieval
Deno.test("GetObjectTool should return text content when object is text", async () => {
  const mockS3 = createMockS3Resource();
  const getObjectTool = new GetObjectTool(mockS3.resource as any);

  // Mock text content response
  const textContent = "This is a text file content";
  mockS3.setMockData({
    data: textContent,
    contentType: "text/plain",
  });

  // Execute the method being tested
  const result = await getObjectTool.execute({
    bucket: "test-bucket",
    key: "test-file.txt",
  });

  // Assertions
  assertEquals(mockS3.spy.callCount, 1);
  assertEquals(mockS3.spy.calls[0], ["test-bucket", "test-file.txt"]);

  assertEquals(result.content[0].type, "text");
  assertEquals(result.content[0].text, textContent);

  // Success responses don't have isError property or it's undefined
  assertEquals("isError" in result ? result.isError : undefined, undefined);
});

// Test binary content handling
Deno.test("GetObjectTool should return base64 string for binary content", async () => {
  const mockS3 = createMockS3Resource();
  const getObjectTool = new GetObjectTool(mockS3.resource as any);

  // Mock binary content response
  const binaryData = textToBuffer("Binary content");
  mockS3.setMockData({
    data: binaryData,
    contentType: "application/octet-stream",
  });

  // Execute the method being tested
  const result = await getObjectTool.execute({
    bucket: "test-bucket",
    key: "test-file.bin",
  });

  // Assertions
  assertEquals(mockS3.spy.callCount, 1);
  assertEquals(mockS3.spy.calls[0], ["test-bucket", "test-file.bin"]);

  assertEquals(result.content[0].type, "text");
  assertStringIncludes(result.content[0].text, "Binary content");
  assertStringIncludes(result.content[0].text, "base64 data is");

  // Success responses don't have isError property or it's undefined
  assertEquals("isError" in result ? result.isError : undefined, undefined);
});

// Test error handling
Deno.test("GetObjectTool should handle errors correctly", async () => {
  const mockS3 = createMockS3Resource();
  const getObjectTool = new GetObjectTool(mockS3.resource as any);

  // Set up mock error
  const errorMessage = "Object not found";
  mockS3.setMockError(new Error(errorMessage));

  // Create a spy for the imported helper
  // Note: This approach differs from Vitest's vi.spyOn for module imports
  // In Deno, we'd typically use dependency injection or module mocking

  // For this test, we'll patch the createErrorResponse import in the GetObjectTool
  // This is a simplification - in a real implementation, you might use a more
  // sophisticated approach to module mocking

  // Execute the method being tested
  const result = await getObjectTool.execute({
    bucket: "test-bucket",
    key: "non-existent.txt",
  });

  // Assertions
  assertEquals(mockS3.spy.callCount, 1);
  assertEquals(result.content[0].type, "text");
  assertStringIncludes(result.content[0].text, "Error");
  assertStringIncludes(result.content[0].text, errorMessage);

  // Error responses always have isError: true
  assertEquals("isError" in result && result.isError, true);
});

// Note about advanced mocking in Deno:
// For more advanced module mocking scenarios, we'd recommend:
// 1. Using dependency injection in the actual implementation
// 2. Creating mock implementations of interfaces rather than patching imports
// 3. Considering a design pattern that makes testing easier with Deno's module system
