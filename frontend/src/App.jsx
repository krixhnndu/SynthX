import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/shell/AppShell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CaseWorkspace from "./pages/CaseWorkspace";
import AuditTrail from "./pages/AuditTrail";
import KnowledgeBase from "./pages/KnowledgeBase";
import Approvals from "./pages/Approvals";
import Users from "./pages/Users";
import { useAuth } from "./api/auth";

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Every authenticated route renders inside the shell. */}
      <Route
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contracts/:caseId" element={<CaseWorkspace />} />
        <Route path="/contracts/:caseId/audit" element={<AuditTrail />} />
        <Route path="/admin/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/admin/users" element={<Users />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
