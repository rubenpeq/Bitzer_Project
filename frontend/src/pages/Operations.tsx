import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Spinner,
  Alert,
  Button,
  Row,
  Col,
  Card,
  Form,
} from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import { processTypeLabels, type Operation, type Task } from "../utils/Types";
import CreateTask from "../components/CreateTask";

export default function OperationDetail() {
  const { operationId } = useParams<{ operationId: string }>();
  const navigate = useNavigate();

  const [operation, setOperation] = useState<Operation | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Task | "operator";
    direction: "asc" | "desc";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${API_URL}/operation/${operationId}`).then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar operação");
        return res.json();
      }),
      fetch(`${API_URL}/operations/${operationId}/tasks`).then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar tarefas");
        return res.json();
      }),
    ])
      .then(([operationData, taskData]) => {
        setOperation(operationData);
        // normalize tasks from backend to UI shape if needed; for now we trust backend shape
        const normalized: Task[] = (taskData ?? []).map((t: any) => t);
        setTasks(normalized);
        setFilteredTasks(normalized);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Erro ao buscar dados");
      })
      .finally(() => setLoading(false));
  }, [operationId, API_URL]);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredTasks(tasks);
      return;
    }

    const contains = (val: any) =>
      val !== undefined && val !== null && String(val).toLowerCase().includes(term);

    setFilteredTasks(
      tasks.filter((t) => {
        return (
          contains(t.process_type) ||
          contains(t.date) ||
          contains(t.operator)
        );
      })
    );
  }, [searchTerm, tasks, operation]);

  // Double click to task details
  const handleRowDoubleClick = (taskId: number) => {
    navigate(`/task/${taskId}`);
  };

  // Table Headers: added operator column
  const taskHeaders: { key: keyof Task | "operator"; label: string }[] = [
    { key: "process_type", label: "Tipo de Processo" },
    { key: "date", label: "Data" },
    { key: "start_time", label: "Início" },
    { key: "end_time", label: "Fim" },
    { key: "good_pieces", label: "Peças Boas" },
    { key: "bad_pieces", label: "Peças Defetivas" },
    { key: "operator", label: "Operador" },
  ];

  const sortedTasks = useMemo(() => {
    if (!sortConfig) return filteredTasks;
    return [...filteredTasks].sort((a, b) => {
      const { key, direction } = sortConfig;

      // safe access (some keys may be "operator" or Task fields)
      const aRaw = (a as any)[key] ?? "";
      const bRaw = (b as any)[key] ?? "";

      const aVal = String(aRaw).toLowerCase();
      const bVal = String(bRaw).toLowerCase();

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortConfig]);

  const handleSort = (key: keyof Task | "operator") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // createdTaskRaw is whatever backend returned; normalize it before using
  const handleCreateSuccess = (createdTaskRaw: Task | any) => {
    const normalized = createdTaskRaw;
    setTasks((prev) => [...prev, normalized]);
    setFilteredTasks((prev) => [...prev, normalized]);
    setShowModal(false);
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

  if (!operation) return <Alert variant="danger">Operação não encontrada</Alert>;

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

      {/* Operation Header */}
      <Row className="mb-4 gx-3 text-center justify-content-center">
        {[
          { label: "Nº Ordem", value: operation.order_number },
          { label: "Código Operação", value: operation.operation_code },
          { label: "Tipo Máquina", value: operation.machine_type },
          { label: "Machine ID", value: operation.machine_location },
        ].map(({ label, value }, idx) => (
          <Col key={idx} xs={12} sm={6} md={3}>
            <Card className="p-3">
              <Card.Title style={{ fontSize: "0.9rem" }}>{label}</Card.Title>
              <Card.Text style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                {value ?? "-"}
              </Card.Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Search Bar */}
      <Form.Control
        type="search"
        placeholder="Pesquisar tarefas... (tipo de processo, data ou operador)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-3"
      />

      {/* Tasks Table */}
      {sortedTasks.length === 0 ? (
        <Alert variant="warning">Nenhuma tarefa encontrada.</Alert>
      ) : (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                {taskHeaders.map(({ key, label }) => (
                  <th
                    key={label}
                    style={{ cursor: "pointer", textAlign: "center" }}
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    {sortConfig?.key === key
                      ? sortConfig.direction === "asc"
                        ? " ▲"
                        : " ▼"
                      : ""}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedTasks.map((task) => (
                <tr
                  key={task.id}
                  onDoubleClick={() => handleRowDoubleClick(task.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{processTypeLabels[task.process_type] ?? task.process_type}</td>
                  <td>{task.date}</td>
                  <td>{task.start_time ?? "--:--:--"}</td>
                  <td>{task.end_time ?? "--:--:--"}</td>
                  <td>{task.good_pieces ?? "-"}</td>
                  <td>{task.bad_pieces ?? "-"}</td>
                  <td>{task.operator ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Floating Button */}
      <Button
        variant="success"
        className="position-fixed"
        size="lg"
        style={{ bottom: "20px", right: "20px", zIndex: 1050 }}
        onClick={() => setShowModal(true)}
      >
        + Nova Tarefa
      </Button>

      <CreateTask
        operationId={Number(operationId)}
        show={showModal}
        onClose={() => setShowModal(false)}
        onCreateSuccess={handleCreateSuccess}
      />
    </div>
  );
}
