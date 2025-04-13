// S3 client mocks for Deno tests
import { mockFn } from "../_test_utils.ts";

// Helper to create mock bucket data
export function createMockBuckets(count = 3) {
  return Array.from({ length: count }).map((_, i) => ({
    Name: `test-bucket-${i + 1}`,
    CreationDate: new Date(),
  }));
}

// Helper to create mock objects data
export function createMockObjects(count = 5) {
  return Array.from({ length: count }).map((_, i) => ({
    Key: `test-file-${i + 1}.txt`,
    Size: 1024 * (i + 1),
    LastModified: new Date(),
    ETag: `"mock-etag-${i + 1}"`,
    StorageClass: "STANDARD",
  }));
}

// Mock Readable stream for Deno
export class MockReadable {
  private data: Uint8Array;
  private position = 0;

  constructor(data: string | Uint8Array) {
    if (typeof data === "string") {
      this.data = new TextEncoder().encode(data);
    } else {
      this.data = data;
    }
  }

  async *[Symbol.asyncIterator]() {
    yield this.data;
  }

  // Mock method to convert to string
  async text() {
    return new TextDecoder().decode(this.data);
  }

  // Mock method for blob conversion
  async arrayBuffer() {
    return this.data.buffer;
  }
}

// Create mock S3Client for Deno tests
export function createMockS3Client() {
  const mockSend = mockFn();

  return {
    client: {
      send: mockSend,
    },
    mockSend,
  };
}

// Helper to set up mock responses for common S3 operations
export function setupMockS3Responses(mockSend: ReturnType<typeof mockFn>) {
  // Clear any existing mock implementations
  mockSend.mockReset();

  // Helper for setting up custom responses
  const setupResponses = {
    // Mock successful list buckets response
    listBuckets: (buckets = createMockBuckets(3)) => {
      mockSend.mockImplementation((command: any) => {
        if (command.constructor.name === "ListBucketsCommand") {
          return Promise.resolve({ Buckets: buckets });
        }
        return undefined;
      });
      return setupResponses;
    },

    // Mock successful list objects response
    listObjects: (objects = createMockObjects(5)) => {
      mockSend.mockImplementation((command: any) => {
        if (command.constructor.name === "ListObjectsV2Command") {
          return Promise.resolve({ Contents: objects });
        }
        return undefined;
      });
      return setupResponses;
    },

    // Mock successful get object response for text
    getTextObject: (content = "Mock text content") => {
      mockSend.mockImplementation((command: any) => {
        if (command.constructor.name === "GetObjectCommand") {
          return Promise.resolve({
            ContentType: "text/plain",
            Body: new MockReadable(content),
          });
        }
        return undefined;
      });
      return setupResponses;
    },

    // Mock successful get object response for binary
    getBinaryObject: (content = new Uint8Array([0x01, 0x02, 0x03, 0x04])) => {
      mockSend.mockImplementation((command: any) => {
        if (command.constructor.name === "GetObjectCommand") {
          return Promise.resolve({
            ContentType: "application/octet-stream",
            Body: new MockReadable(content),
          });
        }
        return undefined;
      });
      return setupResponses;
    },

    // Mock successful get object response for PDF
    getPdfObject: (content = new Uint8Array([0x25, 0x50, 0x44, 0x46])) => {
      // %PDF header
      mockSend.mockImplementation((command: any) => {
        if (command.constructor.name === "GetObjectCommand") {
          return Promise.resolve({
            ContentType: "application/pdf",
            Body: new MockReadable(content),
          });
        }
        return undefined;
      });
      return setupResponses;
    },

    // Mock error response
    error: (errorMessage = "Mock S3 Error") => {
      mockSend.mockImplementation(() => {
        return Promise.reject(new Error(errorMessage));
      });
      return setupResponses;
    },
  };

  return setupResponses;
}
