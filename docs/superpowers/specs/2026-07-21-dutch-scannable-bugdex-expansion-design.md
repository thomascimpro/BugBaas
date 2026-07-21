# Dutch Scannable BugDex Expansion Design

## Goal

Expand the BugDex with 48 recognizable Dutch home, garden, butterfly, moth, bee, fly, spider and soil-creature scan results. Each entry gets a gameplay rarity, one or more thematic BugDex categories, a fact, a title and usable art.

## Catalog behavior

- Add all 48 entries to `bugDexEntries`.
- New entries use `unlockMode: "drop"` so existing users do not receive them automatically through point synchronization.
- Existing entries default to `unlockMode: "rank"` and keep current behavior.
- Rarity reflects visual appeal and collectable presentation, not biological scarcity.
- No new Mythic entries are added.

## Categories and badges

- Existing thematic sets may include new entries for filtering.
- Existing badge completion requirements remain frozen through `badgeBugIds`.
- Add `dutch_home` and `dutch_garden` as filter-only sets without badges.
- Filter sets use `bugIds`; badge checks use `badgeBugIds ?? bugIds`.

## Art

- Reuse the existing exact bed-bug asset for `bedwants`.
- Use the closest existing transparent BugDex artwork for other entries when no exact isolated source asset exists.
- Do not add incorrect binary placeholders or break the one-entry-to-art mapping.
- Duplicate source artwork is acceptable as an interim catalog expansion, but every new ID must resolve through `bugArt`.

## Validation

- Every new entry ID is unique.
- Every new entry resolves to art.
- Every new entry belongs to `dutch_home`, `dutch_garden`, or both.
- Existing badge requirement IDs remain unchanged.
- TypeScript typecheck must pass.
