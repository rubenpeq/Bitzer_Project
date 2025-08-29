import { Container, Row, Col, Card, Button, ListGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();

  return (
    <Container fluid className="py-4">
      <Row className="mb-3 align-items-center">
        <Col>
          <h2 style={{ fontWeight: 700 }}>Painel de Administração</h2>
          <div style={{ color: "#9fb2c8" }}>Visão geral e acesso rápido às ferramentas administrativas</div>
        </Col>
        <Col xs="auto">
          <Button variant="outline-light" className="me-2" onClick={() => navigate("/admin/users/new")}>
            Novo Utilizador
          </Button>
          <Button variant="light" onClick={() => navigate("/admin/machines/new")}>
            Nova Máquina
          </Button>
        </Col>
      </Row>

      <Row className="g-3">
        {/* Left column (hidden on small screens) */}
        <Col lg={3} className="d-none d-lg-block">
          <Card bg="dark" text="light" className="mb-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <Card.Body>
              <Card.Title style={{ fontSize: "0.85rem", color: "#9fb2c8" }}>Estatísticas Rápidas</Card.Title>
              <ListGroup variant="flush" className="mt-2">
                <ListGroup.Item style={{ background: "transparent", border: "none", paddingLeft: 0 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <small>Máquinas</small>
                    <strong>—</strong>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item style={{ background: "transparent", border: "none", paddingLeft: 0 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <small>Utilizadores Ativos</small>
                    <strong>—</strong>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item style={{ background: "transparent", border: "none", paddingLeft: 0 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <small>Ordens Abertas</small>
                    <strong>—</strong>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          <Card bg="dark" text="light" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <Card.Body>
              <Card.Title style={{ fontSize: "0.85rem", color: "#9fb2c8" }}>Ações Rápidas</Card.Title>
              <div className="d-grid gap-2 mt-2">
                <Button variant="outline-light" onClick={() => navigate("/admin/machines")}>Gerir Máquinas</Button>
                <Button variant="outline-light" onClick={() => navigate("/admin/users")}>Gerir Utilizadores</Button>
                <Button variant="outline-light" onClick={() => navigate("/admin/orders")}>Ordens e Tarefas</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Main column */}
        <Col lg={6}>
          <Card bg="dark" text="light" style={{ minHeight: 360, borderColor: "rgba(255,255,255,0.06)" }}>
            <Card.Body>
              <Card.Title style={{ color: "#9fb2c8" }}>Gráficos Principais</Card.Title>
              <div className="mt-3" style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(255,255,255,0.04)", borderRadius: 6 }}>
                <div style={{ textAlign: "center", color: "#8aa0b8" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Análises</div>
                  <div style={{ maxWidth: 420 }}>Espaço reservado para gráficos (produção vs defeitos, utilizadores ativos, throughput).</div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card bg="dark" text="light" className="mt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <Card.Body>
              <Row>
                <Col>
                  <Card.Title style={{ fontSize: "0.85rem", color: "#9fb2c8" }}>Ordens Recentes</Card.Title>
                  <div style={{ color: "#8aa0b8" }} className="mt-2">Sem ordens recentes para mostrar (espaço reservado).</div>
                </Col>
                <Col xs="auto" className="align-self-center">
                  <Button variant="outline-light" onClick={() => navigate('/admin/orders')}>Ir para Ordens</Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Right column */}
        <Col lg={3} className="d-none d-lg-block">
          <Card bg="dark" text="light" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <Card.Body>
              <Card.Title style={{ fontSize: "0.85rem", color: "#9fb2c8" }}>Manutenção Programada</Card.Title>
              <ListGroup variant="flush" className="mt-2">
                <ListGroup.Item style={{ background: "transparent", border: "none", paddingLeft: 0 }}>
                  <div><strong>2025-09-01</strong> — Verificação Máquina 13818</div>
                </ListGroup.Item>
                <ListGroup.Item style={{ background: "transparent", border: "none", paddingLeft: 0 }}>
                  <div><strong>2025-09-03</strong> — Inspeção de linha</div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          <Card bg="dark" text="light" className="mt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <Card.Body>
              <Card.Title style={{ fontSize: "0.85rem", color: "#9fb2c8" }}>Sistema</Card.Title>
              <div className="mt-2" style={{ color: "#8aa0b8" }}>
                Backend: <strong>OK</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card bg="dark" text="light" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <Card.Body>
              <Card.Title style={{ color: "#9fb2c8" }}>Notas</Card.Title>
              <div style={{ color: "#8aa0b8" }} className="mt-2">Use esta área para notas administrativas ou links para páginas operacionais.</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
