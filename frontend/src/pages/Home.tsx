import { useState, useEffect, useMemo } from "react";
import { Table, Form, Spinner, Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import CreateNewOrder from "../components/CreateOrder";
import type { Order } from "../utils/Types";

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Order;
    direction: "asc" | "desc";
  } | null>(null);

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  // --- Load Orders ---
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/orders`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch orders");
        return res.json();
      })
      .then((data: Order[]) => {
        setOrders(data);
        setFilteredOrders(data);
      })
      .catch((err) => {
        console.error(err);
        setOrders([]);
        setFilteredOrders([]);
      })
      .finally(() => setLoading(false));
  }, [API_URL]);

  // --- Handle Sorting on Click ---
  function handleSort(key: keyof Order) {
    let direction: "asc" | "desc" = "asc";

    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  }

  // --- Filter Orders ---
  useEffect(() => {
    const timeout = setTimeout(() => {
      const term = searchTerm.trim().toLowerCase();

      if (!term) {
        setFilteredOrders(orders);
        return;
      }

      const filtered = orders.filter(
        (order) =>
          order.order_number.toString().toLowerCase().includes(term) ||
          order.material_number.toString().toLowerCase().includes(term)
      );

      setFilteredOrders(filtered);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, orders]);

  // --- Sort FilteredOrders ---
  const sortedOrders = useMemo(() => {
    if (!sortConfig) return filteredOrders;

    const { key, direction } = sortConfig;

    return [...filteredOrders].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      // Defensive fallback
      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";

      // If sorting dates, parse to timestamp
      if (key === "start_date" || key === "end_date") {
        const aDate = Date.parse(aVal as string);
        const bDate = Date.parse(bVal as string);
        if (isNaN(aDate) && isNaN(bDate)) return 0;
        if (isNaN(aDate)) return direction === "asc" ? -1 : 1;
        if (isNaN(bDate)) return direction === "asc" ? 1 : -1;
        return direction === "asc" ? aDate - bDate : bDate - aDate;
      }

      // For other fields, convert to string and compare case-insensitive
      const aStr = aVal.toString().toLowerCase();
      const bStr = bVal.toString().toLowerCase();

      if (aStr < bStr) return direction === "asc" ? -1 : 1;
      if (aStr > bStr) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  // Double click to order details
  const handleRowDoubleClick = (orderNumber: number) => {
    navigate(`/order/${orderNumber}`);
  };

  // Table Headers
  const orderHeaders: { key: keyof Order; label: string }[] = [
    { key: "order_number", label: "Nº Ordem" },
    { key: "material_number", label: "Nº Material" },
    { key: "start_date", label: "Data Início" },
    { key: "end_date", label: "Data Fim" },
    { key: "num_pieces", label: "Nº Peças" },
  ];

  // Modal controls
  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div className="p-3 position-relative" style={{ height: "100%" }}>
      <Form.Control
        type="search"
        placeholder="Pesquisar Ordem ... (nº Ordem ou nº Material)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-3"
      />

      {loading ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "60vh" }}
        >
          <Spinner animation="border" role="status" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Alert variant="warning">Nenhum pedido encontrado.</Alert>
      ) : (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                {orderHeaders.map(({ key, label }) => (
                  <th
                    key={key}
                    style={{ cursor: "pointer", textAlign: "center" }}
                    onClick={() => handleSort(key)}
                  >
                    {label}{" "}
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
              {sortedOrders.map((order, index) => (
                <tr
                  key={order.order_number ?? index}
                  onDoubleClick={() => handleRowDoubleClick(order.order_number)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{order.order_number}</td>
                  <td>{order.material_number}</td>
                  <td>{order.start_date ?? "-"}</td>
                  <td>{order.end_date ?? "-"}</td>
                  <td>{order.num_pieces}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Button
        variant="success"
        className="position-fixed"
        size="lg"
        style={{ bottom: "20px", right: "20px", zIndex: 1050 }}
        onClick={handleShowModal}
      >
        + Nova Ordem
      </Button>

      <CreateNewOrder
        show={showModal}
        onClose={handleCloseModal}
        onCreateSuccess={(createdOrder) => {
          setOrders((prev) => [...prev, createdOrder]);
          setFilteredOrders((prev) => [...prev, createdOrder]);
        }}
      />
    </div>
  );
}
