import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../api/auth";

const ROLE_COLORS = {
  Admin: "bg-ink text-paper",
  Reviewer: "bg-white border border-rule",
  Finance: "bg-white border border-rule",
  Procurement: "bg-white border border-rule",
  Legal: "bg-white border border-rule",
  Viewer: "bg-white border border-rule",
};

export default function Users() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleNames, setRoleNames] = useState([]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/users")).data,
  });

  const { data: rolesList = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await api.get("/users/roles")).data,
  });

  const toggleRole = (name) =>
    setRoleNames((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));

  const createUser = useMutation({
    mutationFn: () => api.post("/users", { name, email, password, roles: roleNames }),
    onSuccess: () => {
      setName("");
      setEmail("");
      setPassword("");
      setRoleNames([]);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => setError(err.response?.data?.detail ?? "The user couldn't be created."),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/users/${id}`, body),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => setError(err.response?.data?.detail ?? "The user couldn't be updated."),
  });

  if (!isAdmin)
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-sm text-severity-critical">Admin access required to manage users.</p>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link to="/dashboard" className="text-xs text-ink/50 underline">All cases</Link>
      <h1 className="text-3xl mt-1 mb-6">Users</h1>

      <div className="grid grid-cols-[360px_1fr] gap-8">
        <div>
          <h3 className="text-lg mb-3">Invite a user</h3>
          <div className="bg-white border border-rule rounded p-4 flex flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="border border-rule rounded px-3 py-2 text-sm"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="border border-rule rounded px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="border border-rule rounded px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              {rolesList.map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={roleNames.includes(r.name)}
                    onChange={() => toggleRole(r.name)}
                  />
                  {r.name}
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-severity-critical">{error}</p>}
            <button
              onClick={() => createUser.mutate()}
              disabled={!name.trim() || !email.trim() || !password || createUser.isPending}
              className="bg-ink text-paper px-4 py-2 rounded text-sm font-medium disabled:opacity-40"
            >
              Create user
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg mb-3">All users</h3>
          {isLoading ? (
            <p className="text-sm text-ink/60">Loading.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
                <tr className="border-b border-rule">
                  <th className="py-2">Name</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-rule/60">
                    <td className="py-3 font-medium">{u.name}</td>
                    <td className="text-ink/60">{u.email}</td>
                    <td className="flex flex-wrap gap-1 py-3">
                      {rolesList.map((r) => {
                        const on = u.roles.includes(r.name);
                        return (
                          <button
                            key={r.id}
                            onClick={() =>
                              updateUser.mutate({
                                id: u.id,
                                body: {
                                  roles: on
                                    ? u.roles.filter((x) => x !== r.name)
                                    : [...u.roles, r.name],
                                },
                              })
                            }
                            className={`px-2 py-0.5 rounded text-xs ${
                              on
                                ? ROLE_COLORS[r.name] ?? "bg-ink text-paper"
                                : "border border-rule text-ink/40"
                            }`}
                          >
                            {r.name}
                          </button>
                        );
                      })}
                    </td>
                    <td>
                      <button
                        onClick={() => updateUser.mutate({ id: u.id, body: { isActive: !u.isActive } })}
                        className={`px-2 py-0.5 rounded text-xs border ${
                          u.isActive ? "border-ink text-ink" : "border-rule text-ink/40"
                        }`}
                      >
                        {u.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
