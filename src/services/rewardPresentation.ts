import type { BugDexDropSource } from "./bugDexService.ts";

export function shouldPresentBugDexDropImmediately(_source: BugDexDropSource): boolean {
  return false;
}
