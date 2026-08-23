// src/api/client.js
const API_BASE_URL = "http://127.0.0.1:8000/api";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid: Clear session & force re-login
    localStorage.removeItem("authToken");
    localStorage.removeItem("hasCreatedShop");
    window.location.reload();
    throw new Error("Session expired. Please log in again.");
  }

  return response;
}