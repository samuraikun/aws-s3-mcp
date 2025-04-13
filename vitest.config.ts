import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    exclude: ["test/deno/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "test/deno/"],
    },
    // environmentOptions: {
    //   // MinIO
    //   env: {
    //     AWS_ENDPOINT: 'http://localhost:9000',
    //     AWS_REGION: 'us-east-1',
    //     AWS_ACCESS_KEY_ID: 'minioadmin',
    //     AWS_SECRET_ACCESS_KEY: 'minioadmin',
    //     AWS_S3_FORCE_PATH_STYLE: 'true',
    //     S3_BUCKETS: 'test-bucket-1,test-bucket-2',
    //   },
    // },
    setupFiles: ["./test/setup-deno-mock.js", "./test/setup.ts"],
  },
});
