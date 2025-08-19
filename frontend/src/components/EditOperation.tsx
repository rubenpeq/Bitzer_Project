import { useState } from "react";
import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";
import type { Operation } from "../utils/Types";

interface Props {
  operation: Operation;
  show: boolean;
  onClose: () => void;
  onSave: (updated: Operation) => void;
}

export default function EditOperationModal({ operation, show, onClose, onSave }: Props) {
  const [formData, setFormData] = useState({
    operation_code: operation.operation_code,
    machine_type: operation.machine_type || "",
    machine_location: operation.machine_location || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "operation_code" ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/operations/${operation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Erro ao atualizar operação");
      const updated = await res.json();
      onSave(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Operação</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form.Group className="mb-3">
          <Form.Label>Código Operação</Form.Label>
          <Form.Control
            type="number"
            name="operation_code"
            value={formData.operation_code}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Tipo de Máquina</Form.Label>
          <Form.Control
            type="text"
            name="machine_type"
            value={formData.machine_type}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Cenário de Trabalho (Machine ID)</Form.Label>
          <Form.Control
            type="text"
            name="machine_location"
            value={formData.machine_location}
            onChange={handleChange}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Salvar Alterações"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
