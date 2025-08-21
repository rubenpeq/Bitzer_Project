// src/components/CreateTask.tsx
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

// UI form shape (permissive so we can store "")
type TaskForm = {
  process_type: string; // plain string for UI; validated on submit
  operator?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  good_pieces?: number | "";
  bad_pieces?: number | "";
};

export default function CreateTask({
  operationId,
  show,
  onClose,
  onCreateSuccess,
}: CreateTaskProps) {
  const todayDate = new Date().toISOString().slice(0, 10);

  const [task, setTask] = useState<TaskForm>({
    process_type: "",
    operator: "",
    date: todayDate,
    start_time: "",
    end_time: "",
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
        date: todayDate,
        start_time: "",
        end_time: "",
        good_pieces: "",
        bad_pieces: "",
      });
      setShowOptionals(false);
      setError(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, todayDate]);

  // Convert and clean TaskForm -> TaskCreate
  const buildPayload = (): TaskCreate => {
    // Validate process type
    if (!VALID_PROCESS_TYPES.includes(task.process_type as ProcessTypeStr)) {
      throw new Error("Tipo de processo inválido.");
    }

    const payload: any = {
      process_type: task.process_type as ProcessTypeStr,
    };

    if (task.operator && task.operator.trim() !== "") payload.operator = task.operator.trim();
    if (task.date && task.date.trim() !== "") payload.date = task.date;
    if (task.start_time && task.start_time.trim() !== "") payload.start_time = task.start_time;
    if (task.end_time && task.end_time.trim() !== "") payload.end_time = task.end_time;

    if (task.good_pieces !== "" && task.good_pieces !== undefined) {
      const gp = Number(task.good_pieces);
      if (!Number.isNaN(gp)) payload.good_pieces = gp;
    }
    if (task.bad_pieces !== "" && task.bad_pieces !== undefined) {
      const bp = Number(task.bad_pieces);
      if (!Number.isNaN(bp)) payload.bad_pieces = bp;
    }

    return payload as TaskCreate;
  };

  const handleCreate = async () => {
    setError(null);

    // Basic validation (process_type required)
    if (!task.process_type || task.process_type.trim() === "") {
      setError("O campo 'Tipo de Processo' é obrigatório.");
      return;
    }
    if (!VALID_PROCESS_TYPES.includes(task.process_type as ProcessTypeStr)) {
      setError("Tipo de processo inválido.");
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload();

      // NOTE: new endpoint per your backend: POST /operations/{operation_id}/tasks
      const res = await fetch(`${API_URL}/operations/${operationId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // try to surface backend error details (Pydantic / FastAPI will often put explanation in JSON)
        let msg = "Erro ao criar tarefa.";
        try {
          const data = await res.json();
          // common FastAPI error shape: {"detail": "..."} or validation errors array
          if (data?.detail) {
            msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
          } else {
            msg = JSON.stringify(data);
          }
        } catch {
          const txt = await res.text();
          msg = txt || msg;
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
            <Form.Select
              value={task.process_type}
              onChange={(e) =>
                setTask((prev) => ({ ...prev, process_type: e.target.value }))
              }
            >
              <option value="">Selecione um tipo de processo</option>
              <option value="PREPARATION">Preparação de Máquina</option>
              <option value="QUALITY_CONTROL">Controlo de Qualidade</option>
              <option value="PROCESSING">Processamento</option>
            </Form.Select>

            <Form.Label className="mt-3">Operador</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nome do operador"
              value={task.operator ?? ""}
              onChange={(e) =>
                setTask((prev) => ({ ...prev, operator: e.target.value }))
              }
            />
          </Form.Group>

          <div className="mb-2">
            <div className="d-flex justify-content-center">
              <Button
                variant="info"
                size="sm"
                onClick={() => setShowOptionals((s) => !s)}
              >
                {showOptionals ? "Ocultar opcionais" : "Mostrar opcionais"}
              </Button>
            </div>
          </div>

          {showOptionals && (
            <>
              <Row className="mb-3">
                <Col>
                  <Form.Label>Data</Form.Label>
                  <Form.Control
                    type="date"
                    value={task.date ?? todayDate}
                    onChange={(e) =>
                      setTask((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                </Col>
                <Col>
                  <Form.Label>Início</Form.Label>
                  <Form.Control
                    type="time"
                    value={task.start_time ?? ""}
                    onChange={(e) =>
                      setTask((prev) => ({ ...prev, start_time: e.target.value }))
                    }
                  />
                </Col>
                <Col>
                  <Form.Label>Fim</Form.Label>
                  <Form.Control
                    type="time"
                    value={task.end_time ?? ""}
                    onChange={(e) =>
                      setTask((prev) => ({ ...prev, end_time: e.target.value }))
                    }
                  />
                </Col>
              </Row>

              <Row className="mb-2">
                <Col>
                  <Form.Label>Peças Boas</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={task.good_pieces === "" ? "" : String(task.good_pieces)}
                    onChange={(e) =>
                      setTask((prev) => ({
                        ...prev,
                        good_pieces:
                          e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                  />
                </Col>
                <Col>
                  <Form.Label>Peças Ruins</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={task.bad_pieces === "" ? "" : String(task.bad_pieces)}
                    onChange={(e) =>
                      setTask((prev) => ({
                        ...prev,
                        bad_pieces:
                          e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                  />
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleCreate} disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : "Criar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
