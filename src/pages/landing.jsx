import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>PorterSaathi</h1>
      <p>Book a coolie instantly at railway stations</p>

      <div style={{ marginTop: "20px" }}>
        <Link to="/login">Login</Link> |{" "}
        <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  );
}
