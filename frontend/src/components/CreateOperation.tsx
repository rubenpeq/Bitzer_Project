import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner, InputGroup } from "react-bootstrap";
import { type Operation, type Machine } from "../utils/Types";

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
  const [selectedMachineIdStr, setSelectedMachineIdStr] = useState<string>(""); // "" = no selection, "NONE" = explicit none, otherwise numeric id string
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

  // ensure empty on open and fetch machines
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

    // selection is required but "NONE" is accepted (means explicit none)
    if (selectedMachineIdStr === "") {
      setError("Selecionar uma máquina é obrigatório (ou escolha 'Nenhuma').");
      return;
    }

    setLoading(true);
    try {
      const resolvedId = await resolveOrderId();

      const payload: any = {
        order_id: Number(resolvedId),
        operation_code: String(operation_code).trim(),
      };

      if (selectedMachineIdStr === "NONE") {
        payload.machine_id = null;
      } else {
        payload.machine_id = Number(selectedMachineIdStr);
      }

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

  // label: only machine_location and description
  const labelFor = (m: Machine) => {
    const loc = (m.machine_location ?? "").toString();
    const desc = (m.description ?? "").toString();
    return `${loc} — ${desc}`;
  };

  // sync visible input when selection changes (only by id or NONE)
  useEffect(() => {
    if (selectedMachineIdStr === "" ) {
      setSearchText("");
      setHighlightIndex(-1);
      return;
    }
    if (selectedMachineIdStr === "NONE") {
      setSearchText("Nenhuma");
      setHighlightIndex(-1);
      return;
    }
    const sel = machines.find((m) => String(m.id) === String(selectedMachineIdStr));
    if (sel) setSearchText(labelFor(sel));
    else setSearchText("");
    setHighlightIndex(-1);
  }, [selectedMachineIdStr, machines]);

  // when user types, clear previous selection (force picking from list)
  const onInputChange = (value: string) => {
    setSearchText(value);
    if (selectedMachineIdStr) setSelectedMachineIdStr("");
    setOpen(true);
    setHighlightIndex(0);
  };

  // filtered by only machine_location and description
  const filteredMachines = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return machines;
    return machines.filter((m) => {
      const loc = String(m.machine_location ?? "").toLowerCase();
      const desc = String(m.description ?? "").toLowerCase();
      return loc.includes(q) || desc.includes(q);
    });
  }, [machines, searchText]);

  // keyboard navigation & selection including the "Nenhuma" top item
  const totalListCount = filteredMachines.length + 1; // +1 for "Nenhuma"

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      setHighlightIndex(0);
      e.preventDefault();
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      setHighlightIndex((i) => Math.min(totalListCount - 1, Math.max(0, i + 1)));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlightIndex((i) => Math.max(0, i - 1));
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (highlightIndex >= 0 && highlightIndex < totalListCount) {
        if (highlightIndex === 0) {
          // Nenhuma selected
          setSelectedMachineIdStr("NONE");
          setSearchText("Nenhuma");
        } else {
          const chosen = filteredMachines[highlightIndex - 1];
          setSelectedMachineIdStr(String(chosen.id));
          setSearchText(labelFor(chosen));
        }
        setOpen(false);
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
      // restore selection label or clear
      if (selectedMachineIdStr === "NONE") setSearchText("Nenhuma");
      else {
        const sel = machines.find((m) => String(m.id) === String(selectedMachineIdStr));
        if (sel) setSearchText(labelFor(sel));
        else setSearchText("");
      }
      setHighlightIndex(-1);
    }
  };

  const onSelectNone = () => {
    setSelectedMachineIdStr("NONE");
    setSearchText("Nenhuma");
    setOpen(false);
    setHighlightIndex(-1);
  };

  const onSelectMachine = (m: Machine) => {
    setSelectedMachineIdStr(String(m.id));
    setSearchText(labelFor(m));
    setOpen(false);
    setHighlightIndex(-1);
  };

  // click outside handler: close and enforce exact-match selection (otherwise clear)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        const sel = machines.find((m) => String(m.id) === String(selectedMachineIdStr));
        if (!sel && selectedMachineIdStr !== "NONE") {
          // allow exact-match auto-select, otherwise clear visible text
          const exact = machines.find((mm) => labelFor(mm).trim() === searchText.trim());
          if (exact) {
            setSelectedMachineIdStr(String(exact.id));
            setSearchText(labelFor(exact));
          } else {
            setSearchText("");
            setSelectedMachineIdStr("");
          }
        } else {
          // if selection is NONE, keep "Nenhuma" label; if selection is a machine, ensure label matches
          if (selectedMachineIdStr === "NONE") {
            setSearchText("Nenhuma");
          } else if (sel) {
            if (searchText.trim() !== labelFor(sel).trim()) {
              setSelectedMachineIdStr("");
              setSearchText("");
            } else {
              setSearchText(labelFor(sel));
            }
          }
        }
        setHighlightIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, selectedMachineIdStr, machines, searchText]);

  // validation states
  const machineInvalid = submitAttempted && selectedMachineIdStr === "";
  const codeInvalid = submitAttempted && !operation_code.trim();
  const createDisabled = loading || !operation_code.trim() || selectedMachineIdStr === "";

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
                onChange={(e) => setOperationCode(e.target.value)}
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
                      placeholder="Pesquisar por localização ou descrição..."
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
                        setOpen(v => !v);
                        if (!open && selectedMachineIdStr) {
                          if (selectedMachineIdStr === "NONE") setSearchText("Nenhuma");
                          else {
                            const sel = machines.find((m) => String(m.id) === String(selectedMachineIdStr));
                            if (sel) setSearchText(labelFor(sel));
                          }
                        }
                        setHighlightIndex(0);
                      }}
                      aria-label={open ? "Fechar opções" : "Abrir opções"}
                    >
                      {open ? "▴" : "▾"}
                    </Button>
                  </InputGroup>

                  {machineInvalid && <div className="invalid-feedback d-block">É obrigatório selecionar uma máquina.</div>}

                  {open && (
                    <ul role="listbox" className="list-group position-absolute w-100" style={{ zIndex: 1000, maxHeight: 240, overflowY: "auto" }}>
                      {/* First item: Nenhuma */}
                      <li
                        key="none"
                        role="option"
                        aria-selected={selectedMachineIdStr === "NONE"}
                        className={"list-group-item list-group-item-action" + (highlightIndex === 0 ? " active" : "")}
                        onMouseEnter={() => setHighlightIndex(0)}
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          onSelectNone();
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Nenhuma</div>
                      </li>

                      {filteredMachines.length === 0 ? (
                        null
                      ) : (
                        filteredMachines.map((m, idx) => {
                          const label = labelFor(m);
                          const listIndex = idx + 1; // offset by 1 because "Nenhuma" is first
                          const key = String(m.id ?? idx);
                          const isHighlighted = listIndex === highlightIndex;
                          const isSelected = String(m.id) === selectedMachineIdStr;
                          return (
                            <li
                              key={key}
                              role="option"
                              aria-selected={isSelected}
                              className={"list-group-item list-group-item-action" + (isHighlighted ? " active" : "")}
                              onMouseEnter={() => setHighlightIndex(listIndex)}
                              onMouseDown={(ev) => {
                                ev.preventDefault();
                                onSelectMachine(m);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
                            </li>
                          );
                        })
                      )}
                      {filteredMachines.length === 0 && (
                        <li className="list-group-item text-muted">Nenhuma máquina corresponde à pesquisa.</li>
                      )}
                    </ul>
                  )}
                </div>
              ) : (
                <Form.Text className="text-muted">Nenhuma máquina disponível. Crie máquinas no sistema antes de criar operações.</Form.Text>
              )}
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
