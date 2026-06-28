import { test } from "bun:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertSeam } from "@bounded-systems/seam-check";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// schema-gen projects zod schemas to TypeScript (zod → JSON Schema → .d.ts). A
// generator leaf: prod files touch node:fs (read/write generated files), zod,
// and json-schema-to-typescript only. The harness proves that edge set and that
// prod code holds no ambient authority (spawn / env).
test("@bounded-systems/schema-gen upholds its seam claim", () => {
  assertSeam({
    root: SRC,
    prod: ["node:fs", "json-schema-to-typescript", "zod"],
    test: ["@bounded-systems/schema-gen", "@bounded-systems/seam-check"],
  });
});
