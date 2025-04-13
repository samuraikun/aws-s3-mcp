// Deno testing utilities to replace Vitest functionality

import {
  assertEquals,
  assertInstanceOf,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

// Mock function implementation similar to Vitest's vi.fn()
export function mockFn() {
  const calls: unknown[][] = [];
  const mockFunction = (...args: unknown[]) => {
    calls.push(args);
    return mockFunction.returnValue;
  };

  // Add mock functionality
  mockFunction.mock = {
    calls,
    instances: [],
    results: [],
    lastCall: undefined as unknown[] | undefined,
  };

  // Implementation helpers
  mockFunction.mockImplementation = (implementation: (...args: unknown[]) => unknown) => {
    const originalMockFn = mockFunction;
    const newMockFn = (...args: unknown[]) => {
      calls.push(args);
      mockFunction.mock.lastCall = args;
      return implementation(...args);
    };

    // Copy over mock properties
    Object.assign(newMockFn, originalMockFn);
    newMockFn.mock = originalMockFn.mock;

    return newMockFn;
  };

  // Fix: Store resolved/rejected values in the mock object for direct access
  mockFunction.mockResolvedValue = (value: unknown) => {
    console.log("Setting mockResolvedValue:", value);
    const impl = () => {
      console.log("Mock function called, returning resolved value:", value);
      return Promise.resolve(value);
    };

    // Store the implementation and the actual value for debugging
    (mockFunction as any)._mockResolvedValue = value;

    return mockFunction.mockImplementation(impl);
  };

  mockFunction.mockRejectedValue = (error: unknown) => {
    console.log("Setting mockRejectedValue:", error);
    const impl = () => {
      console.log("Mock function called, returning rejected value:", error);
      return Promise.reject(error);
    };

    // Store the error for debugging
    (mockFunction as any)._mockRejectedValue = error;

    return mockFunction.mockImplementation(impl);
  };

  mockFunction.mockReturnValue = (value: unknown) => {
    // Cast to allow unknown type to be set
    (mockFunction as any).returnValue = value;
    return mockFunction;
  };

  mockFunction.mockReset = () => {
    calls.length = 0;
    mockFunction.mock.lastCall = undefined;
    mockFunction.returnValue = undefined;
    return mockFunction;
  };

  // Default return value
  mockFunction.returnValue = undefined;

  return mockFunction;
}

// Helper for spying on objects (similar to vi.spyOn)
export function spyOn(object: Record<string, unknown>, method: string) {
  const original = object[method] as (...args: unknown[]) => unknown;
  const mock = mockFn();

  // Default implementation calls the original method
  const spy = mock.mockImplementation((...args: unknown[]) => {
    return original.apply(object, args);
  });

  // Replace the original method with our spy
  object[method] = spy;

  // Add restore method to the spy object
  (spy as any).mockRestore = () => {
    object[method] = original;
  };

  return spy;
}

// Helper for managing environment variables in tests
export const envVars = {
  originals: {} as Record<string, string | undefined>,

  stub: (key: string, value: string) => {
    if (!(key in envVars.originals)) {
      envVars.originals[key] = Deno.env.get(key);
    }
    Deno.env.set(key, value);
  },

  unstubAll: () => {
    for (const [key, value] of Object.entries(envVars.originals)) {
      if (value === undefined) {
        Deno.env.delete(key);
      } else {
        Deno.env.set(key, value);
      }
    }
    envVars.originals = {};
  },
};

// Helper for assertion wrappers to match Vitest's expect API
export const expect = {
  // Basic matchers
  toBe: (actual: unknown, expected: unknown) => assertEquals(actual, expected),
  toEqual: (actual: unknown, expected: unknown) => assertEquals(actual, expected),
  toBeTruthy: (actual: unknown) => assertEquals(Boolean(actual), true),
  toBeFalsy: (actual: unknown) => assertEquals(Boolean(actual), false),

  // Type checks
  toBeInstanceOf: (actual: unknown, expected: new (...args: any[]) => any) =>
    assertInstanceOf(actual, expected),

  // Async matchers
  rejects: {
    toThrow: async (promiseFn: () => Promise<unknown>, errorMsg?: string) => {
      if (errorMsg) {
        await assertRejects(async () => await promiseFn(), Error, errorMsg);
      } else {
        await assertRejects(async () => await promiseFn());
      }
    },
  },
};

// Helpers to organize tests similar to Vitest
export function describe(name: string, fn: () => void) {
  console.log(`\n== ${name} ==`);
  fn();
}

// Simple beforeEach/afterEach implementation
let beforeEachFns: (() => void | Promise<void>)[] = [];
let afterEachFns: (() => void | Promise<void>)[] = [];

export function beforeEach(fn: () => void | Promise<void>) {
  beforeEachFns.push(fn);
}

export function afterEach(fn: () => void | Promise<void>) {
  afterEachFns.push(fn);
}

// Helper to run a test with the before/after hooks
export function it(name: string, fn: () => void | Promise<void>) {
  Deno.test({
    name,
    async fn() {
      // Run all beforeEach hooks
      for (const beforeFn of beforeEachFns) {
        await beforeFn();
      }

      try {
        // Run the test
        await fn();
      } finally {
        // Always run afterEach hooks
        for (const afterFn of afterEachFns) {
          await afterFn();
        }
      }
    },
  });
}

// Reset hooks for each describe block
export function resetHooks() {
  beforeEachFns = [];
  afterEachFns = [];
}
