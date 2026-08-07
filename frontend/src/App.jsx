import { Navigate, Route, Routes } from "react-router-dom";
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
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/contracts/:caseId" element={<Protected><CaseWorkspace /></Protected>} />
      <Route path="/contracts/:caseId/audit" element={<Protected><AuditTrail /></Protected>} />
      <Route path="/admin/knowledge-base" element={<Protected><KnowledgeBase /></Protected>} />
      <Route path="/approvals" element={<Protected><Approvals /></Protected>} />
      <Route path="/admin/users" element={<Protected><Users /></Protected>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
