import { Navbar, Container } from "react-bootstrap";
import logo from "../assets/bitzer_logo.svg";
import { Link } from "react-router-dom";

export default function AppNavbar() {
  return (
    <Navbar bg="light" className="justify-content-center py-3">
      <Container className="justify-content-center">
        <Navbar.Brand as={Link} to={'/'}>
          <img
            src={logo}
            alt="Bitzer Logo"
            height="60"
            className="d-inline-block align-top"
          />
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
}
