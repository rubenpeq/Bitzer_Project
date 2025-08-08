import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import type { Order, OrderCreateStr } from "../utils/Types";

type Props = {
  show: boolean;
  onClose: () => void;
  onCreateSuccess: (order: Order) => void;
};

function validateOrderCreate(data: OrderCreateStr): string | null {
  const order_number_num = Number(data.order_number);
  const material_number_num = Number(data.material_number);
  const num_pieces_num = Number(data.num_pieces);

  if (
    !data.order_number.trim() ||
    isNaN(order_number_num) ||
    order_number_num <= 0
  ) {
    return "Número da ordem inválido.";
  }
  if (
    !data.material_number.trim() ||
    isNaN(material_number_num) ||
    material_number_num <= 0
  ) {
    return "Número do material inválido.";
  }
  if (!data.num_pieces.trim() || isNaN(num_pieces_num) || num_pieces_num <= 0) {
    return "Número de peças inválido.";
  }
  if (!data.start_date.trim()) {
    return "Data de início é obrigatória.";
  }
  if (!data.end_date.trim()) {
    return "Data de fim é obrigatória.";
  }
  if (data.start_date > data.end_date) {
    return "Data de início não pode ser maior que a data de fim.";
  }
  return null;
}

export default function CreateNewOrder({
  show,
  onClose,
  onCreateSuccess,
}: Props) {
  const [formData, setFormData] = useState<OrderCreateStr>({
    order_number: "",
    material_number: "",
    start_date: "",
    end_date: "",
    num_pieces: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  useEffect(() => {
    if (!show) {
      setFormData({
        order_number: "",
        material_number: "",
        start_date: "",
        end_date: "",
        num_pieces: "",
      });
      setError(null);
      setLoading(false);
    }
  }, [show]);

  const handleChange = (field: keyof OrderCreateStr, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleCreate = async () => {
    const validationError = validateOrderCreate(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      order_number: Number(formData.order_number),
      material_number: Number(formData.material_number),
      start_date: formData.start_date,
      end_date: formData.end_date,
      num_pieces: Number(formData.num_pieces),
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Erro ao criar ordem.");
      }

      const createdOrder: Order = await response.json();
      onCreateSuccess(createdOrder);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = validateOrderCreate(formData) === null;

  return (
    <Modal show={show} onHide={onClose} backdrop="static" keyboard={!loading}>
      <Modal.Header closeButton={!loading}>
        <Modal.Title>Criar Nova Ordem</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group as={Row} className="mb-3" controlId="orderNumber">
            <Form.Label column sm={4}>
              Nº Ordem
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="number"
                min={1}
                value={formData.order_number}
                onChange={(e) => handleChange("order_number", e.target.value)}
                disabled={loading}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="materialNumber">
            <Form.Label column sm={4}>
              Nº Material
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="number"
                min={1}
                value={formData.material_number}
                onChange={(e) =>
                  handleChange("material_number", e.target.value)
                }
                disabled={loading}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="startDate">
            <Form.Label column sm={4}>
              Data Início
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
                disabled={loading}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="endDate">
            <Form.Label column sm={4}>
              Data Fim
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
                disabled={loading}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} controlId="numPieces">
            <Form.Label column sm={4}>
              Nº Peças
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="number"
                min={1}
                value={formData.num_pieces}
                onChange={(e) => handleChange("num_pieces", e.target.value)}
                disabled={loading}
              />
            </Col>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleCreate}
          disabled={loading || !isFormValid}
        >
          {loading ? <Spinner size="sm" animation="border" /> : "Criar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
