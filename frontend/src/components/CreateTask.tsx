import { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import type { Task, TaskCreate } from "../utils/Types";

// Allowed process types (string literals)
const VALID_PROCESS_TYPES = ["PREPARATION", "QUALITY_CONTROL", "PROCESSING"] as const;
type ProcessTypeStr = typeof VALID_PROCESS_TYPES[number];

type CreateTaskProps = {
  operationId: number;
  show: boolean;
  onClose: () => void;
  onCreateSuccess: (newTask: Task) => void;
};

// UI form shape
type TaskForm = {
  process_type: string;
  operator?: string;
  start_at_date?: string;
  start_at_time?: string;
  end_at_date?: string;
  end_at_time?: string;
  good_pieces?: number | "";
  bad_pieces?: number | "";
};

export default function CreateTask({ operationId, show, onClose, onCreateSuccess }: CreateTaskProps) {
  const todayDate = new Date().toISOString().slice(0, 10);

  const [task, setTask] = useState<TaskForm>({
    process_type: "",
    operator: "",
    start_at_date: todayDate,
    start_at_time: "",
    end_at_date: todayDate,
    end_at_time: "",
    good_pieces: "",
    bad_pieces: "",
  });

  const [showOptionals, setShowOptionals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  useEffect(() => {
    if (show) {
      setTask({
        process_type: "",
        operator: "",
        start_at_date: todayDate,
        start_at_time: "",
        end_at_date: todayDate,
        end_at_time: "",
        good_pieces: "",
        bad_pieces: "",
      });
      setShowOptionals(false);
      setError(null);
      setLoading(false);
    }
  }, [show, todayDate]);

  const localPartsToIso = (date: string, time: string) => {
    if (!date || !time) return null;
    return new Date(`${date}T${time}`).toISOString();
  };

  const buildPayload = (): TaskCreate => {
    if (!VALID_PROCESS_TYPES.includes(task.process_type as ProcessTypeStr)) {
      throw new Error("Tipo de processo inválido.");
    }

    const payload: any = { process_type: task.process_type as ProcessTypeStr };
    if (task.operator?.trim()) payload.operator = task.operator.trim();

    const startIso = task.start_at_date && task.start_at_time ? localPartsToIso(task.start_at_date, task.start_at_time) : null;
    const endIso = task.end_at_date && task.end_at_time ? localPartsToIso(task.end_at_date, task.end_at_time) : null;

    if (startIso) payload.start_at = startIso;
    if (endIso) payload.end_at = endIso;

    if (task.good_pieces !== "" && task.good_pieces !== undefined) payload.good_pieces = Number(task.good_pieces);
    if (task.bad_pieces !== "" && task.bad_pieces !== undefined) payload.bad_pieces = Number(task.bad_pieces);

    return payload as TaskCreate;
  };

  const handleCreate = async () => {
    setError(null);
    if (!task.process_type) {
      setError("O campo 'Tipo de Processo' é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload();
      const res = await fetch(`${API_URL}/operations/${operationId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Erro ao criar tarefa.";
        try {
          const data = await res.json();
          msg = data?.detail ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)) : JSON.stringify(data);
        } catch {
          msg = await res.text() || msg;
        }
        throw new Error(msg);
      }

      const createdTask: Task = await res.json();
      onCreateSuccess(createdTask);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erro inesperado ao criar tarefa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Nova Tarefa</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Tipo de Processo</Form.Label>
            <Form.Select value={task.process_type} onChange={(e) => setTask(prev => ({ ...prev, process_type: e.target.value }))}>
              <option value="">Selecione um tipo de processo</option>
              <option value="PREPARATION">Preparação de Máquina</option>
              <option value="QUALITY_CONTROL">Controlo de Qualidade</option>
              <option value="PROCESSING">Processamento</option>
            </Form.Select>

            <Form.Label className="mt-3">Operador</Form.Label>
            <Form.Control type="text" placeholder="Nome do operador" value={task.operator ?? ""} onChange={(e) => setTask(prev => ({ ...prev, operator: e.target.value }))} />
          </Form.Group>

          <div className="mb-2 d-flex justify-content-center">
            <Button variant="info" size="sm" onClick={() => setShowOptionals(s => !s)}>
              {showOptionals ? "Ocultar opcionais" : "Mostrar opcionais"}
            </Button>
          </div>

          {showOptionals && (
            <>
              <Row className="mb-3">
                <Col>
                  <Form.Label>Início</Form.Label>
                  <Form.Control type="date" value={task.start_at_date ?? todayDate} onChange={e => setTask(prev => ({ ...prev, start_at_date: e.target.value }))} />
                  <Form.Control type="time" value={task.start_at_time ?? ""} onChange={e => setTask(prev => ({ ...prev, start_at_time: e.target.value }))} />
                </Col>
                <Col>
                  <Form.Label>Fim</Form.Label>
                  <Form.Control type="date" value={task.end_at_date ?? todayDate} onChange={e => setTask(prev => ({ ...prev, end_at_date: e.target.value }))} />
                  <Form.Control type="time" value={task.end_at_time ?? ""} onChange={e => setTask(prev => ({ ...prev, end_at_time: e.target.value }))} />
                </Col>
              </Row>

              <Row className="mb-2">
                <Col>
                  <Form.Label>Peças Boas</Form.Label>
                  <Form.Control type="number" min={0} value={task.good_pieces === "" ? "" : String(task.good_pieces)} onChange={e => setTask(prev => ({ ...prev, good_pieces: e.target.value === "" ? "" : Number(e.target.value) }))} />
                </Col>
                <Col>
                  <Form.Label>Peças Ruins</Form.Label>
                  <Form.Control type="number" min={0} value={task.bad_pieces === "" ? "" : String(task.bad_pieces)} onChange={e => setTask(prev => ({ ...prev, bad_pieces: e.target.value === "" ? "" : Number(e.target.value) }))} />
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="primary" onClick={handleCreate} disabled={loading}>{loading ? <Spinner size="sm" animation="border" /> : "Criar"}</Button>
      </Modal.Footer>
    </Modal>
  );
}
