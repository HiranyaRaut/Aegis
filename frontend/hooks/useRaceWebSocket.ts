import { useEffect, useRef } from "react";
import { useRaceStore } from "../store/useRaceStore";
import { DEFAULT_CIRCUIT_ID } from "../store/circuits";

export function useRaceWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const { 
    setSocket, 
    setConnectionStatus, 
    updateFromWebSocket, 
    setDriverAnalytics, 
    tickLocalTelemetry, 
    hasRealSocketData 
  } = useRaceStore();

  const setSocketRef = useRef(setSocket);
  const setConnectionStatusRef = useRef(setConnectionStatus);
  const updateFromWebSocketRef = useRef(updateFromWebSocket);
  const setDriverAnalyticsRef = useRef(setDriverAnalytics);

  useEffect(() => {
    setSocketRef.current = setSocket;
    setConnectionStatusRef.current = setConnectionStatus;
    updateFromWebSocketRef.current = updateFromWebSocket;
    setDriverAnalyticsRef.current = setDriverAnalytics;
  }, [setSocket, setConnectionStatus, updateFromWebSocket, setDriverAnalytics]);

  // 1. Local pacing telemetry loop (Activated when no real socket frames are active)
  useEffect(() => {
    let localInterval: NodeJS.Timeout | null = null;
    
    if (!hasRealSocketData) {
      localInterval = setInterval(() => {
        tickLocalTelemetry();
      }, 150);
    }
    
    return () => {
      if (localInterval) clearInterval(localInterval);
    };
  }, [hasRealSocketData, tickLocalTelemetry]);

  // 2. Main Socket Connection Manager
  useEffect(() => {
    let isCancelled = false;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    async function fetchHRPAnalytics() {
      try {
        const res = await fetch(`${apiUrl}/analytics/hrp`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setDriverAnalyticsRef.current(data);
        }
      } catch (err) {
        // Suppress console/terminal fetch errors to prevent breaking immersion.
      }
    }

    fetchHRPAnalytics();

    function connect() {
      if (isCancelled) return;

      const wsProtocol = apiUrl.startsWith("https") ? "wss:" : "ws:";
      const wsHost = apiUrl.replace(/^https?:\/\//, "");
      const wsUrl = `${wsProtocol}//${wsHost}/ws/telemetry`;
      
      setConnectionStatusRef.current("connecting");
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (isCancelled) {
          ws.close();
          return;
        }
        setSocketRef.current(ws);
        setConnectionStatusRef.current("connected");
        const activeCircuitId = useRaceStore.getState().currentCircuitId;
        if (activeCircuitId) {
          try {
            ws.send(JSON.stringify({ action: "select_circuit", circuit_id: activeCircuitId }));
          } catch (_) {}
        }
      };

      ws.onmessage = (event) => {
        if (isCancelled) return;
        try {
          const data = JSON.parse(event.data);
          updateFromWebSocketRef.current(data);
        } catch (e) {
          // Fail silently to maintain cyberpunk F1 cockpit visuals
        }
      };

      ws.onclose = () => {
        setSocketRef.current(null);
        setConnectionStatusRef.current("disconnected");
        if (!isCancelled) {
          reconnectTimer = setTimeout(() => {
            if (!isCancelled) connect();
          }, 4000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      socketRef.current = ws;
    }

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);
}
