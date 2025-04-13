// Mock Deno namespace for Vitest environment
// This file is used to emulate Deno APIs in a Node.js environment

// Create a global Deno object if it doesn't exist
if (typeof global.Deno === "undefined") {
  global.Deno = {};
}

// Mock Deno.env functionality
global.Deno.env = {
  get: (key) => process.env[key],
  set: (key, value) => {
    process.env[key] = value;
  },
  delete: (key) => {
    delete process.env[key];
  },
  toObject: () => ({ ...process.env }),
};

// Mock other Deno APIs as needed
// For example, if you need to mock Deno.readTextFile or other functions

console.log("✅ Deno mock environment initialized for Vitest");
