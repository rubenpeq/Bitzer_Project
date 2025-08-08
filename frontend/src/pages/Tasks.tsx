import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button, Spinner, Alert, Row, Col, Card, Form } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import type { Task } from "../utils/Types";

const processTypeLabels: Record<string, string> = {
  qc: "Controlo de Qualidade",
  processing: "Processamento",
  prep: "Preparação de Máquina",
};

/** --- Helpers --- **/
const formatLocalTime = (d: Date) => {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);

  const [goodPiecesInput, setGoodPiecesInput] = useState<number | "">("");
  const [badPiecesInput, setBadPiecesInput] = useState<number | "">("");

  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  useEffect(() => {
    if (!taskId) {
      setError("Task ID inválido");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchTask = async () => {
      try {
        const res = await fetch(`${API_URL}/task/${taskId}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erro ao buscar tarefa: ${res.status} ${text}`);
        }
        const data = await res.json();

        // Map backend field names to frontend Task shape
        const mapped: Task = {
          id: data.id,
          operation_id: data.operation_id,
          process_type: data.process_type,
          date: data.date,
          start_time: data.start_time ?? null,
          end_time: data.end_time ?? null,
          good_pieces: data.goodpcs ?? null,
          bad_pieces: data.badpcs ?? null,
        };

        setTask(mapped);
        setGoodPiecesInput(mapped.good_pieces ?? "");
        setBadPiecesInput(mapped.bad_pieces ?? "");
      } catch (err: any) {
        setError(err.message || "Erro inesperado ao buscar tarefa");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId, API_URL]);

  const handleStartStop = async () => {
    if (!task) return;
    setError(null);

    // Determine value to patch
    if (!task.start_time) {
      const now = formatLocalTime(new Date());
      try {
        const res = await fetch(`${API_URL}/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start_time: now }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erro ao iniciar: ${res.status} ${text}`);
        }
        // update local state
        setTask((t) => (t ? { ...t, start_time: now } : t));
      } catch (err: any) {
        setError(err.message || "Erro ao iniciar a tarefa");
      }
    } else if (!task.end_time) {
      const now = formatLocalTime(new Date());
      try {
        const res = await fetch(`${API_URL}/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ end_time: now }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erro ao parar: ${res.status} ${text}`);
        }
        setTask((t) => (t ? { ...t, end_time: now } : t));
      } catch (err: any) {
        setError(err.message || "Erro ao parar a tarefa");
      }
    }
  };

  const handleSavePieces = async () => {
    if (!task) return;
    setError(null);

    // Validate numeric
    const goodVal =
      typeof goodPiecesInput === "number" ? goodPiecesInput : null;
    const badVal = typeof badPiecesInput === "number" ? badPiecesInput : null;

    try {
      const res = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goodpcs: goodVal, badpcs: badVal }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao salvar peças: ${res.status} ${text}`);
      }
      // update local state
      setTask((t) =>
        t ? { ...t, good_pieces: goodVal, bad_pieces: badVal } : t
      );
    } catch (err: any) {
      setError(err.message || "Erro ao salvar as peças");
    }
  };

  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spinner animation="border" />
      </div>
    );

  if (error) return <Alert variant="danger">{error}</Alert>;

  if (!task) return <Alert variant="danger">Tarefa não encontrada</Alert>;

  const processLabel =
    processTypeLabels[task.process_type] ?? task.process_type ?? "-";

  const piecesEditable = Boolean(task.start_time && task.end_time);

  return (
    <div className="p-3 position-relative" style={{ height: "100%" }}>
      <Button
        variant="light"
        className="mb-3 d-flex align-items-center"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="me-2" />
        Voltar
      </Button>

      {/* Task Info */}
      <Row className="mb-4 text-center justify-content-center gx-3">
        {[
          { label: "Data", value: task.date },
          { label: "Tipo de Processo", value: processLabel },
          { label: "Início", value: task.start_time ?? "--:--:--" },
          { label: "Fim", value: task.end_time ?? "--:--:--" },
        ].map(({ label, value }, idx) => (
          <Col key={idx} xs={12} sm={4} md={2}>
            <Card className="p-3">
              <Card.Title style={{ fontSize: "0.9rem" }}>{label}</Card.Title>
              <Card.Text style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                {value}
              </Card.Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Start/Stop Button */}
      <div className="text-center mb-4">
        <Button
          variant={task.start_time && !task.end_time ? "danger" : "primary"}
          size="lg"
          style={{ width: "200px" }}
          onClick={handleStartStop}
        >
          {!task.start_time
            ? "Iniciar"
            : !task.end_time
            ? "Parar"
            : "Concluído"}
        </Button>
      </div>

      {/* Pieces Inputs */}
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleSavePieces();
        }}
      >
        <Form.Group className="mb-3" controlId="goodPieces">
          <Form.Label>Peças Boas</Form.Label>
          <Form.Control
            type="number"
            value={goodPiecesInput}
            onChange={(e) =>
              setGoodPiecesInput(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            disabled={!piecesEditable}
            min={0}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="badPieces">
          <Form.Label>Peças Defetivas</Form.Label>
          <Form.Control
            type="number"
            value={badPiecesInput}
            onChange={(e) =>
              setBadPiecesInput(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            disabled={!piecesEditable}
            min={0}
          />
        </Form.Group>

        <div className="text-center">
          <Button type="submit" variant="success" disabled={!piecesEditable}>
            Salvar
          </Button>
        </div>
      </Form>
    </div>
  );
}
