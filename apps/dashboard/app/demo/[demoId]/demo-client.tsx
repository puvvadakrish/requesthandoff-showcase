"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { RetellWebClient } from "retell-client-js-sdk";

interface DemoClientProps {
  demoId: string;
  handoffDestination: "email" | "webhook" | "phone_review" | "unknown";
  hasVehicleIntakeField: boolean;
  urgencyPreview: string;
  blocked: boolean;
  blockReason: string;
  sessionCount: number;
  maxSessions: number;
  expiresAtLabel: string;
  bookingUrl: string;
}

interface ConnectResponse {
  status?: string;
  message?: string;
  error?: string;
  access_token?: string;
  call_id?: string;
  call_status?: string;
  session_count?: number;
  max_sessions?: number;
}

export function DemoClient({
  demoId,
  handoffDestination,
  hasVehicleIntakeField,
  urgencyPreview,
  blocked,
  blockReason,
  sessionCount,
  maxSessions,
  expiresAtLabel,
  bookingUrl,
}: DemoClientProps) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<ConnectResponse | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const retellClientRef = useRef<RetellWebClient | null>(null);

  useEffect(() => {
    const client = new RetellWebClient();
    retellClientRef.current = client;

    client.on("call_started", () => {
      setIsCallActive(true);
      setCallStatus("Call connected");
    });
    client.on("call_ended", () => {
      setIsCallActive(false);
      setCallStatus("Call ended. Structured handoff will be prepared after the call.");
    });
    client.on("agent_start_talking", () => setCallStatus("RequestHandoff is speaking"));
    client.on("agent_stop_talking", () => setCallStatus("Listening"));
    client.on("error", (error) => {
      setIsCallActive(false);
      setCallStatus((error as Error).message || "Retell call error");
      client.stopCall();
    });

    return () => {
      client.stopCall();
      retellClientRef.current = null;
    };
  }, []);

  function startDemo() {
    startTransition(async () => {
      const result = await fetch(`/api/demo/${demoId}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await result.json().catch(() => ({}))) as ConnectResponse;
      setResponse(body);
      if (!result.ok || !body.access_token) return;

      setCallStatus("Connecting audio...");
      await retellClientRef.current?.startCall({
        accessToken: body.access_token,
      });
    });
  }

  function stopDemo() {
    retellClientRef.current?.stopCall();
    setIsCallActive(false);
    setCallStatus("Call ended.");
  }

  const disabled = blocked || isPending || isCallActive;

  return (
    <div className="demo-call-panel">
      {blocked ? (
        <div className="demo-status-card demo-status-card-alert">{blockReason}</div>
      ) : (
        <>
          <div className="demo-call-actions">
            <button
              type="button"
              className="primary-button demo-call-button"
              onClick={startDemo}
              disabled={disabled}
            >
              {isPending ? "Starting..." : "Try the call"}
            </button>
            {isCallActive ? (
              <button
                type="button"
                className="secondary-button demo-call-button"
                onClick={stopDemo}
              >
                End call
              </button>
            ) : null}
            <a className="secondary-button" href="mailto:krish@requesthandoff.com">
              Email me what is wrong
            </a>
            <a
              className="secondary-button demo-schedule-button"
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Schedule 30 minutes
            </a>
          </div>
          <p className="demo-session-note">
            {sessionCount} / {maxSessions} sessions used · expires {expiresAtLabel}
          </p>
        </>
      )}

      {response ? (
        <div className="demo-status-card">
          <strong>{response.status === "ready" ? "Demo call" : "Demo connection"}</strong>
          <p>
            {response.message ??
              response.error ??
              "The demo connection returned an unexpected response."}
          </p>
          {callStatus ? <p>{callStatus}</p> : null}
          {response.call_id ? <p className="demo-call-id">Call ID: {response.call_id}</p> : null}
        </div>
      ) : null}

      <div className="demo-proof-card">
        <p className="eyebrow">Handoff proof preview</p>
        <p>
          This is the structured request format the owner reviews before anything routes to the
          current dispatch tool.
        </p>
        <dl className="demo-preview-facts">
          <div>
            <dt>Caller</dt>
            <dd>Captured during call</dd>
          </div>
          <div>
            <dt>{hasVehicleIntakeField ? "Vehicle/service" : "Request type"}</dt>
            <dd>{hasVehicleIntakeField ? "Vehicle + service needed" : "Service needed"}</dd>
          </div>
          <div>
            <dt>Urgency</dt>
            <dd>{urgencyPreview}</dd>
          </div>
          <div>
            <dt>Handoff</dt>
            <dd>
              {handoffDestination === "webhook"
                ? "Webhook / automation"
                : handoffDestination === "email"
                  ? "Email summary"
                  : "Owner review"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
