import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../api/auth";
import Button from "../components/ui/Button";
import { Checkbox, Label, TextInput } from "../components/ui/Inputs";
import DataTable from "../components/ui/DataTable";
import { EmptyState, ErrorNote, Eyebrow, Panel, SectionHeading } from "../components/ui/Primitives";

const cx = (...parts) => parts.filter(Boolean).join(" ");

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

  const toggleRole = (roleName) =>
    setRoleNames((prev) =>
      prev.includes(roleName) ? prev.filter((x) => x !== roleName) : [...prev, roleName]
    );

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
      <div className="mx-auto max-w-6xl">
        <Eyebrow>Administration</Eyebrow>
        <h1 className="mt-1 font-display text-3xl leading-none text-ink">Users</h1>
        <ErrorNote className="mt-6">Admin access is required to manage users.</ErrorNote>
      </div>
    );

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <span className="block">
          <span className="block text-sm text-ink">{u.name}</span>
          <span className="mt-0.5 block font-mono text-2xs text-faint">{u.email}</span>
        </span>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      width: "50%",
      render: (u) => (
        <span className="flex flex-wrap gap-1.5">
          {rolesList.map((r) => {
            const on = u.roles.includes(r.name);
            return (
              <button
                key={r.id}
                onClick={() =>
                  updateUser.mutate({
                    id: u.id,
                    body: {
                      roles: on ? u.roles.filter((x) => x !== r.name) : [...u.roles, r.name],
                    },
                  })
                }
                aria-pressed={on}
                className={cx(
                  "border px-2 py-0.5 font-mono text-2xs uppercase tracking-label cursor-pointer transform transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0.5",
                  on ? "border-ink bg-ink text-paper" : "border-rule text-faint"
                )}
              >
                {r.name}
              </button>
            );
          })}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Access",
      align: "right",
      render: (u) => (
        <button
          onClick={() => updateUser.mutate({ id: u.id, body: { isActive: !u.isActive } })}
          className={cx(
            "border px-2 py-0.5 font-mono text-2xs uppercase tracking-label cursor-pointer transform transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0.5",
            u.isActive ? "border-severity-low/60 text-severity-low" : "border-rule text-faint"
          )}
        >
          {u.isActive ? "Active" : "Disabled"}
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <Eyebrow>Administration</Eyebrow>
      <h1 className="mt-1 font-display text-3xl leading-none text-ink">Users</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Roles decide what a person can read and which cases they can decide on.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[340px_1fr]">
        <div>
          <SectionHeading title="Add a user" />
          <Panel className="mt-4">
            <Label htmlFor="u-name">Full name</Label>
            <TextInput
              id="u-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-4"
            />

            <Label htmlFor="u-email">Email</Label>
            <TextInput
              id="u-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4"
            />

            <Label htmlFor="u-password">Temporary password</Label>
            <TextInput
              id="u-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-5"
            />

            <Eyebrow className="mb-2">Roles</Eyebrow>
            <div className="mb-5 grid grid-cols-2 gap-2">
              {rolesList.map((r) => (
                <Checkbox
                  key={r.id}
                  label={r.name}
                  checked={roleNames.includes(r.name)}
                  onChange={() => toggleRole(r.name)}
                />
              ))}
            </div>

            {error && <ErrorNote className="mb-4">{error}</ErrorNote>}

            <Button
              variant="primary"
              onClick={() => createUser.mutate()}
              disabled={!name.trim() || !email.trim() || !password || createUser.isPending}
              className="w-full"
            >
              {createUser.isPending ? "Creating" : "Create user"}
            </Button>
          </Panel>
        </div>

        <div>
          <SectionHeading title="All users" meta={`${users.length} accounts`} />
          <DataTable
            className="mt-2"
            columns={columns}
            rows={users}
            rowKey={(u) => u.id}
            loading={isLoading}
            empty={<EmptyState title="No users">Create the first account on the left.</EmptyState>}
          />
        </div>
      </div>
    </div>
  );
}
