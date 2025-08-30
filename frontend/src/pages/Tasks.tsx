import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button, Spinner, Alert, Row, Col, Card, Form, InputGroup } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import { type Task, formatDateTime, processTypeLabels } from "../utils/Types";
import EditTask from "../components/EditTask";

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

  // counters / inputs always visible (moved below button)
  const [goodPieces, setGoodPieces] = useState<number | "">("");
  const [badPieces, setBadPieces] = useState<number | "">("");
  const [numBenches, setNumBenches] = useState<number | "">("");
  const [numMachines, setNumMachines] = useState<number | "">("");
  const [notes, setNotes] = useState<string>("");

  // timer
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editFieldKey, setEditFieldKey] = useState<string>("");
  const [editLabel, setEditLabel] = useState<string>("");
  const [editInitial, setEditInitial] = useState<any>(null);

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

        // populate local editable fields
        setGoodPieces(data.good_pieces ?? "");
        setBadPieces(data.bad_pieces ?? "");
        setNumBenches(data.num_benches ?? "");
        setNumMachines(data.num_machines ?? "");
        setNotes(data.notes ?? "");

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
        clearInterval(timerRef.current);
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

  const handleSaveAll = async () => {
    if (!task) return;
    try {
      setLoading(true);
      const payload: Partial<Task> = {
        good_pieces: typeof goodPieces === "number" ? goodPieces : null,
        bad_pieces: typeof badPieces === "number" ? badPieces : null,
        num_benches: typeof numBenches === "number" ? numBenches : null,
        num_machines: typeof numMachines === "number" ? numMachines : null,
        notes: notes === "" ? null : notes,
      };
      const updated = await updateTaskOnServer(payload);
      setTask(updated);
      // sync local fields
      setGoodPieces(updated.good_pieces ?? "");
      setBadPieces(updated.bad_pieces ?? "");
      setNumBenches(updated.num_benches ?? "");
      setNumMachines(updated.num_machines ?? "");
      setNotes(updated.notes ?? "");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
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
    setGoodPieces(updated.good_pieces ?? "");
    setBadPieces(updated.bad_pieces ?? "");
    setNumBenches(updated.num_benches ?? "");
    setNumMachines(updated.num_machines ?? "");
    setNotes(updated.notes ?? "");
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

  // small helper for counters
  const inc = (setter: (v: any) => void, step = 1) => setter((prev: any) => (prev === "" || prev === null ? step : Math.max(0, Number(prev) + step)));
  const dec = (setter: (v: any) => void, step = 1) => setter((prev: any) => (prev === "" || prev === null ? 0 : Math.max(0, Number(prev) - step)));

  return (
    <div className="p-3 position-relative" style={{ height: "100%" }}>
      <Button variant="light" className="mb-3 d-flex align-items-center" onClick={() => navigate(-1)}>
        <ArrowLeft className="me-2" /> Voltar
      </Button>

      <Row className="mb-4 text-center justify-content-center gx-3">
        {[
          { key: "process_type", label: "Tipo de Processo", value: processedLabel },
          { key: "start_at", label: "Início", value: formatDateTime(task.start_at) },
          { key: "end_at", label: "Fim", value: formatDateTime(task.end_at) },
          { key: "operator", label: "Operador", value: task.operator_user?.name ?? "Sem Operador" },
        ].map(({ key, label, value }, idx) => (
          <Col key={idx} xs={12} sm={4} md={2}>
            <Card className="p-3" style={{ cursor: "pointer" }} onClick={() => openEditModal(String(key), label === "Fim" || label === "Início" ? "Data/Tempo" : label, value === "" ? "" : value)}>
              <Card.Title style={{ fontSize: "0.9rem" }}>{label}</Card.Title>
              <Card.Text style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{value}</Card.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <EditTask show={showEdit} onHide={() => setShowEdit(false)} apiUrl={API_URL} taskId={task.id} fieldKey={editFieldKey} label={editLabel} initialValue={editInitial} onSaved={handleTaskSaved} />

      <div className="text-center mb-4">
        <Button
          variant={btnVariant}
          size="lg"
          style={{ width: "400px", height: "120px", fontSize: "2rem", fontWeight: "bold" }}
          onClick={handleStartStop}
          disabled={Boolean(loading) || (Boolean(task.start_at) && Boolean(task.end_at))}
        >
          {btnLabel}
          <br />
          {formatDuration(timerSeconds)}
        </Button>
      </div>

      {/* Fields directly below the big button */}
      <Form onSubmit={(e) => { e.preventDefault(); handleSaveAll(); }}>
        <Row className="mb-2">
          <Col md={6}>
            <Form.Label>Peças Boas</Form.Label>
            <InputGroup>
              <Button variant="outline-secondary" onClick={() => dec(setGoodPieces)}>-</Button>
              <Form.Control type="number" min={0} value={goodPieces} onChange={(e) => setGoodPieces(e.target.value === "" ? "" : Number(e.target.value))} />
              <Button variant="outline-secondary" onClick={() => inc(setGoodPieces)}>+</Button>
            </InputGroup>
          </Col>

          <Col md={6}>
            <Form.Label>Peças Defeituosas</Form.Label>
            <InputGroup>
              <Button variant="outline-secondary" onClick={() => dec(setBadPieces)}>-</Button>
              <Form.Control type="number" min={0} value={badPieces} onChange={(e) => setBadPieces(e.target.value === "" ? "" : Number(e.target.value))} />
              <Button variant="outline-secondary" onClick={() => inc(setBadPieces)}>+</Button>
            </InputGroup>
          </Col>
        </Row>

        <Row className="mb-2">
          <Col md={6}>
            <Form.Label>Bancadas</Form.Label>
            <InputGroup>
              <Button variant="outline-secondary" onClick={() => dec(setNumBenches)}>-</Button>
              <Form.Control type="number" min={0} value={numBenches} onChange={(e) => setNumBenches(e.target.value === "" ? "" : Number(e.target.value))} />
              <Button variant="outline-secondary" onClick={() => inc(setNumBenches)}>+</Button>
            </InputGroup>
          </Col>

          <Col md={6}>
            <Form.Label>Máquinas</Form.Label>
            <InputGroup>
              <Button variant="outline-secondary" onClick={() => dec(setNumMachines)}>-</Button>
              <Form.Control type="number" min={0} value={numMachines} onChange={(e) => setNumMachines(e.target.value === "" ? "" : Number(e.target.value))} />
              <Button variant="outline-secondary" onClick={() => inc(setNumMachines)}>+</Button>
            </InputGroup>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <Form.Label>Observações</Form.Label>
            <Form.Control as="textarea" rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas do operador (máx. 1000 caracteres)" />
          </Col>
        </Row>

        <div className="d-flex justify-content-center">
          <Button type="submit" variant="success" disabled={loading}>Salvar</Button>
        </div>
      </Form>
    </div>
  );
}
