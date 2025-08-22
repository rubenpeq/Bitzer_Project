import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button, Spinner, Alert, Row, Col, Card, Form } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import { type Task, processTypeLabels } from "../utils/Types";
import EditTask from "../components/EditTask";

// Helper to format a local time string from ISO
const formatLocalTime = (iso?: string | null) => {
  if (!iso) return "--:--:--";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--:--:--";
  return d.toLocaleTimeString();
};

// Compute duration in seconds between start_at and end_at (or now if ongoing)
const computeDurationSeconds = (task: Task) => {
  if (!task.start_at) return 0;
  const start = new Date(task.start_at).getTime();
  const end = task.end_at ? new Date(task.end_at).getTime() : Date.now();
  return Math.max(0, Math.floor((end - start) / 1000));
};

const formatDuration = (seconds: number) => {
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  return [hh, mm, ss].map((v) => String(v).padStart(2, "0")).join(":");
};

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [goodPiecesInput, setGoodPiecesInput] = useState<number | "">("");
  const [badPiecesInput, setBadPiecesInput] = useState<number | "">("");
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editFieldKey, setEditFieldKey] = useState<string>("");
  const [editLabel, setEditLabel] = useState<string>("");
  const [editInitial, setEditInitial] = useState<any>(null);

  // Fetch task
  useEffect(() => {
    if (!taskId) {
      setError("Task ID inválido");
      setLoading(false);
      return;
    }

    const fetchTask = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/task/${taskId}`);
        if (!res.ok) throw new Error(`Erro ao buscar tarefa: ${res.status}`);
        const data: Task = await res.json();
        setTask(data);
        setGoodPiecesInput(data.good_pieces ?? "");
        setBadPiecesInput(data.bad_pieces ?? "");
        setTimerSeconds(computeDurationSeconds(data));
      } catch (err: any) {
        setError(err.message || "Erro inesperado");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [taskId, API_URL]);

  // Timer interval
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (task?.start_at && !task?.end_at) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [task?.start_at, task?.end_at]);

  const updateTaskOnServer = async (payload: Partial<Task>) => {
    if (!task) throw new Error("Tarefa não carregada");
    const res = await fetch(`${API_URL}/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`(${res.status}) ${text}`);
    }
    return (await res.json()) as Task;
  };

  const handleStartStop = async () => {
    if (!task) return;
    setError(null);
    const nowIso = new Date().toISOString();

    try {
      setLoading(true);
      let updated: Task;
      if (!task.start_at) {
        updated = await updateTaskOnServer({ start_at: nowIso });
        setTimerSeconds(0);
      } else if (!task.end_at) {
        updated = await updateTaskOnServer({ end_at: nowIso });
        setTimerSeconds(computeDurationSeconds(updated));
      } else return;
      setTask(updated);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar tarefa");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePieces = async () => {
    if (!task) return;
    try {
      setLoading(true);
      const updated = await updateTaskOnServer({
        good_pieces: typeof goodPiecesInput === "number" ? goodPiecesInput : null,
        bad_pieces: typeof badPiecesInput === "number" ? badPiecesInput : null,
      });
      setTask(updated);
      setGoodPiecesInput(updated.good_pieces ?? "");
      setBadPiecesInput(updated.bad_pieces ?? "");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar peças");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (fieldKey: string, label: string, initial: any) => {
    setEditFieldKey(fieldKey);
    setEditLabel(label);
    setEditInitial(initial);
    setShowEdit(true);
  };

  const handleTaskSaved = (updated: Task) => {
    setTask(updated);
    setGoodPiecesInput(updated.good_pieces ?? "");
    setBadPiecesInput(updated.bad_pieces ?? "");
    setTimerSeconds(computeDurationSeconds(updated));
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" />
      </div>
    );

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!task) return <Alert variant="danger">Tarefa não encontrada</Alert>;

  const processedLabel = processTypeLabels[task.process_type] ?? task.process_type ?? "-";
  const piecesEditable = Boolean(task.start_at && task.end_at);

  let btnVariant: "success" | "danger" | "primary" = "success";
  let btnLabel = "Iniciar";
  if (!task.start_at) {
    btnVariant = "success";
    btnLabel = "Iniciar";
  } else if (task.start_at && !task.end_at) {
    btnVariant = "danger";
    btnLabel = "Parar";
  } else {
    btnVariant = "primary";
    btnLabel = "Concluído";
  }

  return (
    <div className="p-3 position-relative" style={{ height: "100%" }}>
      <Button variant="light" className="mb-3 d-flex align-items-center" onClick={() => navigate(-1)}>
        <ArrowLeft className="me-2" /> Voltar
      </Button>

      <Row className="mb-4 text-center justify-content-center gx-3">
        {[
          { key: "process_type", label: "Tipo de Processo", value: processedLabel },
          { key: "start_at", label: "Início", value: formatLocalTime(task.start_at) },
          { key: "end_at", label: "Fim", value: formatLocalTime(task.end_at) },
          { key: "operator", label: "Operador", value: task.operator ?? "Sem Operador" },
        ].map(({ key, label, value }, idx) => (
          <Col key={idx} xs={12} sm={4} md={2}>
            <Card
              className="p-3"
              style={{ cursor: "pointer" }}
              onClick={() => openEditModal(key, label, value === "--:--:--" ? "" : value)}
            >
              <Card.Title style={{ fontSize: "0.9rem" }}>{label}</Card.Title>
              <Card.Text style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{value}</Card.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <EditTask
        show={showEdit}
        onHide={() => setShowEdit(false)}
        apiUrl={API_URL}
        taskId={task.id}
        fieldKey={editFieldKey}
        label={editLabel}
        initialValue={editInitial}
        onSaved={handleTaskSaved}
      />

      <div className="text-center mb-4">
        <Button
          variant={btnVariant}
          size="lg"
          style={{ width: "400px", height: "120px", fontSize: "2rem", fontWeight: "bold" }}
          onClick={handleStartStop}
          disabled={loading || (Boolean(task.start_at) && Boolean(task.end_at))}
        >
          {btnLabel}
          <br />
          {formatDuration(timerSeconds)}
        </Button>
      </div>

      <div className="position-fixed start-0 end-0 p-3 shadow" style={{ bottom: "10px", zIndex: 1030 }}>
        <Form onSubmit={(e) => { e.preventDefault(); handleSavePieces(); }}>
          <Row className="justify-content-center align-items-end">
            <Col xs={4} sm={3} md={2}>
              <Form.Group controlId="goodPieces">
                <Form.Label className="w-100 text-center" style={{ fontSize: "0.85rem" }}>Peças Boas</Form.Label>
                <Form.Control
                  type="number"
                  value={goodPiecesInput}
                  onChange={(e) => setGoodPiecesInput(e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={!piecesEditable}
                  min={0}
                />
              </Form.Group>
            </Col>

            <Col xs={4} sm={3} md={2}>
              <Form.Group controlId="badPieces">
                <Form.Label className="w-100 text-center" style={{ fontSize: "0.85rem" }}>Peças Defetivas</Form.Label>
                <Form.Control
                  type="number"
                  value={badPiecesInput}
                  onChange={(e) => setBadPiecesInput(e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={!piecesEditable}
                  min={0}
                />
              </Form.Group>
            </Col>

            <Col xs="auto">
              <Button type="submit" variant="success" disabled={!piecesEditable}>Salvar</Button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}
