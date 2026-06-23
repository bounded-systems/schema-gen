import { expect, test } from "bun:test";
import { z } from "zod";

import { genSchemaTypes } from "./index.ts";

test("projects a zod schema to an explicit, documented, fast-types-clean type", async () => {
  const schema = z
    .object({
      id: z.string().describe("The id."),
      count: z.number().optional().describe("Optional count."),
    })
    .describe("A thing.");

  const { content } = await genSchemaTypes([[schema, "Thing"]], "/tmp/__schema_gen_smoke.ts");

  expect(content).toContain("export interface Thing");
  expect(content).toContain("The id."); // field .describe() → member JSDoc
  expect(content).toContain("A thing."); // object .describe() → interface JSDoc
  expect(content).toContain("count?: number | undefined;"); // exactOptionalPropertyTypes parity
  expect(content).not.toContain("ZodType"); // no zod type leaks into the public API
});

test("check mode reports drift without writing", async () => {
  const schema = z.object({ a: z.string() });
  const res = await genSchemaTypes([[schema, "A"]], "/tmp/__schema_gen_missing.ts", { check: true });
  expect(res.drift).toBe(true);
});
