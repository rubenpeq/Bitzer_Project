import { useEffect, useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import type { Task } from "../utils/Types";

type Props = {
  show: boolean;
  onHide: () => void;
  apiUrl: string;
  taskId: number;
  fieldKey: string; // e.g. "operator" | "date" | "start_time" | "end_time" | "process_type"
  label: string;
  initialValue: any;
  onSaved: (updatedTask: Task) => void;
};

const VALID_PROCESS_TYPES = ["PREPARATION", "QUALITY_CONTROL", "PROCESSING"] as const;
type ProcessTypeStr = typeof VALID_PROCESS_TYPES[number];

export default function EditTask({
  show,
  onHide,
  apiUrl,
  taskId,
  fieldKey,
  label,
  initialValue,
  onSaved,
}: Props) {
  const [value, setValue] = useState<string>(initialValue ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(initialValue === null || initialValue === undefined ? "" : String(initialValue));
    setError(null);
  }, [initialValue, show]);

  const convertPayload = (): Record<string, any> => {
    // Numeric fields (none in single-field edits except pieces — we won't edit pieces here)
    if (fieldKey === "process_type") {
      if (!VALID_PROCESS_TYPES.includes(value as ProcessTypeStr)) throw new Error("Tipo de processo inválido.");
      return { process_type: value as ProcessTypeStr };
    }

    if (fieldKey === "date") {
      if (value === "") return { date: null }; // allow clearing
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Formato de data inválido (YYYY-MM-DD).");
      return { date: value };
    }

    if (fieldKey === "start_time" || fieldKey === "end_time") {
      if (value === "") return { [fieldKey]: null };
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) throw new Error("Formato de hora inválido (HH:MM ou HH:MM:SS).");
      // ensure seconds format if user chose HH:MM -> append :00
      const parts = value.split(":");
      if (parts.length === 2) return { [fieldKey]: `${value}:00` };
      return { [fieldKey]: value };
    }

    // default string field (operator)
    return { [fieldKey]: value === "" ? null : value };
  };

  const handleSave = async () => {
    setError(null);
    let payload;
    try {
      payload = convertPayload();
    } catch (e: any) {
      setError(e.message || "Valor inválido");
      return;
    }

    if (!window.confirm(`Confirmar alteração de "${label}"?`)) return;

    setLoading(true);
    try {
      // use PUT /tasks/{task_id} per your updated API
      const res = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      const updated: Task = await res.json();
      onSaved(updated);
      onHide();
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Render different input types for fields
  const renderInput = () => {
    if (fieldKey === "process_type") {
      return (
        <Form.Select value={value} onChange={(e) => setValue(e.target.value)}>
          <option value="">Selecione tipo</option>
          <option value="PREPARATION">Preparação de Máquina</option>
          <option value="QUALITY_CONTROL">Controlo de Qualidade</option>
          <option value="PROCESSING">Processamento</option>
        </Form.Select>
      );
    }
    if (fieldKey === "date") {
      return <Form.Control type="date" value={value} onChange={(e) => setValue(e.target.value)} />;
    }
    if (fieldKey === "start_time" || fieldKey === "end_time") {
      return <Form.Control type="time" value={value?.slice(0, 8) ?? ""} onChange={(e) => setValue(e.target.value)} />;
    }
    // default -> operator (text)
    return <Form.Control value={value ?? ""} onChange={(e) => setValue(e.target.value)} />;
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar — {label}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group>{renderInput()}</Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
