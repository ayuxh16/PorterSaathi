import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css"; // make sure this file is imported

function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/booking");
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT SIDE */}
      <div className="login-left">
        <div className="ll-brand">
          <h2>PorterSaathi 🚉</h2>
        </div>

        <div className="ll-copy">
          <h2>Book trusted porters instantly</h2>
          <p>Fast, reliable, and safe luggage handling at railway stations.</p>

          <div className="ll-stats">
            <div className="ll-stat">
              <strong>500+</strong>
              <span>Porters</span>
            </div>
            <div className="ll-stat">
              <strong>1k+</strong>
              <span>Bookings</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">
        <div className="login-card">
          <h2>Login</h2>
          <p className="form-sub">Welcome back 👋</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                placeholder="Email"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button className="submit-btn">Login</button>
          </form>

          <div className="toggle-auth">
            Don’t have an account?{" "}
            <button onClick={() => navigate("/signup")}>
              Signup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;