# Content Text Policy

This repo treats user-facing rules/reference prose as one of two things:

- `Verbatim`: exact wording from an open or otherwise explicitly licensed source.
- `Non-verbatim`: app-authored summary, condensation, or paraphrase.

## Rules

- Ship exact official wording only when the source is open or otherwise explicitly licensed for redistribution.
- Do not bundle verbatim proprietary rulebook text unless the repo has a documented license for it.
- Do not let paraphrased text look like exact book text by omission. If the app ships non-verbatim rules/reference prose, record it in the repo.
- Do not replace compact browse-summary or support-copy fields with verbatim rules text just because the product also needs an exact inspect surface; add separate detail text fields/files for exact-source copy instead.
- When an inspect surface has exact long-form text available, do not lead that surface with shorter non-verbatim summary/effect/features/actions copy.

## Required Documentation

- Update [docs/NON_VERBATIM_TEXT.md](./NON_VERBATIM_TEXT.md) whenever new non-verbatim user-facing rules/reference prose ships.
- For repo-managed content packs, keep a matching `textAudit.json` beside the pack manifest when the pack has joined description files.
- `npm run content:build` now fails if a pack description file is missing a matching audit entry.

## Scope

- This policy covers shipped user-facing rules/reference prose.
- It does not inventory product docs, code comments, or test-only fixture text.

## Current State

- Compact browse summaries remain allowed to be non-verbatim, but they must stay documented.
- The current SRD 5.2.1 joined creature descriptions and `107` current spell-pack description files now use exact open official wording and are marked `verbatim` in the pack audit.
- `thorn-whip` remains a documented spell-pack exception as of `2026-03-09` because the verified official D&D Beyond Free Rules spell-description page did not expose a matching open description block for that spell.
- A bounded starter set of seeded `armor`, `weapon`, and `gear` entries now also carries exact open SRD wording through separate `officialText` payload fields instead of replacing the existing browse summaries.
- A bounded seeded `rule` glossary slice now also carries exact open SRD wording through separate `officialText` payload fields, again without replacing the current browse-summary layer.
- A bounded seeded `background` slice now also carries exact open SRD wording through separate `officialText` payload fields, while the existing theme/summary/support fields remain documented browse copy.
