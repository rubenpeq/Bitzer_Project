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

import CreateTask, { type Task as TaskType } from "../components/CreateTask";

type Operation = {
  id: number;
  operation_code: string;
  machine_type: string;
  order_number: number;
};

type Task = {
  id: number;
  process_type: string;
  date: string;
  start_time: string;
  end_time: string;
  good_pieces: number;
  bad_pieces: number;
};

export default function OperationDetail() {
  const { operationId } = useParams<{ operationId: string }>();
  const navigate = useNavigate();

  const [operation, setOperation] = useState<Operation | null>(null);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Task;
    direction: "asc" | "desc";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/operations/${operationId}`).then((res) => {
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
        setTasks(taskData);
        setFilteredTasks(taskData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [operationId]);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return setFilteredTasks(tasks);
    setFilteredTasks(
      tasks.filter(
        (t) =>
          t.process_type.toLowerCase().includes(term) || t.date.includes(term)
      )
    );
  }, [searchTerm, tasks]);

  const sortedTasks = useMemo(() => {
    if (!sortConfig) return filteredTasks;
    return [...filteredTasks].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key]?.toString().toLowerCase();
      let bVal = b[key]?.toString().toLowerCase();

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortConfig]);

  const handleSort = (key: keyof Task) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleCreateSuccess = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
    setFilteredTasks((prev) => [...prev, newTask]);
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

  if (!operation)
    return <Alert variant="danger">Operação não encontrada</Alert>;

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
        ].map(({ label, value }, idx) => (
          <Col key={idx} xs={12} sm={6} md={3}>
            <Card className="p-3">
              <Card.Title style={{ fontSize: "0.9rem" }}>{label}</Card.Title>
              <Card.Text style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                {value}
              </Card.Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Search Bar */}
      <Form.Control
        type="search"
        placeholder="Pesquisar tarefas..."
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
                {[
                  "process_type",
                  "date",
                  "start_time",
                  "end_time",
                  "good_pieces",
                  "bad_pieces",
                ].map((key) => (
                  <th
                    key={key}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort(key as keyof Task)}
                  >
                    {key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
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
                <tr key={task.id}>
                  <td>{task.process_type}</td>
                  <td>{task.date}</td>
                  <td>{task.start_time}</td>
                  <td>{task.end_time}</td>
                  <td>{task.good_pieces}</td>
                  <td>{task.bad_pieces}</td>
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
