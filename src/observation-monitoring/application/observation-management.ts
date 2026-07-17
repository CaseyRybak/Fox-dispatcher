import type { Observation } from "@/observation-monitoring/domain/observation";

const generatedObservationIdPattern =
  /^obs_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export interface ObservationDraft {
  readonly color: string;
  readonly foxId: string;
  readonly hasPrey: boolean | undefined;
  readonly location: string;
  readonly suspicionLevel: number;
  readonly time: string;
}

type ValidatedObservationDraft = Omit<ObservationDraft, "hasPrey"> & {
  readonly hasPrey: boolean;
};

export type ObservationDraftField = keyof ObservationDraft;
export type ObservationDraftErrors = Partial<
  Readonly<Record<ObservationDraftField, string>>
>;

export interface ObservationIdGenerator {
  create(): string;
}

export type ObservationMutationResult =
  | {
      readonly ok: true;
      readonly observationId: string;
      readonly observations: readonly Observation[];
    }
  | {
      readonly ok: false;
      readonly fieldErrors: ObservationDraftErrors;
      readonly formError?: string;
    };

export interface ObservationDeletionUndo {
  readonly index: number;
  readonly observation: Observation;
}

export type ObservationDeletionResult =
  | {
      readonly ok: true;
      readonly observations: readonly Observation[];
      readonly undo: ObservationDeletionUndo;
    }
  | { readonly ok: false };

export function addObservation(
  observations: readonly Observation[],
  draft: ObservationDraft,
  idGenerator: ObservationIdGenerator,
): ObservationMutationResult {
  const validation = validateObservationDraft(draft);
  if (!validation.ok) return validation;
  if (observations.length >= 1000) {
    return {
      fieldErrors: {},
      formError:
        "В журнале уже 1000 наблюдений. Удалите запись перед добавлением.",
      ok: false,
    };
  }

  let id: string;
  try {
    id = idGenerator.create();
  } catch {
    return createIdError();
  }

  if (
    !generatedObservationIdPattern.test(id) ||
    id.length > 64 ||
    observations.some((observation) => observation.id === id)
  ) {
    return createIdError();
  }

  return {
    ok: true,
    observationId: id,
    observations: [...observations, toObservation(id, validation.draft)],
  };
}

export function editObservation(
  observations: readonly Observation[],
  observationId: string,
  draft: ObservationDraft,
): ObservationMutationResult {
  const index = observations.findIndex(({ id }) => id === observationId);
  const validation = validateObservationDraft(draft);
  if (!validation.ok) return validation;
  if (index < 0) {
    return {
      fieldErrors: {},
      formError: "Наблюдение больше не найдено. Закройте редактор и повторите.",
      ok: false,
    };
  }

  return {
    ok: true,
    observationId,
    observations: observations.map((observation, observationIndex) =>
      observationIndex === index
        ? toObservation(observationId, validation.draft)
        : observation,
    ),
  };
}

export function deleteObservation(
  observations: readonly Observation[],
  observationId: string,
): ObservationDeletionResult {
  const index = observations.findIndex(({ id }) => id === observationId);
  if (index < 0) return { ok: false };

  return {
    ok: true,
    observations: observations.filter(({ id }) => id !== observationId),
    undo: { index, observation: observations[index]! },
  };
}

export function undoObservationDeletion(
  observations: readonly Observation[],
  undo: ObservationDeletionUndo,
): readonly Observation[] {
  if (observations.some(({ id }) => id === undo.observation.id)) {
    return observations;
  }

  const next = [...observations];
  next.splice(Math.min(undo.index, next.length), 0, undo.observation);
  return next;
}

export function resetObservations(
  _observations: readonly Observation[],
  starter: readonly Observation[],
): readonly Observation[] {
  return starter.map((observation) => ({ ...observation }));
}

export function observationToDraft(observation: Observation): ObservationDraft {
  return {
    color: observation.color,
    foxId: observation.fox_id,
    hasPrey: observation.has_prey,
    location: observation.location,
    suspicionLevel: observation.suspicion_level,
    time: observation.time,
  };
}

function validateObservationDraft(draft: ObservationDraft):
  | { readonly ok: true; readonly draft: ValidatedObservationDraft }
  | {
      readonly ok: false;
      readonly fieldErrors: ObservationDraftErrors;
    } {
  const normalized: ObservationDraft = {
    ...draft,
    color: normalizeString(draft.color),
    foxId: normalizeString(draft.foxId),
    location: normalizeString(draft.location),
    time: normalizeString(draft.time),
  };
  const fieldErrors: Partial<Record<ObservationDraftField, string>> = {};

  validateRequiredText(
    normalized.foxId,
    64,
    "Укажите лису (до 64 символов).",
    (message) => {
      fieldErrors.foxId = message;
    },
  );

  if (typeof normalized.hasPrey !== "boolean") {
    fieldErrors.hasPrey = "Выберите, была ли лиса с добычей.";
  }
  validateRequiredText(
    normalized.location,
    80,
    "Укажите локацию (до 80 символов).",
    (message) => {
      fieldErrors.location = message;
    },
  );
  validateRequiredText(
    normalized.color,
    80,
    "Укажите цвет (до 80 символов).",
    (message) => {
      fieldErrors.color = message;
    },
  );

  if (
    !Number.isInteger(normalized.suspicionLevel) ||
    normalized.suspicionLevel < 0 ||
    normalized.suspicionLevel > 10
  ) {
    fieldErrors.suspicionLevel = "Введите целое число от 0 до 10.";
  }
  if (!timePattern.test(normalized.time)) {
    fieldErrors.time = "Введите время в 24-часовом формате ЧЧ:ММ.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, ok: false };
  }

  if (typeof normalized.hasPrey !== "boolean") {
    throw new Error("Validated observation draft is missing hasPrey.");
  }

  return { draft: { ...normalized, hasPrey: normalized.hasPrey }, ok: true };
}

function validateRequiredText(
  value: string,
  maxLength: number,
  message: string,
  reject: (message: string) => void,
) {
  if (value.length === 0 || value.length > maxLength) reject(message);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toObservation(
  id: string,
  draft: ValidatedObservationDraft,
): Observation {
  return {
    color: draft.color,
    fox_id: draft.foxId,
    has_prey: draft.hasPrey,
    id,
    location: draft.location,
    suspicion_level: draft.suspicionLevel,
    time: draft.time,
  };
}

function createIdError(): ObservationMutationResult {
  return {
    fieldErrors: {},
    formError: "Не удалось создать ID наблюдения. Повторите сохранение.",
    ok: false,
  };
}
