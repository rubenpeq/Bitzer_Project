import { useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";

export type TaskCreate = {
  process_type: string;
  date: string;
  start_time: string;
  end_time: string;
  good_pieces: number;
  bad_pieces: number;
};

export type Task = TaskCreate & {
  id: number;
};

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
const [task, setTask] = useState<TaskCreate>({
  process_type: "",
  date: "",
  start_time: "",
  end_time: "",
  good_pieces: 0,
  bad_pieces: 0,
});


  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  const handleCreate = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/operations/${operationId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Erro ao criar tarefa.");
      }

      const createdTask = await res.json();
      onCreateSuccess(createdTask);
      onClose();
      setTask({
        process_type: "",
        date: "",
        start_time: "",
        end_time: "",
        good_pieces: 0,
        bad_pieces: 0,
      });
    } catch (err: any) {
      setError(err.message);
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
          <Form.Group className="mb-3">
            <Form.Label>Tipo de Processo</Form.Label>
            <Form.Control
              type="text"
              value={task.process_type}
              onChange={(e) =>
                setTask({ ...task, process_type: e.target.value })
              }
            />
          </Form.Group>
          <Row className="mb-3">
            <Col>
              <Form.Label>Data</Form.Label>
              <Form.Control
                type="date"
                value={task.date}
                onChange={(e) => setTask({ ...task, date: e.target.value })}
              />
            </Col>
            <Col>
              <Form.Label>Início</Form.Label>
              <Form.Control
                type="time"
                value={task.start_time}
                onChange={(e) =>
                  setTask({ ...task, start_time: e.target.value })
                }
              />
            </Col>
            <Col>
              <Form.Label>Fim</Form.Label>
              <Form.Control
                type="time"
                value={task.end_time}
                onChange={(e) => setTask({ ...task, end_time: e.target.value })}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Label>Peças Boas</Form.Label>
              <Form.Control
                type="number"
                value={task.good_pieces}
                onChange={(e) =>
                  setTask({ ...task, good_pieces: Number(e.target.value) })
                }
              />
            </Col>
            <Col>
              <Form.Label>Peças Ruins</Form.Label>
              <Form.Control
                type="number"
                value={task.bad_pieces}
                onChange={(e) =>
                  setTask({ ...task, bad_pieces: Number(e.target.value) })
                }
              />
            </Col>
          </Row>
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
