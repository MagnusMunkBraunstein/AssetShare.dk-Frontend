import { useState, useEffect } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";

function App() {
  const [currentPage, setCurrentPage] = useState("login"); 
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail"));

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (userEmail) localStorage.setItem("userEmail", userEmail);
    else localStorage.removeItem("userEmail");
  }, [token, userEmail]);

  function handleLoginSuccess(tokenFromApi, emailFromApi) {
    setToken(tokenFromApi);
    setUserEmail(emailFromApi);
    setCurrentPage("home");
  }

  function handleRegisterSuccess() {
    setCurrentPage("login");
  }

  async function handleLogout() {
    try {
      await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
      });
    } catch (err) {
      console.warn("Logout request failed", err);
    }

    setToken(null);
    setUserEmail(null);
    setCurrentPage("login");
  }

  let content;
  if (currentPage === "login") {
    content = (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setCurrentPage("register")}
      />
    );
  } else if (currentPage === "register") {
    content = (
      <RegisterPage
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => setCurrentPage("login")}
      />
    );
  } else if (currentPage === "home") {
    content = (
      <HomePage
        token={token}
        userEmail={userEmail}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#222", color: "white", padding: "10px 16px", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>AssetShare MVP</h1>
      </header>

      {content}
    </div>
  );
}

export default App;
