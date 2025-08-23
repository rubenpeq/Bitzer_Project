import { useEffect, useState } from "react";
import { Modal, Button, Form, Alert, Row, Col } from "react-bootstrap";
import type { Task } from "../utils/Types";

type Props = {
  show: boolean;
  onHide: () => void;
  apiUrl: string;
  taskId: number;
  fieldKey: string; // e.g. "operator" | "start_at" | "end_at" | "process_type"
  label: string;
  initialValue: any;
  onSaved: (updatedTask: Task) => void;
};

const VALID_PROCESS_TYPES = ["PREPARATION", "QUALITY_CONTROL", "PROCESSING"] as const;
type ProcessTypeStr = (typeof VALID_PROCESS_TYPES)[number];

// Convert ISO string to local "YYYY-MM-DD" and "HH:MM"
const isoToLocalParts = (iso?: string | null) => {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
};

// Convert local date + local time -> ISO string in UTC
const localPartsToIso = (localDate: string, localTime: string) => {
  if (!localDate || !localTime) return null;
  const d = new Date(`${localDate}T${localTime}`);
  return d.toISOString();
};

export default function EditTask({ show, onHide, apiUrl, taskId, fieldKey, label, initialValue, onSaved }: Props) {
  const [value, setValue] = useState<string>(initialValue ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startAtDate, setStartAtDate] = useState<string>("");
  const [startAtTime, setStartAtTime] = useState<string>("");
  const [endAtDate, setEndAtDate] = useState<string>("");
  const [endAtTime, setEndAtTime] = useState<string>("");

  useEffect(() => {
    setError(null);
    setValue(initialValue ?? "");

    // time fields
    if ((fieldKey === "start_at" || fieldKey === "end_at") && show) {
      fetch(`${apiUrl}/task/${taskId}`)
        .then((r) => (r.ok ? r.json() : Promise.reject("Falha ao carregar tarefa")))
        .then((task: Task) => {
          const start = isoToLocalParts(task.start_at ?? null);
          const end = isoToLocalParts(task.end_at ?? null);
          setStartAtDate(start.date);
          setStartAtTime(start.time);
          setEndAtDate(end.date);
          setEndAtTime(end.time);
        })
        .catch((e) => console.warn("Erro ao carregar task:", e));
    }
  }, [initialValue, show, fieldKey, apiUrl, taskId]);

  const convertPayload = (): Record<string, any> => {
    if (fieldKey === "process_type") {
      if (!VALID_PROCESS_TYPES.includes(value as ProcessTypeStr)) throw new Error("Tipo de processo inválido");
      return { process_type: value as ProcessTypeStr };
    }
    if (fieldKey === "operator") return { operator: value || null };

    if (fieldKey === "start_at" || fieldKey === "end_at") {
      const payload: any = {};
      if (startAtDate && startAtTime) payload.start_at = localPartsToIso(startAtDate, startAtTime);
      else payload.start_at = null;
      if (endAtDate && endAtTime) payload.end_at = localPartsToIso(endAtDate, endAtTime);
      else payload.end_at = null;
      return payload;
    }

    return { [fieldKey]: value ?? null };
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
      const res = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated: Task = await res.json();
      onSaved(updated);
      onHide();
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

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

    if (fieldKey === "operator") return <Form.Control value={value ?? ""} onChange={(e) => setValue(e.target.value)} />;

    if (fieldKey === "start_at" || fieldKey === "end_at") {
      return (
        <>
          <Form.Group as={Row} className="mb-2">
            <Form.Label column sm={4}>
              Início
            </Form.Label>
            <Col sm={8}>
              <Form.Control type="date" value={startAtDate} onChange={(e) => setStartAtDate(e.target.value)} disabled={loading} />
              <Form.Control type="time" value={startAtTime} onChange={(e) => setStartAtTime(e.target.value)} disabled={loading} />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-2">
            <Form.Label column sm={4}>
              Fim
            </Form.Label>
            <Col sm={8}>
              <Form.Control type="date" value={endAtDate} onChange={(e) => setEndAtDate(e.target.value)} disabled={loading} />
              <Form.Control type="time" value={endAtTime} onChange={(e) => setEndAtTime(e.target.value)} disabled={loading} />
            </Col>
          </Form.Group>
        </>
      );
    }

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
