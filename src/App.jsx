import { useState, useEffect } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProviderPage from "./pages/ProviderPage";
import LandingPage from "./pages/LandingPage";
import AdminPage from "./pages/AdminPage";

const API_BASE = "http://localhost:8080/api";

function App() {
  const [currentPage, setCurrentPage] = useState("landing"); 
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail"));

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (userEmail) localStorage.setItem("userEmail", userEmail);
    else localStorage.removeItem("userEmail");
  }, [token, userEmail]);

  async function handleLoginSuccess(tokenFromApi, emailFromApi) {
    setToken(tokenFromApi);
    setUserEmail(emailFromApi);
    
    // Check if user is admin and redirect accordingly
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenFromApi}`,
        },
      });

      if (res.ok) {
        const users = await res.json();
        const currentUser = users.find(u => u.email === emailFromApi);
        if (currentUser) {
          if (currentUser.role === "ADMIN") {
            setCurrentPage("admin");
            return;
          }
          // BOTH, UDLEJER users go to home (rental provider dashboard)
          // LEJER users also go to home (regular user dashboard)
          setCurrentPage("home");
          return;
        }
      }
    } catch (err) {
      console.error("Error checking user role:", err);
    }
    
    // Default to home page for non-admin users
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
    setCurrentPage("landing");
  }

  let content;
  if (currentPage === "landing") {
    content = (
      <LandingPage
        token={token}
        userEmail={userEmail}
        onNavigateToLogin={() => setCurrentPage("login")}
        onNavigateToRegister={() => setCurrentPage("register")}
        onNavigateToHome={() => setCurrentPage("home")}
      />
    );
  } else if (currentPage === "login") {
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
      <ProviderPage
        token={token}
        userEmail={userEmail}
        onLogout={handleLogout}
        onNavigateToLanding={() => setCurrentPage("landing")}
      />
    );
  } else if (currentPage === "admin") {
    content = (
      <AdminPage
        token={token}
        userEmail={userEmail}
        onLogout={handleLogout}
        onNavigateToLanding={() => setCurrentPage("landing")}
      />
    );
  }

  return (
    <div>
      {content}
    </div>
  );
}

export default App;
