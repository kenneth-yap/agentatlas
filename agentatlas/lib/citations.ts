import { Architecture, Reference, ReferenceKind } from "./types";

export const REFERENCE_KIND_LABELS: Record<ReferenceKind, string> = {
  origin:         "Origin",
  related:        "Related",
  background:     "Background",
  implementation: "Implementation",
};

// Display order on the detail page: where the idea came from first, docs last.
const KIND_ORDER: ReferenceKind[] = ["origin", "related", "background", "implementation"];

export function sortReferences(refs: Reference[]): Reference[] {
  return [...refs].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
}

// "Yao et al., 2023" — or just the authors when the source is undated (living docs).
export function shortCitation(ref: Reference): string {
  return ref.year ? `${ref.authors}, ${ref.year}` : ref.authors;
}

// The paper that introduced the pattern, if there is a single one.
// Composite patterns (e.g. PEV, Dry-Run) have none, and that is reported honestly.
export function originReference(arch: Architecture): Reference | undefined {
  return arch.references.find((r) => r.kind === "origin");
}
