import { useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import type { Operation } from "../utils/Types";

type CreateNewOperationProps = {
  orderNumber: number;
  show: boolean;
  onClose: () => void;
  onCreateSuccess: (newOperation: Operation) => void;
};

export default function CreateNewOperation({
  orderNumber,
  show,
  onClose,
  onCreateSuccess,
}: CreateNewOperationProps) {
  const [operation_code, setOperationCode] = useState<number | "">("");
  const [machine_type, setMachineType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  const handleCreate = async () => {
    setError(null);

    if (!operation_code) {
      setError("Código da operação é obrigatório.");
      return;
    }
    if (!machine_type.trim()) {
      setError("Tipo de máquina é obrigatório.");
      return;
    }

    const payload = {
      order_number: orderNumber,
      operation_code,
      machine_type: machine_type.toUpperCase(),
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erro ao criar operação.");
      }

      const createdOperation: Operation = await res.json();
      onCreateSuccess(createdOperation);

      // Reset form
      setOperationCode("");
      setMachineType("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setOperationCode("");
    setMachineType("");
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Nova Operação</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form>
          <Form.Group as={Row} className="mb-3" controlId="operationCode">
            <Form.Label column sm={4}>
              Código
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="number"
                value={operation_code}
                onChange={(e) =>
                  setOperationCode(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="machineType">
            <Form.Label column sm={4}>
              Tipo de Máquina
            </Form.Label>
            <Col sm={8}>
              <Form.Select
                value={machine_type}
                onChange={(e) => setMachineType(e.target.value)}
              >
                <option value="">Selecione o tipo</option>
                <option value="CNC">CNC</option>
                <option value="CONVENTIONAL">Convencional</option>
              </Form.Select>
            </Col>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleCreate} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Criar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
