import { useEffect, useState } from "react";
import { Modal, Button, Form, Spinner, Alert, Row, Col } from "react-bootstrap";
import type { Operation, Machine } from "../utils/Types";

type Props = {
  show: boolean;
  onHide: () => void;
  apiUrl: string;
  operation: Operation | null;
  fieldKey: "operation_code" | "machine_location"; // which single field to edit
  initialValue: any;
  onSaved: (updated: Operation) => void;
};

export default function EditOperationModal({
  show,
  onHide,
  apiUrl,
  operation,
  fieldKey,
  initialValue,
  onSaved,
}: Props) {
  const [operationCode, setOperationCode] = useState<string>("");
  const [machines, setMachines] = useState<Machine[] | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // initialize local values based on field being edited
    if (fieldKey === "operation_code") {
      setOperationCode(initialValue ?? (operation?.operation_code ?? ""));
    } else if (fieldKey === "machine_location") {
      // if operation has machine, set to its id; otherwise null
      setSelectedMachineId(operation?.machine?.id ?? null);
    }
    setError(null);
  }, [fieldKey, initialValue, operation, show]);

  // load machines only when editing machine_location
  useEffect(() => {
    if (!show || fieldKey !== "machine_location") return;
    setLoadingMachines(true);
    fetch(`${apiUrl}/machines`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load machines");
        return r.json();
      })
      .then((data: Machine[]) => setMachines(data))
      .catch(() => setMachines(null))
      .finally(() => setLoadingMachines(false));
  }, [show, fieldKey, apiUrl]);

  const handleSubmit = async () => {
    setError(null);

    if (!operation) {
      setError("Operação inválida.");
      return;
    }

    let payload: any = {};

    if (fieldKey === "operation_code") {
      if (!operationCode || String(operationCode).trim() === "") {
        setError("Código da operação obrigatório.");
        return;
      }
      payload = { operation_code: String(operationCode) };
    } else if (fieldKey === "machine_location") {
      // When user chooses machine from select, we send machine_id; allow clearing (null)
      payload = { machine_id: selectedMachineId === null ? null : Number(selectedMachineId) };
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/operations/${operation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Erro ao atualizar operação.";
        try {
          const data = await res.json();
          msg = data.detail || JSON.stringify(data) || msg;
        } catch {
          const txt = await res.text();
          msg = txt || msg;
        }
        throw new Error(msg);
      }

      const updated: Operation = await res.json();
      onSaved(updated);
      onHide();
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {fieldKey === "operation_code" ? "Editar Código de Operação" : "Editar Cen. Trabalho"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {fieldKey === "operation_code" ? (
          <Form.Group as={Row} className="mb-3" controlId="operationCode">
            <Form.Label column sm={4}>
              Código
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="text"
                value={operationCode}
                onChange={(e) => setOperationCode(e.target.value)}
                disabled={loading}
              />
            </Col>
          </Form.Group>
        ) : (
          <Form.Group as={Row} className="mb-3" controlId="machineSelect">
            <Form.Label column sm={4}>
              Cen. Trabalho
            </Form.Label>
            <Col sm={8}>
              {loadingMachines ? (
                <div>Carregando máquinas...</div>
              ) : machines ? (
                <Form.Select
                  value={selectedMachineId ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedMachineId(v === "" ? null : Number(v));
                  }}
                  disabled={loading}
                >
                  <option value="">Nenhuma</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.machine_location} — {m.description}
                    </option>
                  ))}
                </Form.Select>
              ) : (
                // fallback: allow numeric machine id input when no machines endpoint
                <Form.Control
                  type="number"
                  value={selectedMachineId ?? ""}
                  onChange={(e) => setSelectedMachineId(e.target.value === "" ? null : Number(e.target.value))}
                />
              )}
            </Col>
          </Form.Group>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Salvar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
