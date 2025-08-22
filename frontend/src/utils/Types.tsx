// Shared types and helpers for the frontend

// -------------------------------
// Enums
// -------------------------------
export type MachineType = "CNC" | "CONVENTIONAL";
export type ProcessType = "PREPARATION" | "QUALITY_CONTROL" | "PROCESSING";

// -------------------------------
// Machine type
// -------------------------------
export type Machine = {
  id: number;
  machine_location: string;
  description: string;
  machine_id: string;
  machine_type: MachineType;
  active?: boolean; // NEW: optional flag to filter selectable machines
};

// -------------------------------
// Operation type
// -------------------------------
export type Operation = {
  id: number;
  operation_code: string;
  order_id: number; // now references order by ID
  machine_id?: number | null; // references machine by ID (nullable)
  machine?: Machine; // optional expanded machine details
  tasks?: Task[]; // operations include tasks
};

// -------------------------------
// Operation update type (for PATCH payloads)
// -------------------------------
export type OperationUpdate = {
  operation_code?: string | null;
  machine_id?: number | null;
  machine_type?: MachineType | null;
};

// -------------------------------
// Task type
// -------------------------------
export type Task = {
  id: number;
  operation_id: number;
  operator: string;
  process_type: ProcessType;
  // NEW: timezone-aware datetime strings (ISO8601 with offset)
  start_at?: string | null; // e.g. "2025-08-22T08:30:00+01:00"
  end_at?: string | null;
  num_benches?: number | null;
  num_machines?: number | null;
  good_pieces?: number | null;
  bad_pieces?: number | null;
};

// Task payload used when creating a task from the UI
export type TaskCreate = {
  process_type: ProcessType;
  operator: string;
  start_at?: string;
  end_at?: string;
  num_benches?: number;
  num_machines?: number;
  good_pieces?: number;
  bad_pieces?: number;
};

// -------------------------------
// Order type
// -------------------------------
export type Order = {
  id: number;
  order_number: number;
  material_number: number;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  num_pieces: number;
  operations?: Operation[];
};

export type OrderCreateStr = {
  order_number: string;
  material_number: string;
  start_date?: string;
  end_date?: string;
  num_pieces: string;
};

// -------------------------------
// Labels for Enums
// -------------------------------
export const processTypeLabels: Record<string, string> = {
  QUALITY_CONTROL: "Controlo de Qualidade",
  PROCESSING: "Processamento",
  PREPARATION: "Preparação de Máquina",
  CNC: "CNC",
  CONVENTIONAL: "Convencional",
};

// -------------------------------
// Helpers
// -------------------------------
export function formatLocalTime(date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
