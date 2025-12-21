import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- Load current user ---------------- */
  useEffect(() => {
    if (!token) return;

    setLoading(true);

    fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  function refreshUser() {
    if (!token) return Promise.resolve();

    return fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data.user));
  }

  /* ---------------- Sign in ---------------- */
  function signIn(email, password) {
    return fetch(`${API_BASE}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.token) {
          throw new Error("Invalid login");
        }
        localStorage.setItem("token", data.token);
        setToken(data.token);
      });
  }

  /* ---------------- Log out ---------------- */
  function signOut() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  /* ---------------- Set favourite route ---------------- */
  function setFavouriteRoute(routeId) {
    if (!token) {
      return Promise.reject(new Error("Not authenticated"));
    }

    return fetch(`${API_BASE}/users/me/favourite-route`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ route_id: routeId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save favourite");
        return res.json();
      })
      .then((data) => {
        setUser((u) => ({
          ...u,
          favourite_route: data.favourite_route,
        }));
      });
  }

  /* ---------------- sign up ---------------- */
  function signUp(email, password) {
    return fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error("Signup failed");
      }
      // Automatically sign in after signup
      return signIn(email, password);
    });
  }

  return {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    setFavouriteRoute,
  };
}
