import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Spinner,
  Alert,
  Button,
  Modal,
  Row,
  Col,
  Form,
} from "react-bootstrap";

type Order = {
  order_number: number;
  material_number: number;
  start_date: string;
  end_date: string;
  num_pieces: number;
};

type Operation = {
  operation_code: string;
  machine_type: string;
};

export default function OrderDetail() {
  const navigate = useNavigate();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newOperation, setNewOperation] = useState<Operation>({
    operation_code: "",
    machine_type: "",
  });

  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  useEffect(() => {
    setLoading(true);

    // Fetch the specific order
    fetch(`${API_URL}/orders/${orderNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch order");
        return res.json();
      })
      .then((data) => setOrder(data))
      .catch(console.error);

    // Fetch operations for the order
    fetch(`${API_URL}/orders/${orderNumber}/operations`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch operations");
        return res.json();
      })
      .then((data) => setOperations(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setNewOperation({ operation_code: "", machine_type: "" });
  };

  const handleCreateOperation = () => {
    setOperations((prev) => [...prev, newOperation]);
    handleCloseModal();
  };

  if (loading) return <Spinner animation="border" />;
  if (!order) return <Alert variant="danger">Ordem não encontrada</Alert>;

  return (
    <div className="p-3">
      <Button
        variant="light"
        className="mb-3 d-flex align-items-center"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="me-2" />
        Voltar
      </Button>
      <h4>Detalhes da Ordem Nº {order.order_number}</h4>
      <p>
        <strong>Nº Material:</strong> {order.material_number}
      </p>
      <p>
        <strong>Data Início:</strong> {order.start_date}
      </p>
      <p>
        <strong>Data Fim:</strong> {order.end_date}
      </p>
      <p>
        <strong>Nº Peças:</strong> {order.num_pieces}
      </p>

      <h5 className="mt-4">Operações</h5>
      {operations.length === 0 ? (
        <Alert variant="warning">Nenhuma operação encontrada.</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Código Operação</th>
              <th>Tipo de Máquina</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op, index) => (
              <tr key={op.operation_code || index}>
                <td>{op.operation_code}</td>
                <td>{op.machine_type}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Button
        variant="primary"
        className="position-fixed"
        style={{ bottom: "20px", right: "20px", zIndex: 1050 }}
        onClick={handleShowModal}
      >
        + Criar Operação
      </Button>

      {/* Modal to create operation */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Nova Operação</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={4}>
                Código
              </Form.Label>
              <Col sm={8}>
                <Form.Control
                  type="text"
                  value={newOperation.operation_code}
                  onChange={(e) =>
                    setNewOperation({
                      ...newOperation,
                      operation_code: e.target.value,
                    })
                  }
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm={4}>
                Tipo de Máquina
              </Form.Label>
              <Col sm={8}>
                <Form.Select
                  value={newOperation.machine_type}
                  onChange={(e) =>
                    setNewOperation({
                      ...newOperation,
                      machine_type: e.target.value,
                    })
                  }
                >
                  <option value="">Selecione o tipo</option>
                  <option value="CNC">CNC</option>
                  <option value="Convencional">Convencional</option>
                </Form.Select>
              </Col>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreateOperation}>
            Criar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
