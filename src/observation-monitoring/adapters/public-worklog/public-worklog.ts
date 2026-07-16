import { z } from "zod";

import publicCheckpointJson from "../../../../docs/ai-worklog/public-checkpoints.json";
import type {
  PublicWorklogCheckpoint,
  WorklogEvidence,
} from "../../application/public-worklog";

const pinnedEvidenceUrl =
  /^https:\/\/github\.com\/CaseyRybak\/Fox-dispatcher\/blob\/[0-9a-f]{40}\/.+/;
const unsafePublicContent = [
  /(?:^|["'\s])\/(?:home|Users)\//i,
  /(?:^|["'\s])[A-Za-z]:\\(?:Users|Documents and Settings)\\/i,
  /file:\/\/\/(?:[A-Za-z]:\/|(?:home|Users)\/)/i,
  /\\\\wsl\$/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /github_pat_[A-Za-z0-9_]+/,
  /gh[pousr]_[A-Za-z0-9]+/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /(?:<|\b)(?:user|assistant|system)(?:>|\s*:)/i,
];

const contentField = z.string().trim().min(1).max(560);
const evidenceSchema = z.strictObject({
  label: z.string().trim().min(3).max(80),
  kind: z.enum([
    "architecture",
    "decision",
    "plan",
    "screenshot",
    "specification",
    "test",
    "verification",
  ]),
  href: z.url().refine((href) => pinnedEvidenceUrl.test(href), {
    message: "Evidence must use a public GitHub blob URL pinned to a commit.",
  }),
});
const checkpointSchema = z.strictObject({
  id: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(64),
  stage: z.string().trim().min(4).max(80),
  date: z.iso.date(),
  goal: contentField,
  aiContribution: contentField,
  humanDecision: contentField,
  change: contentField,
  verification: contentField,
  evidence: z.array(evidenceSchema).min(1).max(3),
});
const publicWorklogSchema = z
  .array(checkpointSchema)
  .min(5)
  .max(7)
  .superRefine((checkpoints, context) => {
    const ids = new Set<string>();

    checkpoints.forEach((checkpoint, index) => {
      if (ids.has(checkpoint.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate checkpoint id: ${checkpoint.id}`,
          path: [index, "id"],
        });
      }

      ids.add(checkpoint.id);

      const publicText = [
        checkpoint.id,
        checkpoint.stage,
        checkpoint.date,
        checkpoint.goal,
        checkpoint.aiContribution,
        checkpoint.humanDecision,
        checkpoint.change,
        checkpoint.verification,
        ...checkpoint.evidence.flatMap(({ href, kind, label }) => [
          href,
          kind,
          label,
        ]),
      ].join("\n");
      if (unsafePublicContent.some((pattern) => pattern.test(publicText))) {
        context.addIssue({
          code: "custom",
          message:
            "Checkpoint contains private, credential-shaped, or transcript content.",
          path: [index],
        });
      }
    });
  });

export function parsePublicWorklog(
  input: unknown,
): readonly PublicWorklogCheckpoint[] {
  const parsed = publicWorklogSchema.parse(input);

  return Object.freeze(
    parsed.map((checkpoint) =>
      Object.freeze({
        ...checkpoint,
        evidence: Object.freeze(
          checkpoint.evidence.map(
            (item) => Object.freeze({ ...item }) as WorklogEvidence,
          ),
        ),
      }),
    ),
  );
}

export const publicWorklog = parsePublicWorklog(publicCheckpointJson);
