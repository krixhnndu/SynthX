import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Server state lives in the query cache; the socket only invalidates it.
 * Nothing server-derived is copied into local state.
 */
export function useCaseSocket(caseId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!caseId) return;
    const token = sessionStorage.getItem("access_token");
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(
      `${protocol}://${window.location.host}/api/ws/contracts/${caseId}?token=${token}`
    );

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "heartbeat") return;
      queryClient.invalidateQueries({ queryKey: ["case-status", caseId] });
      if (payload.status === "completed" || payload.type === "stage") {
        queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      }
    };

    return () => socket.close();
  }, [caseId, queryClient]);
}
