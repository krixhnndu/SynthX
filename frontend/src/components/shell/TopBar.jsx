import { useLocation, useMatch } from "react-router-dom";
import { useAuth } from "../../api/auth";
import Button from "../ui/Button";
import { Eyebrow } from "../ui/Primitives";
import { IconMenu } from "./icons";

const SECTION = [
  [/^\/dashboard/, "Cases"],
  [/^\/contracts\/[^/]+\/audit/, "Audit trail"],
  [/^\/contracts\//, "Case workspace"],
  [/^\/approvals/, "Approvals"],
  [/^\/admin\/knowledge-base/, "Knowledge base"],
  [/^\/admin\/users/, "Users"],
];

export default function TopBar({ onOpenNav }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  // Both hooks must run every render — ?? would short-circuit the second.
  const nested = useMatch("/contracts/:caseId/*");
  const exact = useMatch("/contracts/:caseId");
  const caseMatch = nested ?? exact;
  const section = SECTION.find(([re]) => re.test(pathname))?.[1] ?? "ClausePilot";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-rule bg-paper/95 px-4 backdrop-blur lg:px-8">
      <button
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="text-muted cursor-pointer transform transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0.5 lg:hidden"
      >
        <IconMenu width={16} height={16} />
      </button>

      <div className="flex min-w-0 items-baseline gap-3">
        <span className="truncate font-mono text-2xs uppercase tracking-label text-muted">
          {section}
        </span>
        {caseMatch?.params?.caseId && (
          <>
            <span aria-hidden className="text-faint">/</span>
            <span className="truncate font-mono text-2xs text-faint">
              {caseMatch.params.caseId}
            </span>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-4">
        <Eyebrow className="hidden sm:block">Session active</Eyebrow>
        <Button variant="ghost" size="sm" onClick={logout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
