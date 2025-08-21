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
import EditOperationModal from "../components/EditOperation";

export default function OperationDetail() {
  const { operationId } = useParams<{ operationId: string }>();
  const navigate = useNavigate();

  const [operation, setOperation] = useState<Operation | null>(null);
  const [displayOrderNumber, setDisplayOrderNumber] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Task | "operator";
    direction: "asc" | "desc";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Edit operation modal state (we open it for a single field)
  const [showEditOp, setShowEditOp] = useState(false);
  const [editOpFieldKey, setEditOpFieldKey] = useState<"operation_code" | "machine_location">(
    "operation_code"
  );
  const [editOpInitial, setEditOpInitial] = useState<any>(null);

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
      .then(async ([operationData, taskData]) => {
        setOperation(operationData);
        const normalized: Task[] = (taskData ?? []).map((t: any) => t);
        setTasks(normalized);
        setFilteredTasks(normalized);

        // fetch order_number for display (operation.order_id -> find order)
        try {
          const ordersRes = await fetch(`${API_URL}/orders`);
          if (ordersRes.ok) {
            const orders = await ordersRes.json();
            const found = (orders ?? []).find((o: any) => Number(o.id) === Number(operationData.order_id));
            if (found && found.order_number) setDisplayOrderNumber(found.order_number);
            else setDisplayOrderNumber(null);
          }
        } catch {
          setDisplayOrderNumber(null);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Erro ao buscar dados");
      })
      .finally(() => setLoading(false));
  }, [operationId, API_URL]);

  // search/filter tasks
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredTasks(tasks);
      return;
    }
    const contains = (val: any) => val !== undefined && val !== null && String(val).toLowerCase().includes(term);
    setFilteredTasks(tasks.filter((t) => contains(t.process_type) || contains(t.date) || contains(t.operator)));
  }, [searchTerm, tasks]);

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
    if (sortConfig?.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  // Double click to task details
  const handleRowDoubleClick = (taskId: number) => {
    navigate(`/task/${taskId}`);
  };

  // Open edit modal for a single operation field
  const openEditForField = (field: "operation_code" | "machine_location", initialVal: any) => {
    setEditOpFieldKey(field);
    setEditOpInitial(initialVal);
    setShowEditOp(true);
  };

  // When operation edited, update local state and also refresh displayOrderNumber if needed
  const handleOperationSaved = async (updatedOp: Operation) => {
    setOperation(updatedOp);
    // if operation.order_id changed, refresh displayed order number
    try {
      const ordersRes = await fetch(`${API_URL}/orders`);
      if (ordersRes.ok) {
        const orders = await ordersRes.json();
        const found = (orders ?? []).find((o: any) => Number(o.id) === Number(updatedOp.order_id));
        if (found && found.order_number) setDisplayOrderNumber(found.order_number);
      }
    } catch {
      // ignore
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" />
      </div>
    );

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!operation) return <Alert variant="danger">Operação não encontrada</Alert>;

  // Header items: order number & machine type are informational only (not editable here).
  const headerItems = [
    { key: "order_number", label: "Nº Ordem", value: displayOrderNumber ?? operation.order_id, editable: false },
    { key: "operation_code", label: "Código Operação", value: operation.operation_code, editable: true },
    { key: "machine_type", label: "Tipo Máquina", value: operation.machine?.machine_type ?? "—", editable: false },
    { key: "machine_location", label: "Cen. Trabalho", value: operation.machine?.machine_location ?? "—", editable: true },
  ] as const;

  return (
    <div className="p-3 position-relative" style={{ height: "100%" }}>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <Button variant="light" className="d-flex align-items-center" onClick={() => navigate(-1)}>
          <ArrowLeft className="me-2" />
          Voltar
        </Button>
      </div>

      {/* Header cards — click only editable ones */}
      <Row className="mb-4 gx-3 text-center justify-content-center">
        {headerItems.map(({ key, label, value, editable }) => (
          <Col key={String(key)} xs={12} sm={6} md={3}>
            <Card
              className="p-3"
              style={{ cursor: editable ? "pointer" : "default", opacity: editable ? 1 : 0.9 }}
              onClick={() => {
                if (!editable) return;
                if (key === "operation_code") openEditForField("operation_code", value);
                else if (key === "machine_location") openEditForField("machine_location", value);
              }}
            >
              <Card.Title style={{ fontSize: "0.9rem" }}>{label}</Card.Title>
              <Card.Text style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{value ?? "-"}</Card.Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* EditOperation modal edits only the single clicked field */}
      <EditOperationModal
        show={showEditOp}
        onHide={() => setShowEditOp(false)}
        apiUrl={API_URL}
        operation={operation}
        fieldKey={editOpFieldKey}
        initialValue={editOpInitial}
        onSaved={(updated) => {
          handleOperationSaved(updated);
          setShowEditOp(false);
        }}
      />

      {/* Search bar */}
      <Form.Control
        type="search"
        placeholder="Pesquisar tarefas... (tipo de processo, data ou operador)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-3"
      />

      {/* Tasks table */}
      {sortedTasks.length === 0 ? (
        <Alert variant="warning">Nenhuma tarefa encontrada.</Alert>
      ) : (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <Table striped bordered hover className="sticky-table">
            <thead>
              <tr>
                {taskHeaders.map(({ key, label }) => (
                  <th key={label} style={{ cursor: "pointer", textAlign: "center" }} onClick={() => handleSort(key)}>
                    {label}
                    {sortConfig?.key === key ? (sortConfig.direction === "asc" ? " ▲" : " ▼") : ""}
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

      {/* Floating Create Task button */}
      <Button
        variant="success"
        className="position-fixed"
        size="lg"
        style={{ bottom: "20px", right: "20px", zIndex: 1050 }}
        onClick={() => setShowCreateTaskModal(true)}
      >
        + Nova Tarefa
      </Button>

      <CreateTask
        operationId={Number(operationId)}
        show={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onCreateSuccess={(t) => {
          setTasks((p) => [...p, t]);
          setFilteredTasks((p) => [...p, t]);
        }}
      />
    </div>
  );
}
