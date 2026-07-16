export type WorklogEvidenceKind =
  | "architecture"
  | "decision"
  | "plan"
  | "screenshot"
  | "specification"
  | "test"
  | "verification";

export interface WorklogEvidence {
  readonly label: string;
  readonly kind: WorklogEvidenceKind;
  readonly href: string;
}

export interface PublicWorklogCheckpoint {
  readonly id: string;
  readonly stage: string;
  readonly date: string;
  readonly goal: string;
  readonly aiContribution: string;
  readonly humanDecision: string;
  readonly change: string;
  readonly verification: string;
  readonly evidence: readonly WorklogEvidence[];
}
