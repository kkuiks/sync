---
name: SYNC
description: >
  Product and design direction for SYNC — a knowledge-sharing platform built
  around three post shapes (short, long, question) and three kinds of shared
  space (community, showcase, team). Developers and technical teams are the
  first audience, not the limit. Clean, professional, dark-first, deep emerald
  brand. This file captures intent and patterns; exact values (color ramps,
  spacing, component states) live in code (tokens.css / theme config).
brand: deep emerald ~#0B7A5B
theme: dark-first (light supported)
type: Inter (UI + reading) · JetBrains Mono (code)
---

# SYNC — Product & Design Direction

Read this to understand _what SYNC is_ and _how it should behave and feel_.
Exact tokens are defined in code, not here.

SYNC's one job is to make knowledge **findable** and **trustworthy**. Anything
that doesn't serve that gets cut.

---

## What SYNC is

A knowledge-sharing platform for people and teams who accumulate knowledge worth
finding again. Two axes define the whole product.

### Audience — developers first, not developers only

**Developers and technical teams are the first audience, not the boundary of the
product.** Nothing in the two axes below is specific to writing software: a
research group, a design team, or a support team has the same three shapes of
thing to say and the same three shapes of space to say it in.

This distinction has one concrete consequence, and it applies to product copy,
marketing surfaces, and feature design alike:

> **Neutral claims, specific examples.**

Claims — the tagline, page headings, feature descriptions, empty states, FAQ
answers — never narrow the product to developers. Examples — demo content,
screenshots, placeholder text, the scenarios we design against — are
unmistakably technical, because that is who we are building for first. A
developer should recognise themselves in the examples, never need the word
"developer" in the claims, and nothing should need rewriting when a
non-engineering team signs up.

⚠️ **The failure mode:** making a claim audience-neutral usually makes it
vaguer, and vague is worse than narrow. Neutrality is paid for by the examples
getting *more* concrete, never by the claims getting blander. A neutral heading
that reads as generic filler is a worse heading, not a more inclusive one —
reject it and write a sharper concrete one.

Code stays a first-class element (see _Typography_): supporting technical
writing well is a capability, not an audience restriction.

### Axis 1 — Three post shapes

A single writing surface that adapts to what you actually have to say. These are
not categories or tags; they are structurally different objects.

| Shape | Analogue | What it is |
| --- | --- | --- |
| **Short** | Twitter / a team channel post | A thought, a link, a finding. No title. Low ceremony, fast to write. |
| **Long** | A forum thread or blog post | The considered write-up: a guide, a post-mortem, an architecture note. Title-led, built for reading. |
| **Question** | Stack Overflow | An open problem seeking an answer, with a visible resolution state. |

**Questions resolve through comments.** There is no separate "answer" object — a
comment on a question _is_ an answer, and the author accepts one, which resolves
the question. Keep the comment surface strong enough to carry that weight.

### Axis 2 — Three kinds of space

Personal posts belong to no space. Everything else lives in a **project** — a
workspace with one of exactly three shapes:

| Space | Who can read | Who can post | Analogue |
| --- | --- | --- | --- |
| **Community** | Anyone | Anyone who joins (open) | A subreddit |
| **Showcase** | Anyone | Approved members only (join by request) | A public GitHub repo |
| **Team** | Members only | Members only (invite-only, invisible outside) | A private Slack channel |

The three are one product, not three. A person should be able to move between
their team's private space, a public community they joined, and a showcase they
follow without the interface changing shape under them.

Read access and write access are separate questions, and Showcase is the mode
that proves it: the world can read and discuss, but only approved members
publish. Never conflate "can see this" with "can add to this."

### Quality over volume

SYNC is a place for genuine knowledge sharing, not content farming. Every design
decision should ask: _does this make good knowledge easier to find, or does it
just make more of it?_

- Surfaces lead with **usefulness signals** — a question's resolution state, the
  quality of a space's activity — never with vanity metrics.
- Ranking rewards usefulness, not volume.
- Curation is human and lightweight: a clean tag vocabulary, moderation that
  works, and spaces whose norms are set by the people in them.

There is deliberately **no automated trust score** — no reputation, no karma, no
freshness/verification state on posts. Quality is a product-decisions constraint,
not a feature with a badge.

### Social is present, not the point

Follows, likes, bookmarks, and recommendations exist because discovery needs
them. They are **plumbing, not product**. They should never dominate a surface,
never be the loudest thing on a card, and never become the reason someone posts.
No follower counts as headline stats; no engagement-bait affordances.

---

## Principles

1. **Clean over decorated.** Flat surfaces, hairline borders, generous
   whitespace. Depth comes from tonal steps and borders, not heavy shadows.
2. **Calm density.** A tool people read for a long time — pack information
   without noise. One level of emphasis; color reserved for meaning.
3. **Green means action.** Emerald is the single brand color and it drives
   interaction — primary actions, active nav. Only one saturated green per view,
   so it never stops meaning "do this."
4. **Shape carries meaning.** The memorable element is anatomy: post shapes and
   space modes are legible from their silhouette and affordances, never from a
   badge. Make that expressive; keep everything else disciplined.
5. **Never rely on hue alone.** Status is always color + icon + word.
6. **Plain and human.** Sentence case, active voice, the user's vocabulary.

## Look & feel

Dark-first and professional. Near-black canvas, off-white text (never pure white
on pure black), hairline low-opacity borders in place of shadows. Modest corner
radii, an 8px spacing rhythm, and room to breathe. Motion is quick and
functional — new arrivals fade in, never slide or bounce.

## Color

- **Brand** is a deep, slightly blue-leaning emerald (~#0B7A5B): professional
  rather than neon, and dark enough to carry white text.
- Green is **interaction only**. Reserve the one saturated green for the primary
  action; everything else stays neutral so green keeps its meaning. A resolved
  question may borrow it as a quiet accent — that is the one exception, and it
  is never a filled block.
- **Status** uses amber (warning) and red (error / destructive), kept clearly
  distinct from brand green.
- **Post types** get only a whisper of color (slate / blue / purple), never a
  filled badge — see _Post types_.
- Neutrals carry the rest. If it isn't communicating state or type, it isn't
  colored.

## Typography

`Inter` for all UI and reading; `JetBrains Mono` for code, since fenced code is
a first-class post element. Two weights only (regular + semibold). Sentence case
everywhere except @handles.

## Layout

A ~240px sidebar and a centered content column at comfortable density. Hierarchy
comes from tonal surface steps and hairline borders; shadows appear only on
things that truly float (menus, dialogs).

---

## Core patterns

Intent for the key surfaces — behavior and feel, not measurements.

- **Post types — distinguish by anatomy, not badges.** The three shapes are
  structurally different, so the card's _shape_ is the signal:
  - **Short** — no title; a message-style card (avatar, name, then the body as
    the content). Low ceremony; may drop its border to sit inline in the stream.
  - **Long** — headline-forward with a short dek, a cover thumbnail, and a
    reading time: the editorial silhouette.
  - **Question** — an answer-count and resolution rail (unanswered / answered /
    resolved): the Q&A silhouette unique to questions. Unanswered is a call to
    action, not a failure state — it should read as an invitation.

  A single small type glyph in the muted type color is the only explicit cue — a
  whisper, never a filled pill.

- **Spaces — the mode is legible before you enter.** A project's card and header
  should make its shape obvious without reading documentation:
  - **Community** leads with the join action and its activity; joining is one
    click and posting is immediate.
  - **Showcase** leads with the work. Reading and discussion are open to
    everyone; the contribute action is a _request_, and it should say so plainly
    rather than looking like a broken button.
  - **Team** never appears to non-members at all — not in search, not in
    discovery, not as a 403. It simply isn't there.

  Inside a space, the only thing that changes is what you're permitted to do.
  The layout, the editor, and the reading experience stay identical.

- **Sidebar** swaps between two modes — global home and inside a project — but
  keeps the logo, the primary **New post** action, and the account row steady so
  the app feels continuous when you move between them. One bold green (the CTA);
  the active item is a quiet recessed state, not a second green block. Long
  project lists cap with "See all". Invitations live on the bell and account
  menu, not the nav — the sidebar stays navigation-only.

- **Navigation levels.** The logo always returns to global home; the project
  switcher moves sideways between projects; "Overview" goes down into one. Two
  homes — a global feed and a project overview — that never share a name.

- **Explore** is a single destination with Projects / People / Posts tabs, not
  three separate pages; the home page previews each and links in. Discovery
  cards lead with what a space is *for* — its mode, its tags, whether questions
  there get answered — never with follower vanity.

- **Feed.** Posts from the spaces and people you follow. The type silhouettes
  let you tell shapes apart at a glance, and a post's origin space travels with
  it rather than living only inside that space.

- **Search is a primary surface, not a utility.** Findability is half the
  thesis. Search should be reachable from everywhere and rank by usefulness
  rather than recency. It is a **signed-in** surface.

- **The signed-out surface is deliberately narrow.** A visitor who arrives from a
  shared link or a search engine can read that public post and its discussion —
  and that is all. No feed, no search, no browsing. The page's job at that moment
  is to be readable, credible, and to make signing in the obvious next step, not
  to nag. This is the whole top of the funnel: treat public post pages as landing
  pages, because that is what they are.

- **Tags** are the primary organizing axis — quiet neutral chips, with the
  selected filter in brand green.

---

## Voice

Intelligent, warm, and plain. Buttons name the action and keep the name through
the flow. Empty states are invitations, not apologies. The user's things are
"your…"; confirmations are past tense ("Saved"); "I" appears only on chat / AI
surfaces, never in system UI.

## Accessibility

WCAG AA (4.5:1 text, 3:1 non-text). Status is always color + icon + label —
never color alone. Visible focus on every interactive element. Dark-mode care:
off-white on near-black, low-opacity borders for separation. Honor reduced
motion; keep touch targets large; support full keyboard navigation.

---

## Deliberately out of scope

Recorded so they aren't reintroduced by accident. Revisit only when there is a
real user base to reason about.

- **Post verification / freshness state.** No verified badge, no "needs review,"
  no freshness percentage, no re-verify action. Knowledge quality is not
  something SYNC scores or timestamps.
- **Reputation / karma / trust levels.** The quality mandate above is the goal;
  reputation is one possible mechanism for it, and not one we are building yet.
- **Voting** on posts, answers, or comments.
- **Creator monetization** — paid posts, subscriptions, credits, payouts.
- **Advertising** anywhere in the product.
- **Full careers platform surfaces** — companies, applications, applicant
  tracking, contests, schools, and reviews. A previous product direction; see
  `docs/feature-audit.md`. A narrow recruitment-post channel is the exception:
  it reuses personal long-form posts, keeps application and compensation
  details in the post body, and is discoverable only from its dedicated
  surface.
