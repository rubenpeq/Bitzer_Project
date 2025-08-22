import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { type Operation, type Machine, processTypeLabels } from "../utils/Types";

type CreateNewOperationProps = {
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
  const [selectedMachineIdStr, setSelectedMachineIdStr] = useState<string>("");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_FASTAPI_URL;

  // combo state
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ensure empty on open
  useEffect(() => {
    if (!show) return;
    setSelectedMachineIdStr("");
    setSearchText("");
    setOpen(false);
    setHighlightIndex(-1);
    setSubmitAttempted(false);
    setError(null);

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
    setSearchText("");
    setOpen(false);
    setHighlightIndex(-1);
    setSubmitAttempted(false);
    setError(null);
  };

  const resolveOrderId = async (): Promise<number> => {
    if (orderId && Number.isInteger(orderId)) return orderId;
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
    setSubmitAttempted(true);
    setError(null);

    if (!operation_code.trim()) {
      setError("Código da operação é obrigatório.");
      return;
    }

    if (!selectedMachineIdStr.trim()) {
      setError("Selecionar uma máquina é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      const resolvedId = await resolveOrderId();

      const payload: any = {
        order_id: Number(resolvedId),
        operation_code: String(operation_code).trim(),
        machine_id: Number(selectedMachineIdStr), // required now
      };

      const res = await fetch(`${API_URL}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
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

  // label helper
  const labelFor = (m: Machine) => {
    const loc = (m.machine_location ?? "").toString();
    const desc = (m.description ?? "").toString();
    const mtype = (m.machine_type ?? "").toString();
    return `${loc} — ${desc} (${processTypeLabels[mtype]})`;
  };

  // sync visible input when selection changes
  useEffect(() => {
    if (!selectedMachineIdStr) {
      setSearchText("");
      setHighlightIndex(-1);
      return;
    }
    const sel =
      machines.find((m) => String(m.id) === String(selectedMachineIdStr)) ||
      machines.find((m) => String(m.machine_id) === String(selectedMachineIdStr));
    if (sel) setSearchText(labelFor(sel));
    else setSearchText("");
    setHighlightIndex(-1);
  }, [selectedMachineIdStr, machines]);

  // user typing clears prior selection (so selection can't persist while editing)
  const onInputChange = (value: string) => {
    setSearchText(value);
    if (selectedMachineIdStr) setSelectedMachineIdStr("");
    setOpen(true);
    setHighlightIndex(0);
  };

  // filtered list
  const filteredMachines = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return machines;
    return machines.filter((m) => {
      const parts = [
        String(m.machine_location ?? ""),
        String(m.description ?? ""),
        String(m.machine_id ?? ""),
        String(m.machine_type ?? ""),
      ];
      return parts.some((p) => p.toLowerCase().includes(q));
    });
  }, [machines, searchText]);

  // helper: find exact match label
  const findExactLabelMatch = (): Machine | undefined => {
    const txt = searchText.trim();
    if (!txt) return undefined;
    return machines.find((m) => labelFor(m).trim() === txt);
  };

  // click outside handler: close and enforce only exact-match selection remains
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        const sel =
          machines.find((m) => String(m.id) === String(selectedMachineIdStr)) ||
          machines.find((m) => String(m.machine_id) === String(selectedMachineIdStr));
        if (!sel) {
          // no explicit selection: allow exact-match auto-select, otherwise clear visible text
          const exact = findExactLabelMatch();
          if (exact) {
            setSelectedMachineIdStr(String(exact.id ?? exact.machine_id ?? ""));
            setSearchText(labelFor(exact));
          } else {
            setSearchText("");
            setSelectedMachineIdStr("");
          }
        } else {
          // there is a selection; ensure input equals label, otherwise clear selection
          if (searchText.trim() !== labelFor(sel).trim()) {
            setSelectedMachineIdStr("");
            setSearchText("");
          } else {
            setSearchText(labelFor(sel));
          }
        }
        setHighlightIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, selectedMachineIdStr, machines, searchText]);

  // keyboard navigation & selection
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      setHighlightIndex(0);
      e.preventDefault();
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      setHighlightIndex((i) => Math.min((filteredMachines.length - 1) as number, Math.max(0, i + 1)));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlightIndex((i) => Math.max(0, i - 1));
      e.preventDefault();
    } else if (e.key === "Enter") {
      // only select on Enter if there is a highlighted item
      if (highlightIndex >= 0 && highlightIndex < filteredMachines.length) {
        const chosen = filteredMachines[highlightIndex];
        const chosenId = String(chosen.id ?? chosen.machine_id ?? "");
        setSelectedMachineIdStr(chosenId);
        setOpen(false);
        setSearchText(labelFor(chosen));
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
      const sel =
        machines.find((m) => String(m.id) === String(selectedMachineIdStr)) ||
        machines.find((m) => String(m.machine_id) === String(selectedMachineIdStr));
      if (sel) setSearchText(labelFor(sel));
      else setSearchText("");
      setHighlightIndex(-1);
    }
  };

  const onSelectMachine = (m: Machine) => {
    const id = String(m.id ?? m.machine_id ?? "");
    setSelectedMachineIdStr(id);
    setSearchText(labelFor(m));
    setOpen(false);
    setHighlightIndex(-1);
  };

  const toggleOpen = () => {
    setOpen((v) => {
      const next = !v;
      if (next) setTimeout(() => inputRef.current?.focus(), 0);
      return next;
    });
  };

  // validation states
  const machineInvalid = submitAttempted && !selectedMachineIdStr;
  const codeInvalid = submitAttempted && !operation_code.trim();
  const createDisabled = loading || !operation_code.trim() || !selectedMachineIdStr;

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
              Código <span className="text-danger">*</span>
            </Form.Label>
            <Col sm={8}>
              <Form.Control
                type="text"
                value={operation_code}
                onChange={(e) => {
                  setOperationCode(e.target.value);
                }}
                isInvalid={codeInvalid}
                disabled={loading}
              />
              <Form.Control.Feedback type="invalid">Código é obrigatório.</Form.Control.Feedback>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="machineSelect">
            <Form.Label column sm={4}>
              Cen. Trabalho <span className="text-danger">*</span>
            </Form.Label>
            <Col sm={8}>
              {machines.length > 0 ? (
                <div ref={wrapperRef} className="position-relative">
                  <InputGroup>
                    <input
                      ref={inputRef}
                      className={`form-control ${machineInvalid ? "is-invalid" : ""}`}
                      placeholder="Pesquisar ou selecione..."
                      value={searchText}
                      onChange={(e) => onInputChange(e.target.value)}
                      onFocus={() => {
                        setOpen(true);
                        setHighlightIndex(0);
                      }}
                      onKeyDown={onInputKeyDown}
                      disabled={loading}
                      aria-haspopup="listbox"
                      aria-expanded={open}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        toggleOpen();
                        if (!open && selectedMachineIdStr) {
                          const sel =
                            machines.find((m) => String(m.id) === String(selectedMachineIdStr)) ||
                            machines.find((m) => String(m.machine_id) === String(selectedMachineIdStr));
                          if (sel) setSearchText(labelFor(sel));
                        }
                      }}
                      aria-label={open ? "Fechar opções" : "Abrir opções"}
                    >
                      {open ? "▴" : "▾"}
                    </Button>
                  </InputGroup>

                  {machineInvalid && <div className="invalid-feedback d-block">É obrigatório selecionar uma máquina.</div>}

                  {open && (
                    <ul
                      role="listbox"
                      className="list-group position-absolute w-100"
                      style={{ zIndex: 1000, maxHeight: 240, overflowY: "auto" }}
                    >
                      {filteredMachines.length === 0 ? (
                        <li className="list-group-item text-muted">Nenhuma máquina corresponde à pesquisa.</li>
                      ) : (
                        filteredMachines.map((m, idx) => {
                          const label = labelFor(m);
                          const key = String(m.id ?? m.machine_id ?? idx);
                          const isHighlighted = idx === highlightIndex;
                          const isSelected = String(m.id ?? m.machine_id ?? "") === selectedMachineIdStr;
                          return (
                            <li
                              key={key}
                              role="option"
                              aria-selected={isSelected}
                              className={
                                "list-group-item list-group-item-action d-flex justify-content-between align-items-start" +
                                (isHighlighted ? " active" : "")
                              }
                              onMouseEnter={() => setHighlightIndex(idx)}
                              onMouseDown={(ev) => {
                                ev.preventDefault();
                                onSelectMachine(m);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {label}
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  )}
                </div>
              ) : (
                <Form.Text className="text-muted">Nenhuma máquina disponível. Crie máquinas no sistema antes de criar operações.</Form.Text>
              )}

              {/* hidden select for compatibility */}
              <select
                value={selectedMachineIdStr}
                onChange={(e) => setSelectedMachineIdStr(e.target.value)}
                style={{ display: "none" }}
              >
                <option value="">Selecione a máquina</option>
                {machines.map((m) => (
                  <option key={String(m.id ?? m.machine_id ?? "")} value={String(m.id ?? m.machine_id ?? "")}>
                    {labelFor(m)}
                  </option>
                ))}
              </select>
            </Col>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleCreate} disabled={createDisabled}>
          {loading ? <Spinner animation="border" size="sm" /> : "Criar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
