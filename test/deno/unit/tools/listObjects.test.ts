// Deno native test for ListObjectsTool
import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ListObjectsTool } from "../../../../src/tools/listObjects.ts";
import type { _Object } from "../../../../src/types.ts";

// Simple mock for S3Resource with listObjects functionality
function createMockS3Resource() {
  let mockObjects: _Object[] = [];
  let mockError: Error | null = null;

  // Create a spy to track calls
  const listObjectsSpy = {
    calls: [] as Array<[string, string, number?]>,
    callCount: 0,
  };

  return {
    // The actual mocked object
    resource: {
      listObjects: async (bucket: string, prefix = "", maxKeys = 1000): Promise<_Object[]> => {
        // Track call
        listObjectsSpy.calls.push([bucket, prefix, maxKeys]);
        listObjectsSpy.callCount++;

        // Handle error case
        if (mockError) {
          throw mockError;
        }

        // Filter by prefix if provided
        const filteredObjects = prefix
          ? mockObjects.filter((obj) => obj.Key?.startsWith(prefix))
          : mockObjects;

        // Return mock data (limited by maxKeys)
        return filteredObjects.slice(0, maxKeys);
      },
    },

    // Test controls
    setMockObjects: (objects: _Object[]) => {
      mockObjects = objects;
    },

    setMockError: (error: Error) => {
      mockError = error;
    },

    // Access to spy
    spy: listObjectsSpy,
  };
}

// Helper to create mock objects
function createMockObjects(count = 5, prefix = "test-"): _Object[] {
  return Array.from({ length: count }).map((_, index) => ({
    Key: `${prefix}file-${index + 1}.txt`,
    LastModified: new Date(),
    Size: 1024 * (index + 1),
    StorageClass: "STANDARD",
  }));
}

// Test proper name and description
Deno.test("ListObjectsTool should have the correct name and description", () => {
  const mockS3 = createMockS3Resource();
  const listObjectsTool = new ListObjectsTool(mockS3.resource as any);

  assertEquals(listObjectsTool.name, "list-objects");
  assertEquals(listObjectsTool.description, "List objects in an S3 bucket");
  assertEquals(typeof listObjectsTool.parameters.bucket, "object");
  assertEquals(typeof listObjectsTool.parameters.prefix, "object");
  assertEquals(typeof listObjectsTool.parameters.maxKeys, "object");
});

// Test successful object listing
Deno.test("ListObjectsTool should return objects when successful", async () => {
  const mockS3 = createMockS3Resource();
  const listObjectsTool = new ListObjectsTool(mockS3.resource as any);

  // Set up mock data
  const mockObjects = createMockObjects(5);
  mockS3.setMockObjects(mockObjects);

  // Execute the method being tested
  const result = await listObjectsTool.execute({
    bucket: "test-bucket-1",
    prefix: undefined,
    maxKeys: undefined,
  });

  // Assertions
  assertEquals(mockS3.spy.callCount, 1);
  assertEquals(mockS3.spy.calls[0][0], "test-bucket-1"); // bucket name
  assertEquals(mockS3.spy.calls[0][1], ""); // empty prefix

  assertEquals(result.content[0].type, "text");

  // Parse result to verify contents
  const parsedResult = JSON.parse(result.content[0].text);
  assertEquals(parsedResult.length, mockObjects.length);
  assertEquals(parsedResult[0].Key, mockObjects[0].Key);

  // Success responses don't have isError property
  assertEquals("isError" in result ? result.isError : undefined, undefined);
});

// Test filtering by prefix
Deno.test("ListObjectsTool should filter objects by prefix", async () => {
  const mockS3 = createMockS3Resource();
  const listObjectsTool = new ListObjectsTool(mockS3.resource as any);

  // Create mixed objects with different prefixes
  const objects = [...createMockObjects(3, "folder1/"), ...createMockObjects(2, "folder2/")];
  mockS3.setMockObjects(objects);

  // Execute with a prefix filter
  const result = await listObjectsTool.execute({
    bucket: "test-bucket-1",
    prefix: "folder1/",
    maxKeys: undefined,
  });

  // Verify the correct prefix was passed to listObjects
  assertEquals(mockS3.spy.calls[0][1], "folder1/");

  // Parse result to verify filtered contents
  const parsedResult = JSON.parse(result.content[0].text);

  // We should only get objects with the folder1/ prefix
  assertEquals(parsedResult.length, 3);

  // All returned objects should have the requested prefix
  for (const obj of parsedResult) {
    assertEquals(obj.Key.startsWith("folder1/"), true);
  }
});

// Test error handling
Deno.test("ListObjectsTool should handle errors correctly", async () => {
  const mockS3 = createMockS3Resource();
  const listObjectsTool = new ListObjectsTool(mockS3.resource as any);

  // Set up mock error
  const errorMessage = "Access denied";
  mockS3.setMockError(new Error(errorMessage));

  // Execute the method being tested
  const result = await listObjectsTool.execute({
    bucket: "test-bucket-1",
    prefix: undefined,
    maxKeys: undefined,
  });

  // Assertions
  assertEquals(mockS3.spy.callCount, 1);
  assertEquals(result.content[0].type, "text");
  assertStringIncludes(result.content[0].text, "Error");
  assertStringIncludes(result.content[0].text, errorMessage);

  // Error responses should have isError: true
  assertEquals("isError" in result && result.isError, true);
});
