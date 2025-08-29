import { NavLink, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, NavDropdown, Button } from "react-bootstrap";
import { House, Gear, People, Boxes } from "react-bootstrap-icons";
import logo from "../assets/bitzer_logo.svg";
import { useAuth } from "../auth/AuthContext";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/"); // return to public app after logout
  };

  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark" className="border-bottom" sticky="top">
      <Container fluid>
        <Navbar.Brand onClick={() => navigate("/admin")} style={{ cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 12 }}>
          <img src={logo} alt="Bitzer Logo" height="36" className="d-inline-block align-top" />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="admin-navbar-nav" />
        <Navbar.Collapse id="admin-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/admin" end>
              <House className="me-1" /> Painel
            </Nav.Link>
            <Nav.Link as={NavLink} to="/admin/machines">
              <Boxes className="me-1" /> Máquinas
            </Nav.Link>
            <Nav.Link as={NavLink} to="/admin/users">
              <People className="me-1" /> Utilizadores
            </Nav.Link>
            <Nav.Link as={NavLink} to="/admin/orders">
              <Gear className="me-1" /> Ordens
            </Nav.Link>
          </Nav>

          <Nav className="d-flex align-items-center" style={{ gap: 8 }}>
            {/* Button to go back to main App (left of user controls) */}
            <Button variant="outline-light" size="sm" onClick={() => navigate("/")}>
              Ir para App
            </Button>

            {/* wrap the dropdown so we can give it a higher stacking context */}
            <div style={{ position: "relative", zIndex: 2000 }}>
              {user ? (
                <NavDropdown id="admin-dropdown" title={<span style={{ color: "#fff" }}>{user.name ?? "Conta"}</span>} align="end" menuVariant="dark">
                  <NavDropdown.Item onClick={() => navigate("/admin/profile")}>Perfil</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>Sair</NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link onClick={() => navigate("/login")} style={{ color: "#fff" }}>
                  Entrar
                </Nav.Link>
              )}
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
