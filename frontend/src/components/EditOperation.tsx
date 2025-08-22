import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Button, Form, Spinner, Alert, Row, Col, InputGroup } from "react-bootstrap";
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

export default function EditOperationModal({ show, onHide, apiUrl, operation, fieldKey, initialValue, onSaved }: Props) {
  const [operationCode, setOperationCode] = useState<string>("");
  const [machines, setMachines] = useState<Machine[] | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null); // null means no machine
  const [loading, setLoading] = useState(false);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // combo states for machine edit
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // initialize local values based on field
  useEffect(() => {
    if (fieldKey === "operation_code") {
      setOperationCode(initialValue ?? operation?.operation_code ?? "");
    } else if (fieldKey === "machine_location") {
      setSelectedMachineId(operation?.machine?.id ?? null);
    }
    setError(null);
    setSearchText("");
    setOpen(false);
    setHighlightIndex(-1);
  }, [fieldKey, initialValue, operation, show]);

  // load machines
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

  // label: only machine_location and description
  const labelFor = (m: Machine) => {
    const loc = (m.machine_location ?? "").toString();
    const desc = (m.description ?? "").toString();
    return `${loc} — ${desc}`;
  };

  // sync visible input when selection changes
  useEffect(() => {
    if (!machines) return;
    if (selectedMachineId === null) {
      // leave blank unless user explicitly set "Nenhuma" (we show "Nenhuma" after click)
      // But if operation originally had no machine we keep it blank
      setSearchText("");
      setHighlightIndex(-1);
      return;
    }
    const sel = machines.find((m) => String(m.id) === String(selectedMachineId));
    if (sel) setSearchText(labelFor(sel));
    else setSearchText("");
    setHighlightIndex(-1);
  }, [machines, selectedMachineId]);

  // when user types, clear previous selection (force picking from list)
  const onInputChange = (value: string) => {
    setSearchText(value);
    if (selectedMachineId !== null) setSelectedMachineId(null);
    setOpen(true);
    setHighlightIndex(0);
  };

  // filtered by only machine_location and description
  const filteredMachines = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return machines ?? [];
    if (!machines) return [];
    return machines.filter((m) => {
      const loc = String(m.machine_location ?? "").toLowerCase();
      const desc = String(m.description ?? "").toLowerCase();
      return loc.includes(q) || desc.includes(q);
    });
  }, [machines, searchText]);

  // keyboard navigation & selection including top "Nenhuma" item
  const totalListCount = (filteredMachines?.length ?? 0) + 1;

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
          // Nenhuma
          setSelectedMachineId(null);
          setSearchText("Nenhuma");
        } else {
          const chosen = filteredMachines[highlightIndex - 1];
          setSelectedMachineId(Number(chosen.id));
          setSearchText(labelFor(chosen));
        }
        setOpen(false);
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
      const sel = machines?.find((m) => String(m.id) === String(selectedMachineId));
      if (sel) setSearchText(labelFor(sel));
      else setSearchText("");
      setHighlightIndex(-1);
    }
  };

  const onSelectNone = () => {
    setSelectedMachineId(null);
    setSearchText("Nenhuma");
    setOpen(false);
    setHighlightIndex(-1);
  };

  const onSelectMachine = (m: Machine) => {
    setSelectedMachineId(Number(m.id));
    setSearchText(labelFor(m));
    setOpen(false);
    setHighlightIndex(-1);
  };

  // click outside handler: close and enforce exact-match selection (otherwise clear)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        if (!machines) {
          setSearchText("");
          setSelectedMachineId(null);
          setHighlightIndex(-1);
          return;
        }

        const sel = machines.find((m) => String(m.id) === String(selectedMachineId));
        if (!sel) {
          const exact = machines.find((mm) => labelFor(mm).trim() === searchText.trim());
          if (exact) {
            setSelectedMachineId(Number(exact.id));
            setSearchText(labelFor(exact));
          } else {
            // if user typed "Nenhuma" exactly, accept it as clearing selection
            if (searchText.trim() === "Nenhuma") {
              setSelectedMachineId(null);
            } else {
              setSearchText("");
              setSelectedMachineId(null);
            }
          }
        } else {
          if (searchText.trim() !== labelFor(sel).trim()) {
            setSelectedMachineId(null);
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
  }, [wrapperRef, selectedMachineId, machines, searchText]);

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
      // send chosen machine id or null (clearing allowed)
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
        <Modal.Title>{fieldKey === "operation_code" ? "Editar Código de Operação" : "Editar Cen. Trabalho"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {fieldKey === "operation_code" ? (
          <Form.Group as={Row} className="mb-3" controlId="operationCode">
            <Form.Label column sm={4}>
              Código
            </Form.Label>
            <Col sm={8}>
              <Form.Control type="text" value={operationCode} onChange={(e) => setOperationCode(e.target.value)} disabled={loading} />
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
                <div ref={wrapperRef} className="position-relative">
                  <InputGroup>
                    <input
                      ref={inputRef}
                      className="form-control"
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
                        setOpen((v) => !v);
                        if (!open && selectedMachineId !== null) {
                          const sel = machines.find((m) => String(m.id) === String(selectedMachineId));
                          if (sel) setSearchText(labelFor(sel));
                        }
                        setHighlightIndex(0);
                      }}
                      aria-label={open ? "Fechar opções" : "Abrir opções"}
                    >
                      {open ? "▴" : "▾"}
                    </Button>
                  </InputGroup>

                  {open && (
                    <ul role="listbox" className="list-group position-absolute w-100" style={{ zIndex: 1000, maxHeight: 240, overflowY: "auto" }}>
                      {/* Nenhuma at top */}
                      <li
                        key="none"
                        role="option"
                        aria-selected={selectedMachineId === null && searchText === "Nenhuma"}
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

                      {filteredMachines.length === 0
                        ? null
                        : filteredMachines.map((m, idx) => {
                            const label = labelFor(m);
                            const listIndex = idx + 1;
                            const key = String(m.id ?? idx);
                            const isHighlighted = listIndex === highlightIndex;
                            const isSelected = String(m.id) === String(selectedMachineId);
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
                          })}
                      {filteredMachines.length === 0 && <li className="list-group-item text-muted">Nenhuma máquina corresponde à pesquisa.</li>}
                    </ul>
                  )}
                </div>
              ) : (
                <Form.Control type="number" value={selectedMachineId ?? ""} onChange={(e) => setSelectedMachineId(e.target.value === "" ? null : Number(e.target.value))} disabled={loading} />
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
