import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Table, Spinner, Alert, Button, Row, Col, Card, Form, ProgressBar } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import { formatDateTime, processTypeLabels, type Operation, type Task } from "../utils/Types";
import CreateTask from "../components/CreateTask";
import EditOperationModal from "../components/EditOperation";

export default function OperationDetail() {
  const { operationId } = useParams<{ operationId: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  const [operation, setOperation] = useState<Operation | null>(null);
  const [displayOrderNumber, setDisplayOrderNumber] = useState<number | null>(null);
  const [orderNumPieces, setOrderNumPieces] = useState<number | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Task;
    direction: "asc" | "desc";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Edit operation modal state (we open it for a single field)
  const [showEditOp, setShowEditOp] = useState(false);
  const [editOpFieldKey, setEditOpFieldKey] = useState<"operation_code" | "machine_location">("operation_code");
  const [editOpInitial, setEditOpInitial] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  // pieces summary from backend for this operation
  const [piecesSummary, setPiecesSummary] = useState<{
    total_pieces: number;
    good_pieces: number;
    bad_pieces: number;
  } | null>(null);

  // fetch pieces summary helper
  const refreshPiecesSummary = async (opId: string | number) => {
    try {
      const res = await fetch(`${API_URL}/operations/${opId}/pieces`);
      if (!res.ok) {
        setPiecesSummary(null);
        return;
      }
      const json = await res.json();
      setPiecesSummary({
        total_pieces: Number(json.total_pieces ?? 0),
        good_pieces: Number(json.good_pieces ?? 0),
        bad_pieces: Number(json.bad_pieces ?? 0),
      });
    } catch (e) {
      console.warn("Failed to fetch pieces summary:", e);
      setPiecesSummary(null);
    }
  };

  useEffect(() => {
    if (!operationId) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // load operation
        const opRes = await fetch(`${API_URL}/operation/${operationId}`);
        if (!opRes.ok) throw new Error("Erro ao buscar operação");
        const operationData = await opRes.json();
        setOperation(operationData);

        // load tasks
        const tRes = await fetch(`${API_URL}/operations/${operationId}/tasks`);
        if (!tRes.ok) throw new Error("Erro ao buscar tarefas");
        const taskData = await tRes.json();
        const normalized: Task[] = (taskData ?? []).map((t: any) => t);
        setTasks(normalized);
        setFilteredTasks(normalized);

        // fetch the order list to find order_number and num_pieces for this operation.order_id
        try {
          if (operationData?.order_id) {
            const ordersRes = await fetch(`${API_URL}/orders`);
            if (ordersRes.ok) {
              const orders = await ordersRes.json();
              const found = (orders ?? []).find((o: any) => Number(o.id) === Number(operationData.order_id));
              if (found) {
                if (found.order_number) setDisplayOrderNumber(Number(found.order_number));
                if (found.num_pieces !== undefined && found.num_pieces !== null) setOrderNumPieces(Number(found.num_pieces));
              } else {
                setDisplayOrderNumber(null);
                setOrderNumPieces(null);
              }
            }
          }
        } catch (e) {
          console.warn("Could not fetch orders for order_number/num_pieces:", e);
          setDisplayOrderNumber(null);
          setOrderNumPieces(null);
        }

        // fetch pieces summary
        await refreshPiecesSummary(operationId);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Erro ao buscar dados");
      } finally {
        setLoading(false);
      }
    })();
  }, [operationId, API_URL]);

  // -------------------
  // Task search/filter
  // -------------------
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredTasks(tasks);
      return;
    }
    const contains = (val: any) => val !== undefined && val !== null && String(val).toLowerCase().includes(term);

    setFilteredTasks(
      tasks.filter(
        (t) =>
          contains(t.process_type) ||
          contains(t.operator_bitzer_id) ||
          contains(t.operator_user?.name) ||
          contains(t.start_at) ||
          contains(t.end_at)
      )
    );
  }, [searchTerm, tasks]);

  // -------------------
  // Table headers
  // -------------------
  const taskHeaders: { key: keyof Task; label: string }[] = [
    { key: "process_type", label: "Tipo de Processo" },
    { key: "start_at", label: "Início" },
    { key: "end_at", label: "Fim" },
    { key: "num_benches", label: "Bancadas" },
    { key: "num_machines", label: "Máquinas" },
    { key: "good_pieces", label: "Peças Boas" },
    { key: "bad_pieces", label: "Peças Defetivas" },
    { key: "operator_bitzer_id", label: "Operador" },
  ];

  const sortedTasks = useMemo(() => {
    if (!sortConfig) return filteredTasks;
    return [...filteredTasks].sort((a, b) => {
      const { key, direction } = sortConfig!;
      const aRaw = (a as any)[key] ?? "";
      const bRaw = (b as any)[key] ?? "";
      const aVal = String(aRaw).toLowerCase();
      const bVal = String(bRaw).toLowerCase();
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortConfig]);

  const handleSort = (key: keyof Task) => {
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

  // When operation edited, update local state and also refresh order/pieces info
  const handleOperationSaved = async (updatedOp: Operation) => {
    setOperation(updatedOp);
    // refresh order info (order_number, num_pieces)
    try {
      if (updatedOp?.order_id) {
        const ordersRes = await fetch(`${API_URL}/orders`);
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          const found = (orders ?? []).find((o: any) => Number(o.id) === Number(updatedOp.order_id));
          if (found) {
            if (found.order_number) setDisplayOrderNumber(Number(found.order_number));
            if (found.num_pieces !== undefined && found.num_pieces !== null) setOrderNumPieces(Number(found.num_pieces));
          }
        }
      }
    } catch {
      // ignore
    }

    // refresh pieces summary for this operation
    await refreshPiecesSummary(updatedOp.id);
  };

  // after creating a task: add to local list and refresh pieces summary
  const handleCreateTaskSuccess = (t: Task) => {
    setTasks((p) => [...p, t]);
    setFilteredTasks((p) => [...p, t]);
    if (operationId !== undefined) {
      refreshPiecesSummary(operationId);
    }
    setShowCreateTaskModal(false);
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
  // the progress card is shown as a small card in the header row
  const headerItems = [
    { key: "order_number", label: "Nº Ordem", value: displayOrderNumber ?? operation.order_id, editable: false },
    { key: "operation_code", label: "Código Operação", value: operation.operation_code, editable: true },
    { key: "machine_type", label: "Tipo Máquina", value: operation.machine?.machine_type ?? "—", editable: false },
    { key: "machine_location", label: "Cen. Trabalho", value: operation.machine?.machine_location ?? "—", editable: true },
    { key: "total_pieces", label: "Progresso", value: null, editable: false }
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
      <Row className="mb-4 gx-3 text-center justify-content-center align-items-stretch">
        {headerItems.map(({ key, label, value, editable }) => (
          <Col key={String(key)} xs={12} sm={6} md={2}>
            <Card
              className="p-3 h-100"
              style={{
                cursor: editable ? "pointer" : "default",
                opacity: editable ? 1 : 0.95,
              }}
              onClick={() => {
                if (!editable) return;
                if (key === "operation_code") openEditForField("operation_code", value);
                else if (key === "machine_location") openEditForField("machine_location", value);
              }}
            >
              <Card.Title style={{ fontSize: "0.9rem" }}>{label}</Card.Title>
              <Card.Text
                as="div"
                style={{
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  position: "relative",
                }}
              >
                {key === "total_pieces" && piecesSummary ? (
                  <div style={{ position: "relative", height: "1.8rem" }}>
                    <ProgressBar
                      now={orderNumPieces ? Math.min((piecesSummary.total_pieces / orderNumPieces) * 100, 100) : 0}
                      variant={orderNumPieces && piecesSummary.total_pieces > orderNumPieces ? "danger" : "success"}
                      animated
                      style={{ height: "100%" }}
                    />
                    {/* Label overlay */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontWeight: "bold",
                        color: "black",
                      }}
                    >
                      {`${piecesSummary.total_pieces}/${orderNumPieces ?? "—"}`}
                    </div>
                  </div>
                ) : (
                  value ?? "-"
                )}
              </Card.Text>
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
      <Form.Control type="search" placeholder="Pesquisar tarefas... (tipo de processo, nome/id do operador, data)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-3" />

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
                <tr key={task.id} onDoubleClick={() => handleRowDoubleClick(task.id)} style={{ cursor: "pointer" }}>
                  <td>{processTypeLabels[task.process_type] ?? task.process_type}</td>
                  <td>{task.start_at ? formatDateTime(task.start_at) : "-"}</td>
                  <td>{task.end_at ? formatDateTime(task.end_at) : "-"}</td>
                  <td>{task.num_benches ?? "-"}</td>
                  <td>{task.num_machines ?? "-"}</td>
                  <td>{task.good_pieces ?? "-"}</td>
                  <td>{task.bad_pieces ?? "-"}</td>
                  <td>{task.operator_user?.name ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Floating Create Task button */}
      <Button variant="success" className="position-fixed" size="lg" style={{ bottom: "20px", right: "20px", zIndex: 1050 }} onClick={() => setShowCreateTaskModal(true)}>
        + Nova Tarefa
      </Button>

      <CreateTask operationId={Number(operationId)} show={showCreateTaskModal} onClose={() => setShowCreateTaskModal(false)} onCreateSuccess={handleCreateTaskSuccess} />
    </div>
  );
}
