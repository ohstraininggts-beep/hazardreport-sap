import templatesRaw from "@/src/data/inspectionTemplates.json";

export type FormType = "checklist" | "scoring" | "preplab" | "table";

export type ChecklistQuestion = { text: string };
export type ChecklistCategory = { title: string; questions: ChecklistQuestion[] };
export type ScoringItem = { catTitle?: string; text: string };
export type PreplabItem = { text: string };
export type TableColumn = { key: string; label: string };

export type Template = {
  jenis: string;
  formType: FormType;
  formCode: string;
  formTitle: string;
  formSubtitle?: string;
  tanggalEfektif?: string;
  revisi?: string;
  hasNA?: boolean;
  categories?: ChecklistCategory[];
  pointMax?: number;
  items?: (ScoringItem | PreplabItem)[];
  columns?: TableColumn[];
};

export const TEMPLATES = templatesRaw as Template[];

export const TYPE_META: Record<FormType, { label: string; short: string }> = {
  checklist: { label: "Pre-Job Inspection / Checklist", short: "Pre-Job" },
  scoring: { label: "Inspeksi Umum Terencana (Skoring)", short: "Skoring" },
  preplab: { label: "Prep-Lab (Inspeksi Terencana Lab)", short: "Prep-Lab" },
  table: { label: "Inspeksi Kepatuhan", short: "Kepatuhan" },
};

export const TYPE_ORDER: FormType[] = ["checklist", "scoring", "preplab", "table"];

export function findTemplate(jenis: string): Template | undefined {
  return TEMPLATES.find((t) => t.jenis === jenis);
}

// Group scoring items by their category title (may be empty).
export function groupScoring(items: ScoringItem[]): { title: string; idxs: number[] }[] {
  const groups: { title: string; idxs: number[] }[] = [];
  items.forEach((it, i) => {
    const t = (it.catTitle || "").trim();
    let g = groups.find((x) => x.title === t);
    if (!g) {
      g = { title: t, idxs: [] };
      groups.push(g);
    }
    g.idxs.push(i);
  });
  return groups;
}
