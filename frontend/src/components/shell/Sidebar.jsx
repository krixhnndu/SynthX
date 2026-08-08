import { NavLink } from "react-router-dom";
import { useAuth } from "../../api/auth";
import { Eyebrow } from "../ui/Primitives";
import { IconApprovals, IconCases, IconKnowledge, IconUsers } from "./icons";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/** Only routes that exist. No placeholder sections. */
const GROUPS = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Cases", Icon: IconCases },
      { to: "/approvals", label: "Approvals", Icon: IconApprovals },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/admin/knowledge-base", label: "Knowledge base", Icon: IconKnowledge },
      { to: "/admin/users", label: "Users", Icon: IconUsers, adminOnly: true },
    ],
  },
];

export default function Sidebar({ onNavigate }) {
  const { roles } = useAuth();
  const isAdmin = roles.includes("Admin");

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="border-b border-rule px-5 py-5">
        <div className="font-display text-xl leading-none tracking-tight text-ink">ClausePilot</div>
        <Eyebrow className="mt-1.5">Contract Intelligence</Eyebrow>
      </div>

      <nav className="flex-1 overflow-y-auto py-5">
        {GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.adminOnly || isAdmin);
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="mb-6">
              <Eyebrow className="px-5 pb-2">{group.label}</Eyebrow>
              {items.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cx(
                      "relative flex items-center gap-3 px-5 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-raised text-ink"
                        : "text-muted hover:bg-raised/60 hover:text-ink"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-ink" />}
                      <Icon className={isActive ? "text-ink" : "text-faint"} />
                      <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-rule px-5 py-4">
        <Eyebrow>Your roles</Eyebrow>
        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
          {roles.length === 0 ? (
            <span className="font-mono text-2xs text-faint">none assigned</span>
          ) : (
            roles.map((r) => (
              <span key={r} className="font-mono text-2xs text-muted">
                {r}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
