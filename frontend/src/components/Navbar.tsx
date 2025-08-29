import { Link, useNavigate } from "react-router-dom";
import { Navbar, Container, NavDropdown, Button } from "react-bootstrap";
import logo from "../assets/bitzer_logo.svg";
import { useAuth } from "../auth/AuthContext";

/**
 * Public AppNavbar
 * - Centered brand (original look)
 * - Right-side account controls (pinned to the far right via CSS)
 * - Admin button (React-Bootstrap Button) when user.is_admin
 * - Uses useAuth() logout
 */
export default function AppNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Navbar className="justify-content-center py-3 app-navbar" role="navigation">
      {/* Container is position: relative via CSS so the right-area can be absolutely positioned */}
      <Container className="justify-content-center app-navbar-container">
        {/* Centered brand (original look) */}
        <Navbar.Brand as={Link} to={"/"}>
          <img src={logo} alt="Bitzer Logo" height="60" className="d-inline-block align-top" />
        </Navbar.Brand>

        {/* Right-side account area (pinned to the right so brand stays centered) */}
        <div className="app-navbar-right">
          {/* Admin quick button (visible only for admin users) */}
          {user?.is_admin && (
            <Button
              variant="link"
              className="app-admin-button"
              onClick={() => navigate("/admin")}
            >
              Admin
            </Button>
          )}

          {/* Account dropdown / login button */}
          {user ? (
            <div className="app-user-dropdown-wrap">
              <NavDropdown
                id="public-user-dropdown"
                title={<span className="app-user-title">{user.name ?? "Conta"}</span>}
                align="end"
                menuVariant="dark"
                className="app-user-dropdown"
              >
                <NavDropdown.Item onClick={() => navigate("/profile")}>Perfil</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Sair</NavDropdown.Item>
              </NavDropdown>
            </div>
          ) : (
            <Button variant="link" onClick={() => navigate("/login")} className="app-login-button">
              Entrar
            </Button>
          )}
        </div>
      </Container>
    </Navbar>
  );
}
