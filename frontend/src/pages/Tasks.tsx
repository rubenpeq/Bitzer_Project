import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button, Spinner, Alert, Row, Col, Card, Form } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import { type Task, processTypeLabels } from "../utils/Types";
import EditTask from "../components/EditTask";

/** --- Helpers --- **/
const formatLocalTime = (d: Date) => {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

const formatDuration = (seconds: number) => {
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  return [hh, mm, ss].map((v) => String(v).padStart(2, "0")).join(":");
};

const parseTimeToSeconds = (timeStr?: string | null): number => {
  if (!timeStr) return 0;
  const main = String(timeStr).split(".")[0];
  const parts = main.split(":").map((p) => Number(p));
  if (parts.length < 3) return 0;
  const [hh, mm, ss] = parts;
  if ([hh, mm, ss].some((n) => Number.isNaN(n))) return 0;
  return hh * 3600 + mm * 60 + ss;
};

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);

  const [goodPiecesInput, setGoodPiecesInput] = useState<number | "">("");
  const [badPiecesInput, setBadPiecesInput] = useState<number | "">("");

  // timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editFieldKey, setEditFieldKey] = useState<string>("");
  const [editLabel, setEditLabel] = useState<string>("");
  const [editInitial, setEditInitial] = useState<any>(null);

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
        setTask(data);
        setGoodPiecesInput(data.good_pieces ?? "");
        setBadPiecesInput(data.bad_pieces ?? "");

        // initialize timerSeconds
        if (data.start_time) {
          const startSec = parseTimeToSeconds(data.start_time);
          if (data.end_time) {
            const endSec = parseTimeToSeconds(data.end_time);
            setTimerSeconds(Math.max(0, endSec - startSec));
          } else {
            const now = new Date();
            const nowSec =
              now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
            setTimerSeconds(Math.max(0, nowSec - startSec));
          }
        } else {
          setTimerSeconds(0);
        }
      } catch (err: any) {
        setError(err.message || "Erro inesperado ao buscar tarefa");
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

  // Manage timer interval: when task.start_time exists and end_time is null => run timer
  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (task?.start_time && !task?.end_time) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [task?.start_time, task?.end_time]);

  // unified update wrapper: uses your current API (PUT /tasks/{id})
  const updateTaskOnServer = async (payload: Record<string, any>) => {
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
    const data = await res.json();
    return data as Task;
  };

  const handleStartStop = async () => {
    if (!task) return;
    setError(null);

    if (!task.start_time) {
      // start
      const now = formatLocalTime(new Date());
      try {
        setLoading(true);
        const updated = await updateTaskOnServer({ start_time: now });
        setTask(updated);
        setTimerSeconds(0);
      } catch (err: any) {
        setError(err.message || "Erro ao iniciar a tarefa");
      } finally {
        setLoading(false);
      }
    } else if (!task.end_time) {
      // stop
      const now = formatLocalTime(new Date());
      try {
        setLoading(true);
        const updated = await updateTaskOnServer({ end_time: now });
        setTask(updated);

        const startSec = parseTimeToSeconds(updated.start_time);
        const endSec = parseTimeToSeconds(updated.end_time);
        setTimerSeconds(Math.max(0, endSec - startSec));
      } catch (err: any) {
        setError(err.message || "Erro ao parar a tarefa");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSavePieces = async () => {
    if (!task) return;
    setError(null);

    const goodVal = typeof goodPiecesInput === "number" ? goodPiecesInput : null;
    const badVal = typeof badPiecesInput === "number" ? badPiecesInput : null;

    try {
      setLoading(true);
      // PUT /tasks/{id} expects TaskUpdate shape; send only changed fields
      const updated = await updateTaskOnServer({
        good_pieces: goodVal,
        bad_pieces: badVal,
      });
      setTask(updated);
      setGoodPiecesInput(updated.good_pieces ?? "");
      setBadPiecesInput(updated.bad_pieces ?? "");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar as peças");
    } finally {
      setLoading(false);
    }
  };

  // open edit modal for a single field
  const openEditModal = (fieldKey: string, label: string, initial: any) => {
    setEditFieldKey(fieldKey);
    setEditLabel(label);
    setEditInitial(initial);
    setShowEdit(true);
  };

  // handler after EditTask returns updated task
  const handleTaskSaved = (updated: Task) => {
    setTask(updated);
    // keep inputs consistent
    setGoodPiecesInput(updated.good_pieces ?? "");
    setBadPiecesInput(updated.bad_pieces ?? "");
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
  const piecesEditable = Boolean(task.start_time && task.end_time);

  let btnVariant: "success" | "danger" | "primary" = "success";
  let btnLabel = "Iniciar";
  if (!task.start_time) {
    btnVariant = "success";
    btnLabel = "Iniciar";
  } else if (task.start_time && !task.end_time) {
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

      {/* Task Info — click individual card to edit that single field */}
      <Row className="mb-4 text-center justify-content-center gx-3">
        {[
          { key: "date", label: "Data", value: task.date },
          { key: "process_type", label: "Tipo de Processo", value: processedLabel },
          { key: "start_time", label: "Início", value: task.start_time ?? "--:--:--" },
          { key: "end_time", label: "Fim", value: task.end_time ?? "--:--:--" },
          { key: "operator", label: "Operador", value: task.operator ?? "Sem Operador" },
        ].map(({ key, label, value }, idx) => (
          <Col key={idx} xs={12} sm={4} md={2}>
            <Card className="p-3" style={{ cursor: "pointer" }} onClick={() => openEditModal(String(key), label, value === "--:--:--" ? "" : value)}>
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
        onSaved={(updatedTask) => {
          handleTaskSaved(updatedTask);
          setShowEdit(false);
        }}
      />

      {/* Start/Stop Button */}
      <div className="text-center mb-4">
        <Button
          variant={btnVariant}
          size="lg"
          style={{
            width: "400px",
            height: "120px",
            fontSize: "2rem",
            fontWeight: "bold",
          }}
          onClick={handleStartStop}
          disabled={Boolean(loading) || (Boolean(task.start_time) && Boolean(task.end_time))}
        >
          {btnLabel}
          <br />
          {formatDuration(timerSeconds)}
        </Button>
      </div>

      {/* Pieces Inputs — very small centered row */}
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
