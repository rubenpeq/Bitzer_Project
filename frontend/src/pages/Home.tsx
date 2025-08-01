import { useState, useEffect, useMemo } from "react";
import { Table, Form, Spinner, Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import CreateNewOrder from "../components/CreateNewOrder";

type Order = {
  order_number: number;
  material_number: number;
  start_date: string;
  end_date: string;
  num_pieces: number;
};

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

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/orders`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch orders");
        return res.json();
      })
      .then((data) => {
        setOrders(data);
        setFilteredOrders(data);
      })
      .catch((err) => {
        console.error(err);
        setOrders([]);
        setFilteredOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

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

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      const term = searchTerm.trim().toLowerCase();

      if (!term) {
        setFilteredOrders(orders);
        setLoading(false);
        return;
      }

      const filtered = orders.filter(
        (order) =>
          order.order_number.toString().includes(term) ||
          order.material_number.toString().includes(term)
      );

      setFilteredOrders(filtered);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, orders]);

  // Move sortedOrders useMemo outside so it's accessible
  const sortedOrders = useMemo(() => {
    if (!sortConfig) return filteredOrders;

    return [...filteredOrders].sort((a, b) => {
      const { key, direction } = sortConfig;

      let aVal = a[key];
      let bVal = b[key];

      // If the values are dates as strings, convert to timestamp for comparison
      if (key === "start_date" || key === "end_date") {
        aVal = Date.parse(aVal as string);
        bVal = Date.parse(bVal as string);
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  const handleRowDoubleClick = (orderNumber: number) => {
    navigate(`/order/${orderNumber}`);
  };

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="p-3 position-relative" style={{ height: "100%" }}>
      <Form.Control
        type="search"
        placeholder="Pesquisar por número de ordem ou material ..."
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
        <Alert variant="warning">No orders found.</Alert>
      ) : (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("order_number")}
                >
                  Nº Ordem{" "}
                  {sortConfig?.key === "order_number"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>

                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("material_number")}
                >
                  Nº Material{" "}
                  {sortConfig?.key === "material_number"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("start_date")}
                >
                  Data Inicio{" "}
                  {sortConfig?.key === "start_date"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("end_date")}
                >
                  Data Fim{" "}
                  {sortConfig?.key === "end_date"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("num_pieces")}
                >
                  Nº Peças{" "}
                  {sortConfig?.key === "num_pieces"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
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
                  <td>{order.start_date}</td>
                  <td>{order.end_date}</td>
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

      {/* Create New Order Component */}
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
