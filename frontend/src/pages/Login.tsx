import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, ListGroup, Container } from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";

/**
 * Simple login UI for development:
 * - Select a user from a short list and "login".
 * - Later you can replace submit with a real backend call.
 */
const DEV_USERS = [
  { id: 1, name: "Ruben Pequeno", bitzer_id: 1001, is_admin: true },
  { id: 2, name: "X1", bitzer_id: 1002, is_admin: false },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const from = (loc.state as any)?.from?.pathname ?? "/";

  const doLogin = (user: any) => {
    login(user);
    navigate(from, { replace: true });
  };

  return (
    <Container className="py-5">
      <Card>
        <Card.Body>
          <Card.Title>Efetuar Login (fake)</Card.Title>
          <div className="mb-2 text-muted">Escolha um utilizador de desenvolvimento</div>

          <ListGroup>
            {DEV_USERS.map((u) => (
              <ListGroup.Item key={u.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <small className="text-muted">Bitzer ID: {u.bitzer_id} {u.is_admin ? " — admin" : ""}</small>
                </div>
                <Button size="sm" onClick={() => doLogin(u)}>Entrar</Button>
              </ListGroup.Item>
            ))}
          </ListGroup>

          <div className="mt-3">
            <Button variant="light" size="sm" onClick={() => doLogin({ id: 9999, name: "Visitor", bitzer_id: null, is_admin: false })}>
              Entrar como visitante
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
