import { useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";

type OrderCreate = {
  order_number: number;
  material_number: number;
  start_date: string;
  end_date: string;
  num_pieces: number;
};

type Order = OrderCreate & {
  order_number: number;
};

type Props = {
  show: boolean;
  onClose: () => void;
  onCreateSuccess: (order: Order) => void;
};

export default function CreateNewOrder({
  show,
  onClose,
  onCreateSuccess,
}: Props) {
  const [formData, setFormData] = useState<OrderCreate>({
    order_number: 0,
    material_number: 0,
    start_date: "",
    end_date: "",
    num_pieces: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Erro ao criar ordem.");
      }

      const createdOrder: Order = await response.json();
      onCreateSuccess(createdOrder);
      onClose();
      setFormData({
        order_number: 0,
        material_number: 0,
        start_date: "",
        end_date: "",
        num_pieces: 0,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof OrderCreate, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Criar Nova Ordem</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>
              Nº Ordem
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="number"
                value={formData.order_number}
                onChange={(e) =>
                  handleChange("order_number", Number(e.target.value))
                }
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>
              Nº Material
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="number"
                value={formData.material_number}
                onChange={(e) =>
                  handleChange("material_number", Number(e.target.value))
                }
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>
              Data Início
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>
              Data Fim
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row}>
            <Form.Label column sm={4}>
              Nº Peças
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="number"
                value={formData.num_pieces}
                onChange={(e) =>
                  handleChange("num_pieces", Number(e.target.value))
                }
              />
            </Col>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleCreate} disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : "Criar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
