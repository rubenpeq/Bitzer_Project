import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Spinner,
  Alert,
  Button,
  Row,
  Col,
  Form,
  Card,
} from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import CreateNewOperation from "../components/CreateOperation";
import type { Order, Operation } from "../utils/Types";

export default function OrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [filteredOps, setFilteredOps] = useState<Operation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Operation;
    direction: "asc" | "desc";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  // --- Load Order and Operations ---
  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch(`${API_URL}/orders/${orderNumber}`).then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar ordem");
        return res.json();
      }),
      fetch(`${API_URL}/orders/${orderNumber}/operations`).then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar operações");
        return res.json();
      }),
    ])
      .then(([orderData, operationsData]) => {
        setOrder(orderData);
        setOperations(operationsData);
        setFilteredOps(operationsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderNumber]);

  // Double click to operation details
  const handleRowDoubleClick = async (
    order_number: number,
    op_code: number
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/operations/get_id?order_number=${order_number}&operation_code=${op_code}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch operation ID: ${response.statusText}`);
      }

      const operationId = await response.json(); // response is just a number

      navigate(`/operation/${operationId}`);
    } catch (error) {
      console.error("Error fetching operation ID:", error);
    }
  };

  // --- Table Headers ---
  const operationHeaders: { key: keyof Operation; label: string }[] = [
    { key: "operation_code", label: "Código Operação" },
    { key: "machine_type", label: "Tipo de Máquina" },
  ];

  // --- Search Filtering ---
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      setFilteredOps(operations);
    } else {
      const filtered = operations.filter(
        (op) =>
          op.operation_code.toString().includes(term) ||
          op.machine_type.toLowerCase().includes(term)
      );
      setFilteredOps(filtered);
    }
  }, [searchTerm, operations]);

  // --- Sorting Logic ---
  const sortedOperations = useMemo(() => {
    if (!sortConfig) return filteredOps;

    return [...filteredOps].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key]?.toString().toLowerCase();
      let bVal = b[key]?.toString().toLowerCase();

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredOps, sortConfig]);

  const handleSort = (key: keyof Operation) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleCreateSuccess = (newOperation: Operation) => {
    setOperations((prev) => [...prev, newOperation]);
    setFilteredOps((prev) => [...prev, newOperation]);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spinner animation="border" />
      </div>
    );
  }

  if (!order) return <Alert variant="danger">Ordem não encontrada</Alert>;

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

      {/* Order Summary Cards */}
      <Row className="mb-4 gx-3 justify-content-center text-center">
        {(
          [
            { label: "Nº Ordem", value: order.order_number },
            { label: "Nº Material", value: order.material_number },
            { label: "Data Início", value: order.start_date },
            { label: "Data Fim", value: order.end_date },
            { label: "Nº Peças", value: order.num_pieces },
          ] as const
        ).map(({ label, value }, idx) => (
          <Col key={idx} xs={12} sm={6} md={2} className="mb-3">
            <Card className="p-3">
              <Card.Title style={{ fontSize: "0.9rem" }}>{label}</Card.Title>
              <Card.Text style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                {value}
              </Card.Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Search Field */}
      <Form.Control
        type="search"
        placeholder="Pesquisar operações..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-3"
      />

      {/* Operations Table */}
      {sortedOperations.length === 0 ? (
        <Alert variant="warning">Nenhuma operação encontrada.</Alert>
      ) : (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                {operationHeaders.map(({ key, label }) => (
                  <th
                    key={key}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    {sortConfig?.key === key
                      ? sortConfig.direction === "asc"
                        ? "▲"
                        : "▼"
                      : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedOperations.map((op, index) => (
                <tr
                  key={op.operation_code ?? index}
                  onDoubleClick={() =>
                    handleRowDoubleClick(Number(orderNumber), op.operation_code)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td>{op.operation_code}</td>
                  <td>{op.machine_type}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Floating Action Button */}
      <Button
        variant="success"
        className="position-fixed"
        size="lg"
        style={{ bottom: "20px", right: "20px", zIndex: 1050 }}
        onClick={() => setShowModal(true)}
      >
        + Nova Operação
      </Button>

      {/* Modal */}
      <CreateNewOperation
        orderNumber={Number(orderNumber)}
        show={showModal}
        onClose={() => setShowModal(false)}
        onCreateSuccess={handleCreateSuccess}
      />
    </div>
  );
}
