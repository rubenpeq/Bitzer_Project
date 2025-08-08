import { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import type { Task, TaskCreate } from "../utils/Types";

type CreateTaskProps = {
  operationId: number;
  show: boolean;
  onClose: () => void;
  onCreateSuccess: (newTask: Task) => void;
};

export default function CreateTask({
  operationId,
  show,
  onClose,
  onCreateSuccess,
}: CreateTaskProps) {
  // helper for today's date in YYYY-MM-DD
  const todayDate = new Date().toISOString().slice(0, 10);

  // form state (optional fields may be undefined)
  const [task, setTask] = useState<TaskCreate>({
    process_type: "",
    date: todayDate,
  });

  const [showOptionals, setShowOptionals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  // Reset form whenever modal opens/closes
  useEffect(() => {
    if (show) {
      setTask({
        process_type: "",
        date: todayDate, // default date set to today
      });
      setShowOptionals(false);
      setError(null);
      setLoading(false);
    }
  }, [show, todayDate]);

  const cleanPayload = (payload: TaskCreate) => {
    // Remove empty-string properties, keep numbers & defined values.
    const copy: any = { ...payload };
    // If date is empty string or undefined, delete it
    if (!copy.date) delete copy.date;
    if (!copy.start_time) delete copy.start_time;
    if (!copy.end_time) delete copy.end_time;
    if (copy.good_pieces === "" || copy.good_pieces === undefined)
      delete copy.good_pieces;
    if (copy.bad_pieces === "" || copy.bad_pieces === undefined)
      delete copy.bad_pieces;
    return copy;
  };

  const handleCreate = async () => {
    setError(null);

    // Basic validation
    if (!task.process_type || task.process_type.trim() === "") {
      setError("O campo 'Tipo de Processo' é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      const payload = cleanPayload(task);
      console.log(payload)

      const res = await fetch(`${API_URL}/create-task/${operationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // try to parse JSON error, fallback to text
        let msg = "Erro ao criar tarefa.";
        try {
          const data = await res.json();
          msg = data.detail || JSON.stringify(data) || msg;
        } catch {
          const txt = await res.text();
          msg = txt || msg;
        }
        throw new Error(msg);
      }

      const createdTask = await res.json();
      onCreateSuccess(createdTask);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao criar tarefa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Nova Tarefa</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form>
          {/* Process type (required) */}
          <Form.Group className="mb-3">
            <Form.Label>Tipo de Processo</Form.Label>
            <Form.Select
              value={task.process_type}
              onChange={(e) =>
                setTask((prev) => ({ ...prev, process_type: e.target.value }))
              }
            >
              <option value="" disabled>
                Selecione um tipo de processo
              </option>
              <option value="PREPARATION">Preparação de Máquina</option>
              <option value="QUALITY_CONTROL">Controlo de Qualidade</option>
              <option value="PROCESSING">Processamento</option>
            </Form.Select>
          </Form.Group>

          {/* Toggle optionals */}
          <div className="mb-2">
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowOptionals((s) => !s)}
            >
              {showOptionals ? "Ocultar opcionais" : "Mostrar opcionais"}
            </Button>
          </div>

          {/* Optionals block */}
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
                      setTask((prev) => ({
                        ...prev,
                        start_time: e.target.value,
                      }))
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
                    value={
                      task.good_pieces === undefined
                        ? ""
                        : String(task.good_pieces)
                    }
                    onChange={(e) =>
                      setTask((prev) => ({
                        ...prev,
                        good_pieces:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      }))
                    }
                  />
                </Col>
                <Col>
                  <Form.Label>Peças Ruins</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={
                      task.bad_pieces === undefined
                        ? ""
                        : String(task.bad_pieces)
                    }
                    onChange={(e) =>
                      setTask((prev) => ({
                        ...prev,
                        bad_pieces:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
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
