# AGENTS.md

> Compact ramp-up guide for AI agents working in this repo.

## Language

All code, comments, commit messages, PR descriptions, and reviews are written in
**Korean** (한국어). See `.github/copilot-instructions.md`.

Repository documentation (`DESIGN.md`, `AGENTS.md`, `docs/*.md`) is written in
**English**.

---

## Product Model

Read this before designing anything. `DESIGN.md` is the full statement; this is
the part that constrains code.

SYNC is a knowledge-sharing platform, defined by two axes.

**Developers and technical teams are the first audience, not the boundary.**
Nothing in the two axes is specific to writing software. The rule this implies —
**neutral claims, specific examples** — is stated in full in `DESIGN.md`
§_Audience_, and it binds user-visible strings: claims (headings, feature copy,
empty states, FAQ) never narrow the product to developers, while examples (demo
content, placeholders) stay unmistakably technical. Do not add `개발자`-scoped
wording to a claim string without checking that section first.

### Post shapes — `PostType`

| Value | Analogue | Notes |
| --- | --- | --- |
| `SHORT` | Twitter / channel post | No title. Title is optional only for this type — `ValidPublishablePostValidator` enforces that. |
| `LONG` | Forum thread / blog post | Title required to publish. |
| `QUESTION` | Stack Overflow | Title required to publish. Has a resolution state. |

**Questions resolve through comments — there is no separate answer entity, and
one is not planned.** A `Comment` on a question _is_ an answer;
`Comment.isAccepted` marks the accepted one and `Post.resolved` reflects it. Any
Q&A feature request should be satisfied by strengthening comments, not by adding
a parallel object.

### Spaces — `Project`

Personal posts belong to no project (`PostScope.PUBLIC`); everything else lives
in a project (`PostScope.WORKSPACE`). **`PostScope` is derived, not stored** —
`Post.getScope()` returns `PostScope.fromProject(project)`. There is no `scope`
column and no CHECK constraint tying the two together, so the illegal state is
unrepresentable by construction. Don't reintroduce a stored scope.

A project has exactly one of three shapes:

| Space | Visibility | Join | Who can post | Analogue |
| --- | --- | --- | --- | --- |
| **Community** | Public | Open — anyone joins | Any member | Subreddit |
| **Showcase** | Public | By request — owner approves | Approved members | Public GitHub repo |
| **Team** | Private | Invite only; invisible outside | Members | Private Slack channel |

**All three modes are implemented.** Two axes on `Project`:

- `isPublic` — visibility.
- `joinPolicy` — `JoinPolicy{OPEN, REQUEST, INVITE}`, default `INVITE`.

`ProjectJoinService.joinProject` (gated on `PROJECT:READ`, so a private project
is unreachable to outsiders) switches on the policy: `OPEN` creates a `Teammate`
immediately, `REQUEST` creates a `ProjectJoinRequest` for an admin to approve or
decline, `INVITE` throws `ProjectJoinNotAllowedException`. Endpoints live on
`ProjectJoinController`; the manager-initiated paths (`ProjectInvitationService`,
`TeammateService.addTeammate`) still exist alongside it.

**Two different things share the word "policy" — keep them apart:** *role policy*
is what a member may do once they are one (`Teammate.Role{ADMIN, MEMBER}` +
`isOwner`, resolved by `ProjectPermissionEvaluator`); *join policy* is how a
non-member becomes one. Both are now built.

⚠️ **There is no CHECK constraint forbidding `isPublic = false` + `OPEN`.** That
combination is nonsense (you cannot join what you cannot see) and is currently
prevented only at runtime by the `PROJECT:READ` gate on `joinProject`. Don't rely
on the data being clean.

**Posting into a project requires membership** (`PROJECT:CREATE` → teammate), for
every mode. Community achieves "anyone can post" through instant join rather than
through a separate permission level. Whether a **non-member may comment** on a
public project's post is still undecided — see the comment defect below.

**Read access and write access are separate concerns.** Showcase is world-
readable but contributor-gated; Community is world-readable and world-writable.
The current permission model does not express this distinction — it has
read/create/edit/delete per object, with no separate "may comment" or "may post"
level. Treat that as a known gap, not as a design to copy.

### Post organisation — three separate concepts, don't conflate them

| Concept | Table | Shape | Ownership |
| --- | --- | --- | --- |
| **Collection** | `collections` / `collection_posts` | A curated set of *any* posts, playlist-style | `CollectionScope{PERSONAL, WORKSPACE}` via `project_id`; `is_public` toggle; `external_id` for URLs |
| **Series** | `post_series` / `post_series_posts` | An *ordered* sequence, one post in at most one series (`UNIQUE(post_id)`), `position` is `DEFERRABLE INITIALLY DEFERRED` so reorders can renumber in one transaction | Mirrors collections: `project_id` + `external_id`; `posts.is_series_post` denormalises membership |
| **Reference** | `post_references` | A directed citation between posts, both directions readable (`/posts/{slug}/references`, `/posts/{slug}/referenced-by`) | `CHECK (source <> referenced)`, `sort_order`, max `MAX_REFERENCES_PER_POST` (50) |

Related posts (`/posts/{postId}/related`) is a **fourth, distinct** thing —
nearest-neighbour over `post_embeddings`, not user-curated. It needs AI enabled;
see _Runtime flags_ below.

Every one of these is a post-listing surface, so per the permission rules below
they must resolve visibility through the shared `PostVisibilityConditions`
helpers rather than an ad hoc condition.

### Social is secondary

Follows, likes, bookmarks, and recommendations exist as **discovery plumbing**.
They are intentionally not the product. Don't grow this surface without a
discovery justification, and don't add engagement mechanics.

### Explicitly out of scope

Do not implement these, and do not add schema for them, without an explicit
decision to reverse this:

- Reputation, karma, or trust levels
- Voting on posts, answers, or comments
- Creator monetization (paid posts, subscriptions, credits, payouts)
- Advertising
- Full careers-platform surfaces (companies, applications, applicant tracking,
  contests, schools, reviews) — a dead product direction, see _Dead code_
  below. The deliberate exception is a dedicated recruitment-post channel
  built on personal `LONG` posts. It must not revive or depend on the excluded
  careers code.

---

## Repository Layout

```
apps/web/        Next.js 16 + React 19 frontend (pnpm)
apps/server/     Spring Boot 4 + Java 25 backend (Gradle)
docs/api/        docs/api/openapi3.yaml is a generated OpenAPI spec — do NOT
                 edit it by hand. Other files under docs/api/ (e.g. API docs
                 preview tooling) are hand-maintained.
docs/            feature-audit.md — current state vs. intended product, with the
                 known-defect list. Read it before large changes.
infra/           Infrastructure configuration files and Docker Compose files
scripts/         CI and setup scripts
```

---

## Dead code — do not extend, do not port from

Two large regions are excluded from the build and belong to an abandoned
careers/community product direction. They are scheduled for deletion.

- `apps/web/src/app/_legacy/` — ~7.5k LOC, excluded from TypeScript **and**
  ESLint (`eslint.config.mjs` global ignore, `tsconfig` exclude). Unreachable.
- `apps/server/.../{provider,recruitment,review,experience,message,notification}/`
  — ~4.8k LOC, excluded from compilation in `build.gradle` `sourceSets`. **None
  of these have database tables.** `notification` is a bare skeleton, not a
  working system.

Consequences to be aware of while working:

- `ErrorCode` still enumerates codes for these domains
  (`PROVIDER_NOT_FOUND`, `JOB_APPLICATION_NOT_FOUND`, `MESSAGE_TO_SELF`, …).
- `SecurityConfig` still routes `/companies/**`, `/contests/**`, `/jobs/**`,
  `/experiences/**`, `/team-building/**` — paths with no live controller.
- `apps/web/src/types/{experience,message,provider,review}.ts` are orphaned.
- **Notifications do not exist in the running product.** The bell in the top nav
  (`NotificationsButton.tsx`) renders a static placeholder.

The live recruitment-post channel is unrelated to this dead code. Its model,
API, and UI stay inside the live post domain and must not import, copy, or
extend anything from the excluded `recruitment` or `provider` packages.

---

## Web (`apps/web/`)

**Package manager**: pnpm 10.33.0

```bash
pnpm install
pnpm dev          # Orval watch + Next.js dev server
pnpm build        # Clears __generated__, reruns orval, then next build
pnpm lint         # ESLint
pnpm format       # Prettier (write)
```

**No separate `typecheck` script** — run `tsc --noEmit` manually if needed.

### API Codegen (Orval)

- Input: `docs/api/openapi3.yaml` (generated by server build)
- Output: `src/api/__generated__/` — **never edit generated files**
- Regenerate: `pnpm orval --config orval.config.ts`
- `pnpm build` always wipes and regenerates before `next build`

### Path alias

`@/*` → `src/*`, `@/public/*` → `public/*`

### Notable quirks

- `src/app/_legacy/` is dead code excluded from TypeScript and ESLint — never
  port from it or extend it. See _Dead code_ above.
- Infinite-query support for specific Orval operations is manually configured in
  `orval.config.ts` (workaround for orval#3101).
- URL rewrite: `/@:handle/:path*` → `/profile/:handle/:path*` (vanity profile
  URLs, in `next.config.ts`).
- i18n via `next-intl`; Korean strings only at `public/locales/ko.json`. There is
  no `en.json` and no locale switcher.
- There is **no `middleware.ts`** — route protection is per-page
  (`lib/auth/guards.ts` server-side, `hooks/use-auth-guard.ts` client-side), and
  there are no custom security headers from Next (nginx sets them in prod).
- Auth is **Spring-session only**. Spring owns the session end to end (`/auth/*`,
  JDBC-backed, `SESSION` cookie); the Next process holds no auth state and there
  is no auth API route under `src/app/api/`. `src/lib/auth/client.ts` exposes
  `useSession()`, which is a thin wrapper over the generated
  `useGetAuthenticatedUser` query — an unauthenticated caller gets a 401, so
  `data` is `null`. Better Auth was removed in `440e10c0`; do not reintroduce a
  second session store or look for a mirror to keep in sync.
- Changing a password (`PATCH /auth/password`) deletes **every** Spring session
  for that user and issues a fresh one to the caller in the same response, per
  OWASP's "renew the session ID after any privilege level change". Password reset
  (`/auth/password-reset/*`) deletes all of them and issues none — that caller is
  logged out by definition. Both go through
  `auth/session/SessionInvalidationService`, which resolves sessions by principal
  name (the user's email) via `FindByIndexNameSessionRepository`; that index is
  only populated for sessions holding a security context, so any new login path
  must store one or its sessions will silently survive a password change.
  `PasswordSessionInvalidationIntegrationTests` guards this end to end.

### Env setup

```bash
bash scripts/setup/web.sh   # generates apps/web/.env.local
```

---

## Server (`apps/server/`)

**Build tool**: Gradle wrapper (`./gradlew`)

```bash
./gradlew build           # jooqCodegen → spotlessApply → compile → test → openapi3 → copy spec
./gradlew bootRun         # Start server
./gradlew bootRun --args='--spring.profiles.active=dev'
./gradlew test            # JUnit tests only
./gradlew spotlessApply   # Format Java (Google Java Format 1.32.0)
./gradlew jooqCodegen     # Regenerate jOOQ classes (requires Docker for Testcontainers)
```

**`./gradlew build` applies `spotlessApply` automatically** — CI will fail if
diffs exist after build, so always run build before committing.

### jOOQ Codegen

- Spins up a Testcontainers PostgreSQL (`pgvector/pgvector:pg18`) container
- Runs Liquibase migrations against it, then generates classes into
  `build/generated/jooq/`
- Requires Docker running locally

### OpenAPI Spec Generation

- Spring REST Docs → `openapi3` Gradle task → `docs/api/openapi3.yaml`
- Triggered automatically by `./gradlew build`
- This file feeds Orval in the web app — run server build before regenerating
  web API client
- In order to ensure abstraction for the fields, we separate out the API models
  from the REST Docs into separate snippet files. These files can be found under
  the directory named `snippets` for each domain directory.

### Database Migrations

- Liquibase; master changelog:
  `src/main/resources/db/changelog/db.changelog-master.yaml`
- Runs automatically on server startup
- Add new changesets under `db/changelog/changesets/`

### Static analysis

- Error-Prone + NullAway enabled; `WildcardImport`, `MissingBraces`, `NullAway`
  are set to `ERROR`
- NullAway disabled in test compilation
- ⚠️ **NullAway is currently a no-op.** `build.gradle` sets
  `option('NullAway:AnnotatedPackages', 'com.starter')`, but this codebase is
  `com.skkil.sync` — so nothing is analysed despite the `ERROR` severity. Fixing
  the package name will surface a backlog of real findings; expect that, and do
  not assume existing code is nullness-clean.

### Tag & Post Permission Model

Two independently-managed tag pools share one `tags` table, distinguished by
`Tag.project_id`:

- `project_id NULL` → **global tag**, unique by `name` platform-wide, verified
  by platform `ADMIN`.
- `project_id` set → **project tag**, unique by `(project_id, name)`, verified
  by that project's managers.
- A tag's pool is **fixed at creation** — no promote/demote between pools;
  `TagService.mergeTags` only merges two tags already in the same pool.

`PostTag` is a generic `post_id`/`tag_id` join with no pool awareness — a post
can carry any number of global-tag rows and any number of project-tag rows at
once. `TagFollowRelationship` is global-tags-only by construction
(`findByIdAndProjectIsNull` gates every follow).

Permission evaluators (`TagPermissionEvaluator`, `PostPermissionEvaluator`,
`ProjectPermissionEvaluator`):

- Tag `READ`: global tags always readable; project tags readable if the project
  is public, else requires project teammate membership.
- Tag reject (`DELETE /tags/{tagId}` vs
  `DELETE /projects/{handle}/tags/{tagId}`): two endpoints, not one
  ID-dispatched route — global reject is `ADMIN`-only, project reject requires
  `hasPermission(#handle, 'PROJECT', 'EDIT')` **plus** an explicit check that
  the tag actually belongs to `handle`'s project (the permission alone only
  proves the caller manages _some_ project by that name).
- Post creation is two endpoints: `POST /posts` (no project, global tags only,
  authenticated-only) and `POST /projects/{handle}/posts` (global + project
  tags, gated by `hasPermission(#handle, 'PROJECT', 'CREATE')`, which means "any
  teammate," not manager-only).
- Post `canEdit` is author-only; post `canDelete` is author **or** any teammate
  with `canManageProject()` on the post's project — moderation power to remove,
  not to rewrite.
- Post `READ` (public feed, slug page, search, likes/bookmarks): a post's scope
  is `PUBLIC` (no `project_id`, i.e. a personal post) or `WORKSPACE` (belongs
  to a project) — `PostScope.fromProject()`. Personal posts are always
  visible. Workspace posts are visible to non-teammates **iff** their project
  is public (`Project.isPublic`); private-project posts are visible only to
  the author or a project teammate, regardless of caller. This condition must
  stay consistent across every read path — `PostVisibilityConditions`
  (`feedVisibleCondition`/`readableCondition`/`readablePublishedCondition`/
  `getPostsByProject`/`getPostsByIdsInProject`) and
  `PostPermissionEvaluator.canRead` all encode the same rule; when adding a
  new post-listing query, reuse or mirror these instead of writing an ad hoc
  condition. `PostVisibilityConditions` is a package-private top-level class in
  `com.skkil.sync.post.repository` (not `PostQueryRepository`-private)
  precisely so sibling repositories in that package — e.g.
  `PostRecommendationQueryRepository` — can reuse it rather than copy it.
- Post recommendations (`GET /posts/recommendations`) cover **both** scopes.
  Candidates are gated by `PostVisibilityConditions.readablePublishedCondition`,
  so a workspace post surfaces when its project is public or the caller is a
  teammate, and drafts never surface. The optional `scope` query parameter
  (`PUBLIC`/`WORKSPACE`, applied via `PostVisibilityConditions.scopeCondition`)
  narrows the feed to personal-only or project-only; omitting it returns both.

**Known holes in this model** — do not treat the current code as the target:

- **Commenting is now scope-aware — reading and writing are gated separately.**
  `CommentService` resolves posts through
  `PostDomainService.getReadablePostBySlug`, i.e. the shared
  `PostVisibilityConditions.readableCondition`, so comments follow the post's
  own visibility (public project posts are world-readable, private ones
  teammate-only). Writing is narrower: `PostCommentPolicy` requires **project
  membership** to comment on a project post (any logged-in user may comment on a
  personal post), and rejects unpublished posts. The same policy computes
  `PostSummary.canComment` in batch so clients can hide the composer instead of
  letting it 403 — keep the two in sync. The old `ProjectIsNull` lookups
  (`getPublicPublishedPost*`) are gone; don't reintroduce them. `PostBookmarkService`
  had the same defect and now gates on `hasPermission(#postId, 'POST', 'READ')`.
- Platform `ADMIN` can **delete** personal (non-project) posts through
  `PostPermissionEvaluator.canDelete`, but has no override for *project* posts —
  those are moderated by that project's managers (`Teammate.canManageProject()`).
  There is still no *hide* (soft-takedown) path outside the report-review flow.
  `PostSummary.canDelete` exposes the same rule to clients, computed in batch by
  `PostModerationPolicy`; keep the two in sync.
- `PostAccessPolicy.resolveAccessLevels` is a seam that **always returns
  `PostAccessLevel.FULL`**. `PREVIEW` is wired through the DTOs and the web
  viewer (`PostBody.lockedPreview`) but nothing ever produces it. Monetization is
  out of scope, so do not build on this seam without an explicit decision.

---

## Runtime flags — what is off in production

`infra/ops/deploy.sh` writes the production env file and hard-sets these. Code
guarded by them **does not run in production**, however well it works locally:

| Flag | Prod value | Consequence |
| --- | --- | --- |
| `AI_CHAT_PROVIDER` / `AI_EMBEDDING_PROVIDER` / `AI_FEATURES_ENABLED` | `none` / `none` / `false` | No embeddings, no summaries. Hybrid search silently degrades to `pg_trgm` only, and **related posts returns nothing**. |
| `WEBSOCKET_ENABLED` | `false` | No STOMP. nginx also lacks `Upgrade`/`Connection` headers, so `/ws` cannot work even if flipped. |
| `ENABLE_TELEMETRY` | `false` | No traces, metrics or log export. |

Chat/summarization and embeddings are configured as two independent Spring AI
model providers (`spring.ai.model.chat` / `spring.ai.model.embedding`), each
driven by its own env var. Locally, chat stays on Ollama
(`AI_CHAT_PROVIDER=ollama`) while embeddings go to OpenAI's API
(`AI_EMBEDDING_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL`
default `text-embedding-3-small`) — set via `.env`. `post_embeddings.embedding`
is `VECTOR(1536)`, matching `text-embedding-3-small`'s output size; a
different OpenAI embedding model needs a schema migration to match.

Anything depending on embeddings needs a backfill when AI is re-enabled — every
post written while it was off has no vector.

---

## Local Infrastructure

Start all infra before running the server:

```bash
docker compose -f apps/server/compose.yaml up -d         # PostgreSQL (pgvector pg18)
docker compose -f infra/localstack/docker-compose.yml up -d  # S3 (LocalStack)
docker compose -f infra/ollama/docker-compose.yml up -d      # Ollama LLM
```

Environment variables (set by direnv via `.envrc`):

- `DATABASE_URL`, `DATABASE_USERNAME=skkil`, `DATABASE_PASSWORD=password` →
  `localhost:5432/sync`
- `AI_CHAT_PROVIDER=ollama`, `OLLAMA_PORT=11435`, `OLLAMA_MODEL=gemma3:270m`
- `AI_EMBEDDING_PROVIDER=openai` (requires `OPENAI_API_KEY` in `.env`)

Run `direnv allow` once after cloning to activate `.envrc`.

---

## CI (GitHub Actions — `develop` branch only)

Both `ci-web.yml` and `ci-server.yml`:

1. Run the respective build/format/lint command(s)
2. Check `git status --porcelain` — **fails if any files changed**

This means:

- Web: run `pnpm format && pnpm lint && pnpm build` before committing
  (`pnpm lint` includes `i18next/no-literal-string`, which fails the build on
  hardcoded JSX text/attributes not routed through next-intl's
  `t()`/`useTranslations()`/`getTranslations()` — see `eslint.config.mjs`)
- Server: run `./gradlew build` (which applies spotless) before committing

---

## Codegen Pipeline Order

When both apps change together:

1. `./gradlew build` in `apps/server/` → produces `docs/api/openapi3.yaml`
2. `pnpm build` (or `pnpm orval`) in `apps/web/` → consumes updated spec

---

## Tech Stack Quick Reference

|          |                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------ |
| Frontend | Next.js 16, React 19, TS 5, TanStack Query v5, Zustand, Tiptap, STOMP/WS, shadcn/ui, Tailwind v4 |
| Backend  | Spring Boot 4.0.1, Java 25, jOOQ, Liquibase, Spring AI, Spring WebSocket, AWS S3                 |
| Database | PostgreSQL 18 + pgvector                                                                         |
| AI       | Ollama (local), Spring AI, pgvector embeddings                                                   |
| Testing  | Vitest+Playwright (Storybook), JUnit 5, Testcontainers                                           |
