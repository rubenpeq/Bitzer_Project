import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Table, Spinner, Alert, Button, Row, Col, Form, Card } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import CreateNewOperation from "../components/CreateOperation";
import EditOrderFieldModal from "../components/EditOrder";
import { type Order, type Operation, processTypeLabels } from "../utils/Types";

export default function OrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  const [order, setOrder] = useState<Order | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [filteredOps, setFilteredOps] = useState<Operation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Operation; direction: "asc" | "desc" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateOp, setShowCreateOp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Edit Modal ---
  const [showEdit, setShowEdit] = useState(false);
  const [editKey, setEditKey] = useState<string>("");
  const [editLabel, setEditLabel] = useState<string>("");
  const [editInitial, setEditInitial] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API_URL}/orders/${orderNumber}`).then((r) => {
        if (!r.ok) throw new Error("Erro ao buscar ordem");
        return r.json();
      }),
      fetch(`${API_URL}/orders/${orderNumber}/operations`).then((r) => {
        if (!r.ok) throw new Error("Erro ao buscar operações");
        return r.json();
      }),
    ])
      .then(([o, ops]) => {
        setOrder(o);
        setOperations(ops);
        setFilteredOps(ops);
      })
      .catch((e) => setError((e as Error).message || String(e)))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const operationHeaders: { key: keyof Operation; label: string }[] = [
    { key: "operation_code", label: "Código Operação" },
    { key: "machine", label: "Cen. Trabalho" },
  ];

  // Open edit modal from card click
  const openEditModal = (key: string, label: string, initial: any) => {
    setEditKey(key);
    setEditLabel(label);
    setEditInitial(initial);
    setShowEdit(true);
  };

  const onSavedOrder = (updated: Order) => {
    // update local order
    const prevOrderNumber = order?.order_number;
    setOrder(updated);
    // if order_number changed, navigate to new route
    if (editKey === "order_number" && updated.order_number && prevOrderNumber !== updated.order_number) {
      navigate(`/order/${updated.order_number}`, { replace: true });
    }
  };

  // search/filter
  useEffect(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return setFilteredOps(operations);
    const contains = (v: any) => v !== undefined && v !== null && String(v).toLowerCase().includes(t);
    setFilteredOps(operations.filter((op) => contains(op.operation_code) || contains(op.machine?.machine_type) || contains(op.machine?.machine_location)));
  }, [searchTerm, operations]);

  // sorting
  const sortedOperations = useMemo(() => {
    if (!sortConfig) return filteredOps;
    const { key, direction } = sortConfig;
    return [...filteredOps].sort((a, b) => {
      const A = String(a[key] ?? "").toLowerCase();
      const B = String(b[key] ?? "").toLowerCase();
      if (A < B) return direction === "asc" ? -1 : 1;
      if (A > B) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredOps, sortConfig]);

  const handleRowDoubleClick = async (order_number: number, op_code: number) => {
    try {
      const res = await fetch(`${API_URL}/operations/get_id?order_number=${order_number}&operation_code=${op_code}`);
      if (!res.ok) throw new Error("Failed to fetch operation ID");
      const id = await res.json();
      navigate(`/operation/${id}`);
    } catch (e) {
      setError("Erro ao abrir operação.");
    }
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}><Spinner animation="border" /></div>;
  if (!order) return <Alert variant="danger">Ordem não encontrada</Alert>;

  return (
    <div className="p-3 position-relative" style={{ height: "100%" }}>
      <Button variant="light" className="mb-3 d-flex align-items-center" onClick={() => navigate(-1)}>
        <ArrowLeft className="me-2" /> Voltar
      </Button>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      {/* Summary cards (click to edit) */}
      <Row className="mb-4 gx-3 justify-content-center text-center">
        {(
          [
            { key: "order_number", label: "Nº Ordem", value: order.order_number },
            { key: "material_number", label: "Nº Material", value: order.material_number },
            { key: "start_date", label: "Data Início", value: order.start_date ?? "" },
            { key: "end_date", label: "Data Fim", value: order.end_date ?? "" },
            { key: "num_pieces", label: "Nº Peças", value: order.num_pieces },
          ] as const
        ).map(({ key, label, value }) => (
          <Col key={String(key)} xs={12} sm={6} md={2} className="mb-3">
            <Card className="p-3" style={{ cursor: "pointer" }} onClick={() => openEditModal(String(key), label, value)}>
              <Card.Title style={{ fontSize: "0.9rem" }}>{label}</Card.Title>
              <Card.Text style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                {value === "" || value === null || value === undefined ? "-" : String(value)}
              </Card.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <EditOrderFieldModal
        show={showEdit}
        onHide={() => setShowEdit(false)}
        apiUrl={API_URL}
        currentOrderNumber={order.order_number}
        fieldKey={editKey}
        label={editLabel}
        initialValue={editInitial}
        onSaved={onSavedOrder}
      />

      <Form.Control type="search" placeholder="Pesquisar operações... (código de operação, tipo de máquina ou id de máquina)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-3" />

      {sortedOperations.length === 0 ? (
        <Alert variant="warning">Nenhuma operação encontrada.</Alert>
      ) : (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <Table striped bordered hover className="sticky-table">
            <thead>
              <tr>
                {operationHeaders.map(({ key, label }) => (
                  <th key={String(key)} style={{ cursor: "pointer", textAlign: "center" }} onClick={() => setSortConfig({ key, direction: sortConfig?.direction === "asc" ? "desc" : "asc" })}>
                    {label}{sortConfig?.key === key ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedOperations.map((op, idx) => (
                <tr key={idx} onDoubleClick={() => handleRowDoubleClick(Number(orderNumber), Number(op.operation_code))} style={{ cursor: "pointer" }}>
                  <td className="text-center">{op.operation_code}</td>
                  <td className="text-center">{op.machine?.machine_type ? processTypeLabels[op.machine.machine_type] : "—"}</td>
                  <td className="text-center">{op.machine?.machine_location ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Button variant="success" className="position-fixed" size="lg" style={{ bottom: "20px", right: "20px", zIndex: 1050 }} onClick={() => setShowCreateOp(true)}>
        + Nova Operação
      </Button>

      <CreateNewOperation orderNumber={Number(orderNumber)} show={showCreateOp} onClose={() => setShowCreateOp(false)} onCreateSuccess={(op) => { setOperations((p) => [...p, op]); setFilteredOps((p) => [...p, op]); }} />
    </div>
  );
}
