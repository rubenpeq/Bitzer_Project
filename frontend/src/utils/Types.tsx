// Shared types and helpers for the frontend

// Enum for machine type
export type MachineType = "CNC" | "CONVENTIONAL";

// Machine type
export type Machine = {
  machine_id: string;
  description: string;
  machine_location: string;
};

// Operation type
export type Operation = {
  id: number;
  operation_code: number;
  machine_type: MachineType;
  order_number: number;
  machine_id?: string;
};

// Frontend-facing Task shape (normalized)
export type Task = {
  id: number;
  operation_id: number;
  operator: string;
  process_type: "PREPARATION" | "QUALITY_CONTROL" | "PROCESSING";
  date: string; // YYYY-MM-DD
  start_time?: string | null; // HH:MM:SS or null
  end_time?: string | null; // HH:MM:SS or null
  good_pieces?: number | null;
  bad_pieces?: number | null;
};

// Task payload used when creating a task from the UI
export type TaskCreate = {
  process_type: string;
  operator: string;
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
  QUALITY_CONTROL: "Controlo de Qualidade",
  PROCESSING: "Processamento",
  PREPARATION: "Preparação de Máquina",
};

// Utility: convert a TaskCreate (frontend shape) to the backend payload expected by the API
export function toBackendTaskPayload(payload: TaskCreate): Record<string, any> {
  const out: Record<string, any> = {};
  if (payload.process_type !== undefined)
    out.process_type = payload.process_type;
  if (payload.date) out.date = payload.date;
  if (payload.start_time) out.start_time = payload.start_time;
  if (payload.end_time) out.end_time = payload.end_time;
  if (payload.good_pieces !== undefined) out.goodpcs = payload.good_pieces;
  if (payload.bad_pieces !== undefined) out.badpcs = payload.bad_pieces;
  if (payload.operator !== undefined) out.operator = payload.operator;
  return out;
}

// Small helper to format local time as HH:MM:SS
export function formatLocalTime(date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
