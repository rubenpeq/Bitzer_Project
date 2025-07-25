import { useState, useEffect } from "react";
import {
  Table,
  Form,
  Spinner,
  Alert,
  Button,
  Modal,
  Row,
  Col,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

type Order = {
  order_number: number;
  material_number: number;
  start_date: string;
  end_date: string;
  num_pieces: number;
};

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);  // <-- start empty, will fill after fetch
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newOrder, setNewOrder] = useState<Order>({
    order_number: 0,
    material_number: 0,
    start_date: "",
    end_date: "",
    num_pieces: 0,
  });

  const navigate = useNavigate();

  // Add this useEffect to fetch orders from backend once on component mount
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8000/orders")
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

  // Existing useEffect for filtering orders stays here unchanged
  useEffect(() => {
    setLoading(true);

    const timeout = setTimeout(() => {
      const term = searchTerm.trim().toLowerCase();

      if (!term) {
        setFilteredOrders(orders);
        setLoading(false);
        return;
      }

      const filtered = orders.filter((order) => {
        return (
          order.order_number.toString().toLowerCase().includes(term) ||
          order.material_number.toString().toLowerCase().includes(term)
        );
      });

      setFilteredOrders(filtered);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, orders]);

  const handleRowDoubleClick = (orderNumber: number) => {
    navigate(`/order/${orderNumber}`);
  };

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setNewOrder({
      order_number: 0,
      material_number: 0,
      start_date: "",
      end_date: "",
      num_pieces: 0,
    });
  };

  const handleCreateOrder = () => {
    setOrders((prev) => [...prev, newOrder]);
    handleCloseModal();
  };

  return (
    <div className="p-3 position-relative" style={{ height: "100%" }}>
      <Form.Control
        type="search"
        placeholder="Search orders by number or material..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-3"
      />

      {loading && <Spinner animation="border" />}

      {!loading && filteredOrders.length === 0 && (
        <Alert variant="warning">No orders found.</Alert>
      )}

      {!loading && filteredOrders.length > 0 && (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Nº Ordem</th>
                <th>Nº Material</th>
                <th>Data Início</th>
                <th>Data Fim</th>
                <th>Nº Peças</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => (
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

      {/* Floating button */}
      <Button
        variant="success"
        className="position-fixed"
        style={{ bottom: "20px", right: "20px", zIndex: 1050 }}
        onClick={handleShowModal}
      >
        + Nova Ordem
      </Button>

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Criar Nova Ordem</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={4}>Nº Ordem</Form.Label>
              <Col sm={8}>
                <Form.Control
                  type="number"
                  value={newOrder.order_number}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, order_number: Number(e.target.value) })
                  }
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={4}>Nº Material</Form.Label>
              <Col sm={8}>
                <Form.Control
                  type="number"
                  value={newOrder.material_number}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, material_number: Number(e.target.value) })
                  }
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={4}>Data Início</Form.Label>
              <Col sm={8}>
                <Form.Control
                  type="date"
                  value={newOrder.start_date}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, start_date: e.target.value })
                  }
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={4}>Data Fim</Form.Label>
              <Col sm={8}>
                <Form.Control
                  type="date"
                  value={newOrder.end_date}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, end_date: e.target.value })
                  }
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row}>
              <Form.Label column sm={4}>Nº Peças</Form.Label>
              <Col sm={8}>
                <Form.Control
                  type="number"
                  value={newOrder.num_pieces}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, num_pieces: Number(e.target.value) })
                  }
                />
              </Col>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreateOrder}>
            Criar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
