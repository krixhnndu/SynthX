import { api } from "./client";

export function useAuth() {
  return {
    token: sessionStorage.getItem("access_token"),
    roles: JSON.parse(sessionStorage.getItem("roles") || "[]"),
    logout() {
      sessionStorage.clear();
      window.location.href = "/login";
    },
  };
}

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  sessionStorage.setItem("access_token", data.access_token);
  sessionStorage.setItem("refresh_token", data.refresh_token);
  sessionStorage.setItem("roles", JSON.stringify(data.roles));
  return data;
}
