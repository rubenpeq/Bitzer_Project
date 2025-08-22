import { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import type { Order } from "../utils/Types";

type Props = {
  show: boolean;
  onHide: () => void;
  apiUrl: string;
  // prefer orderId now (DB uses id). If you still only have order_number, pass it in orderNumber and backend must accept it.
  currentOrderId?: number;
  orderNumber?: number;
  fieldKey: string;
  label: string;
  initialValue: any;
  onSaved: (updatedOrder: Order) => void;
};

export default function EditOrderFieldModal({ show, onHide, apiUrl, currentOrderId, orderNumber, fieldKey, label, initialValue, onSaved }: Props) {
  const [value, setValue] = useState<string>(initialValue ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(initialValue === null || initialValue === undefined ? "" : String(initialValue));
    setError(null);
  }, [initialValue, show]);

  const convertPayload = (): any => {
    if (["order_number", "material_number", "num_pieces"].includes(fieldKey)) {
      const n = Number(value);
      if (Number.isNaN(n)) throw new Error("Valor numérico inválido.");
      return { [fieldKey]: n };
    }
    if (fieldKey === "start_date" || fieldKey === "end_date") {
      if (value === "") return { [fieldKey]: null };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Formato de data inválido (YYYY-MM-DD).");
      return { [fieldKey]: value };
    }
    return { [fieldKey]: value === "" ? null : value };
  };

  const handleSave = async () => {
    setError(null);
    let payload;
    try {
      payload = convertPayload();
    } catch (e: any) {
      setError(e.message || "Valor inválido");
      return;
    }

    if (!window.confirm(`Confirmar alteração de "${label}"?`)) return;

    setLoading(true);
    try {
      // choose URL by ID (preferred) or by order_number (legacy)
      let url = "";
      if (currentOrderId) url = `${apiUrl}/orders/${currentOrderId}`;
      else if (orderNumber) url = `${apiUrl}/orders/${orderNumber}`;
      else throw new Error("Nenhum identificador da ordem fornecido.");

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }

      const updated: Order = await res.json();
      onSaved(updated);
      onHide();
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar — {label}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {fieldKey === "start_date" || fieldKey === "end_date" ? (
          <Form.Control type="date" value={value} onChange={(e) => setValue(e.target.value)} />
        ) : ["order_number", "material_number", "num_pieces"].includes(fieldKey) ? (
          <Form.Control type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        ) : (
          <Form.Control value={value} onChange={(e) => setValue(e.target.value)} />
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
