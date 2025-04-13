// Test to verify our test utilities are working
import { describe, expect, it, mockFn, resetHooks } from "./_test_utils.ts";

// Simple test using our custom utilities
describe("Test Utilities", () => {
  resetHooks();

  it("mockFn should work correctly", () => {
    const mock = mockFn();
    mock("test");

    console.log("Mock calls:", mock.mock.calls);

    // Test assertion
    expect.toBe(mock.mock.calls.length, 1);
    expect.toBe(mock.mock.calls[0][0], "test");
  });

  it("mockFn.mockResolvedValue should work", async () => {
    const mock = mockFn();
    mock.mockResolvedValue("result");

    const result = await mock();
    console.log("Mock result:", result);

    expect.toBe(result, "result");
  });
});

console.log("Test file loaded and describe function executed");
