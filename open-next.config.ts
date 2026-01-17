import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // incrementalCache: r2IncrementalCache, // R2 caching not available in this version
});