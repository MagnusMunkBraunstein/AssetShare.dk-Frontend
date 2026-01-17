import { useState, useEffect } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProviderPage from "./pages/ProviderPage";
import LandingPage from "./pages/LandingPage";
import AdminPage from "./pages/AdminPage";
import RenterPage from "./pages/RenterPage";

const API_BASE = "http://localhost:8080/api";

function App() {
  const [currentPage, setCurrentPage] = useState("landing"); 
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail"));
  const [userRole, setUserRole] = useState(() => localStorage.getItem("userRole"));

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (userEmail) localStorage.setItem("userEmail", userEmail);
    else localStorage.removeItem("userEmail");

    if (userRole) localStorage.setItem("userRole", userRole);
    else localStorage.removeItem("userRole");
  }, [token, userEmail, userRole]);

  async function fetchUserRole(activeToken, email) {
    if (!activeToken || !email) {
      return null;
    }
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
      });
      if (res.ok) {
        const users = await res.json();
        const currentUser = users.find((u) => u.email === email);
        return currentUser?.role ?? null;
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
    return null;
  }

  function resetAuthState() {
    setToken(null);
    setUserEmail(null);
    setUserRole(null);
    setCurrentPage("landing");
  }

  // Vi refresher ikke længere brugerrolle automatisk ved hver render,
  // for at undgå at et midlertidigt fejl-kald logger brugeren ud eller flytter siden.

  function pageForRole(role) {
    if (role === "ADMIN") return "admin";
    if (role === "LEJER") return "renter";
    return "home";
  }

  function handleLoginSuccess(tokenFromApi, emailFromApi, roleFromApi) {
    setToken(tokenFromApi);
    setUserEmail(emailFromApi);
    const effectiveRole = roleFromApi || "LEJER";
    setUserRole(effectiveRole);
    setCurrentPage(pageForRole(effectiveRole));
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

    resetAuthState();
  }

  async function handleNavigateToDashboard() {
    if (!token) {
      setCurrentPage("login");
      return;
    }

    // Hent altid seneste rolle fra backend, så ændringer (fx LEJER -> UDLEJER)
    // også slår igennem på landing page-knappen.
    const role = await fetchUserRole(token, userEmail);
    if (role) {
      setUserRole(role);
      setCurrentPage(pageForRole(role));
    } else if (userRole) {
      // If we can't fetch the role, use the one we already have
      console.warn("Unable to resolve user role from backend, using cached role");
      setCurrentPage(pageForRole(userRole));
    } else {
      console.warn("Unable to resolve user role and no cached role available");
      resetAuthState();
    }
  }

  let content;
  if (currentPage === "landing") {
    content = (
      <LandingPage
        token={token}
        userEmail={userEmail}
        onNavigateToLogin={() => setCurrentPage("login")}
        onNavigateToRegister={() => setCurrentPage("register")}
        onNavigateToDashboard={handleNavigateToDashboard}
        dashboardLabel={
          !token
            ? "Dashboard"
            : userRole === "ADMIN"
            ? "Admin Dashboard"
            : userRole === "LEJER"
            ? "Renter Dashboard"
            : userRole
            ? "Provider Dashboard"
            : "Dashboard"
        }
        dashboardDisabled={!token || !userRole}
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
  } else if (currentPage === "renter") {
    content = (
      <RenterPage
        token={token}
        userEmail={userEmail}
        onLogout={handleLogout}
        onNavigateToLanding={() => setCurrentPage("landing")}
        onSwitchToProvider={() => setCurrentPage("home")}
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
