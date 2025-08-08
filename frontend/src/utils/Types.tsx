// Shared types and helpers for the frontend

export type Operation = {
  id: number;
  operation_code: number;
  machine_type: string;
  order_number: number;
};

// Frontend-facing Task shape (normalized)
export type Task = {
  id: number;
  operation_id: number;
  process_type: "prep" | "qc" | "processing" | string;
  date: string; // YYYY-MM-DD
  start_time?: string | null; // HH:MM:SS or null
  end_time?: string | null; // HH:MM:SS or null
  good_pieces?: number | null;
  bad_pieces?: number | null;
};

// Task payload used when creating a task from the UI
export type TaskCreate = {
  process_type: string;
  date?: string; // optional, defaults to today in the UI
  start_time?: string;
  end_time?: string;
  good_pieces?: number;
  bad_pieces?: number;
};

export type Order = {
  order_number: number;
  material_number: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  num_pieces: number;
  operations?: Operation[];
};

export type OrderCreateStr = {
  order_number: string;
  material_number: string;
  start_date: string;
  end_date: string;
  num_pieces: string;
};

// Human-friendly labels for process types
export const processTypeLabels: Record<string, string> = {
  qc: "Controlo de Qualidade",
  processing: "Processamento",
  prep: "Preparação de Máquina",
};

// Utility: normalize a task object that may come from the backend
// Backend may use snake_case names like `goodpcs`/`badpcs` or slightly different fields.
export function normalizeTaskFromBackend(raw: any): Task {
  return {
    id: raw.id,
    operation_id: raw.operation_id ?? raw.operationId,
    process_type: raw.process_type ?? raw.processType,
    date: raw.date,
    start_time: raw.start_time ?? raw.startTime ?? null,
    end_time: raw.end_time ?? raw.endTime ?? null,
    good_pieces:
      raw.goodpcs ??
      raw.good_pieces ??
      (typeof raw.goodPieces === "number" ? raw.goodPieces : null),
    bad_pieces:
      raw.badpcs ??
      raw.bad_pieces ??
      (typeof raw.badPieces === "number" ? raw.badPieces : null),
  } as Task;
}

// Utility: convert a TaskCreate (frontend shape) to the backend payload expected by the API
// This will strip undefined/empty values and map names to `goodpcs`/`badpcs` which your backend expects.
export function toBackendTaskPayload(payload: TaskCreate): Record<string, any> {
  const out: Record<string, any> = {};
  if (payload.process_type !== undefined)
    out.process_type = payload.process_type;
  if (payload.date) out.date = payload.date;
  if (payload.start_time) out.start_time = payload.start_time;
  if (payload.end_time) out.end_time = payload.end_time;
  if (payload.good_pieces !== undefined) out.goodpcs = payload.good_pieces;
  if (payload.bad_pieces !== undefined) out.badpcs = payload.bad_pieces;
  return out;
}

// Small helper to format local time as HH:MM:SS
export function formatLocalTime(date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
