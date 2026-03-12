export type Certainty = "A" | "B" | "C";

export interface VerseLine {
  verse: string;
  text: string;
}

export interface ExtractedPassage {
  reference: string;
  translation: string;
  verses: VerseLine[];
  sourcePath?: string;
}

export interface OriginalTerm {
  lang: "he" | "gr";
  lemma: string;
  transliteration: string;
  glossKo: string;
  relatedRefs: string[];
}

export interface Era {
  id: string;
  order: number;
  name: string;
  rangeLabel: string;
  summary: string;
  covenantAxis: string;
  themeColor: string;
}

export interface ControversyEntry {
  id: string;
  title: string;
  defaultPosition: string;
  alternatives: string[];
  whyItMatters: string;
}

export interface BookPlacement {
  book: string;
  testament: "OT" | "NT";
  eraIds: string[];
  placementType: "narrative" | "prophetic" | "wisdom" | "epistolary" | "apocalyptic";
  note: string;
}

export interface AnchorEvent {
  id: string;
  eraId: string;
  order: number;
  titleKo: string;
  titleEn: string;
  dateLabel: string;
  rangeLabel: string;
  summary: string;
  significance: string;
  certainty: Certainty;
  mainPassages: string[];
  keyPassages: string[];
  fulfillmentPassages: string[];
  focusPassages: ExtractedPassage[];
  originalTerms: OriginalTerm[];
  controversyIds: string[];
}

export interface SiteData {
  generatedAt: string;
  thesis: string;
  method: string[];
  eras: Era[];
  anchorEvents: AnchorEvent[];
  bookPlacements: BookPlacement[];
  controversies: ControversyEntry[];
}
