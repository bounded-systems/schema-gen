# @bounded-systems/schema-gen

Project [zod](https://zod.dev) schemas to **explicit, fast-types-clean
TypeScript**, so a package can author its validation in zod without forfeiting
JSR [fast-types](https://jsr.io/docs/about-slow-types) (zod's inferred types are
too generic for JSR's fast analyzer — exporting one caps your package's score).

```
zod schema ──z.toJSONSchema──▶ JSON Schema ──json-schema-to-typescript──▶ explicit .ts
```

Keep the schema **internal**; generate the explicit public type; expose a
`parse()` boundary. No zod type reaches the public API. Each schema's
`.describe()` (field- and object-level) becomes JSDoc on the generated type — the
schema is the single source for validation, types, *and* docs.

## Usage

Author the schema (internal), with `.describe()`:

```ts
// src/schemas.ts  (not exported from your index)
import { z } from "zod";
export const userSchema = z
  .object({
    id: z.string().describe("Stable user id."),
    name: z.string().optional().describe("Display name."),
  })
  .describe("A user record.");
```

Add a generator script:

```ts
// scripts/gen-schema-types.ts
import { genSchemaTypes } from "@bounded-systems/schema-gen";
import { userSchema } from "../src/schemas.ts";

const out = new URL("../src/types.generated.ts", import.meta.url).pathname;
const { drift } = await genSchemaTypes([[userSchema, "User"]], out, {
  check: process.argv.includes("--check"),
});
if (process.argv.includes("--check") && drift) {
  console.error("::error::src/types.generated.ts is stale — run `bun run schema:gen`.");
  process.exit(1);
}
```

Wire it (and a CI drift gate):

```jsonc
// package.json
"scripts": {
  "schema:gen": "bun run scripts/gen-schema-types.ts",
  "schema:check": "bun run scripts/gen-schema-types.ts --check"
}
```

Then re-export the generated type + a parse boundary from your index:

```ts
export type { User } from "./types.generated.ts";
import { userSchema } from "./schemas.ts";
export const parseUser = (v: unknown): import("./types.generated.ts").User => userSchema.parse(v);
```

## API

### `genSchemaTypes(schemas, outPath, opts?)`

- `schemas: Array<[ZodType, string]>` — each schema paired with its public type name.
- `outPath: string` — where to write `types.generated.ts`.
- `opts.check?: boolean` — don't write; return `drift: true` if the file is stale.
- `opts.banner?: string` — override the generated-file banner.
- Returns `{ content, drift }`.

Requires **zod v4** (`z.toJSONSchema`). `zod` is a peer dependency.

> Note on `.brand()`: JSON Schema has no nominal-brand concept, so branded types
> round-trip as their structural base. Keep brand types hand-declared, or
> re-apply the brand after generation.

---

Part of [Bounded Systems](https://github.com/bounded-systems). MIT.
