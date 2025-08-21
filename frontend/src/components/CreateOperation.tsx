import { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import type { Operation, Machine } from "../utils/Types";

type CreateNewOperationProps = {
  // prefer orderId (db id). If you still only have orderNumber (legacy),
  // pass that and frontend will resolve the db id before POSTing.
  orderId?: number;
  orderNumber?: number;
  show: boolean;
  onClose: () => void;
  onCreateSuccess: (newOperation: Operation) => void;
};

export default function CreateNewOperation({
  orderId,
  orderNumber,
  show,
  onClose,
  onCreateSuccess,
}: CreateNewOperationProps) {
  const [operation_code, setOperationCode] = useState<string>("");
  // store select value as string for consistent select behaviour, convert to number when needed
  const [selectedMachineIdStr, setSelectedMachineIdStr] = useState<string>("");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  // compute resolved order id later (prefer orderId)
  useEffect(() => {
    if (!show) return;
    // fetch machines list to let user pick (backend must expose /machines)
    fetch(`${API_URL}/machines`)
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao carregar máquinas");
        return r.json();
      })
      .then((data: Machine[]) => setMachines(data))
      .catch((err) => {
        console.warn("Could not fetch machines:", err);
        setMachines([]);
      });
  }, [show, API_URL]);

  const reset = () => {
    setOperationCode("");
    setSelectedMachineIdStr("");
    setError(null);
  };

  const resolveOrderId = async (): Promise<number> => {
    // prefer a provided DB id
    if (orderId && Number.isInteger(orderId)) return orderId;
    // if only orderNumber was provided (legacy), fetch the order and return its id
    if (orderNumber) {
      const r = await fetch(`${API_URL}/orders/${orderNumber}`);
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(txt || `Ordem ${orderNumber} não encontrada`);
      }
      const order = await r.json();
      if (!order?.id) throw new Error("Ordem encontrada mas sem identificador interno (id).");
      return order.id;
    }
    throw new Error("Nenhum identificador de ordem fornecido (orderId ou orderNumber).");
  };

  const handleCreate = async () => {
    setError(null);

    if (!operation_code.trim()) {
      setError("Código da operação é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      // resolve DB order id
      const resolvedId = await resolveOrderId();

      const payload: any = {
        order_id: Number(resolvedId),
        operation_code: String(operation_code).trim(),
      };

      // only include machine_id if user selected a real machine id
      const machineIdNum = selectedMachineIdStr === "" ? null : Number(selectedMachineIdStr);
      if (machineIdNum && Number.isInteger(machineIdNum)) {
        payload.machine_id = machineIdNum;
      }

      const res = await fetch(`${API_URL}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // try to parse error detail
        let msg = `Erro ao criar operação (status ${res.status}).`;
        try {
          const data = await res.json();
          msg = data.detail || JSON.stringify(data) || msg;
        } catch {
          const txt = await res.text();
          msg = txt || msg;
        }
        throw new Error(msg);
      }

      const createdOperation: Operation = await res.json();
      onCreateSuccess(createdOperation);
      reset();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
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
                type="text"
                value={operation_code}
                onChange={(e) => setOperationCode(e.target.value)}
                disabled={loading}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="machineSelect">
            <Form.Label column sm={4}>
              Cen. Trabalho
            </Form.Label>
            <Col sm={8}>
              {machines.length > 0 ? (
                <Form.Select
                  value={selectedMachineIdStr}
                  onChange={(e) => setSelectedMachineIdStr(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Selecione a máquina</option>
                  {machines.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.machine_location} — {m.description} ({m.machine_type})
                    </option>
                  ))}
                </Form.Select>
              ) : (
                <Form.Text className="text-muted">
                  Nenhuma máquina disponível. Crie máquinas no sistema antes de criar operações.
                </Form.Text>
              )}
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
