import { XpButton } from "@/components/ui/XpButton";

interface StatefulSessionBarProps {
  /** True once a session is started and ready for request runs. */
  active: boolean;
  /** True while the create request is in flight. */
  starting: boolean;
  /** Transient notice (start failure, expiry, reset). */
  notice: string | null;
  onStart: () => void;
  onReset: () => void;
}

/**
 * Stateful-session strip under the editor (Phase 9A). A session must be
 * started before Run/Check Solution is meaningful — starting it allocates an
 * isolated PHP workspace whose sessions and cookie jar persist across the
 * learner's requests. Reset Session destroys that server-side session; it is
 * intentionally separate from the editor's Reset button.
 */
export function StatefulSessionBar({
  active,
  starting,
  notice,
  onStart,
  onReset,
}: StatefulSessionBarProps) {
  return (
    <div className={`stateful-bar ${active ? "is-active" : ""}`}>
      <span className="stateful-indicator" aria-hidden="true">
        Execution: Stateful PHP
      </span>
      {active ? (
        <>
          <span className="stateful-active-text">Session active</span>
          <span className="stateful-actions">
            <XpButton
              onClick={onReset}
              disabled={starting}
              aria-label="Destroy the practice session and its on-server state"
            >
              Reset Session
            </XpButton>
          </span>
        </>
      ) : (
        <span className="stateful-actions">
          <XpButton
            onClick={onStart}
            disabled={starting}
            aria-label="Start a new isolated practice session"
          >
            {starting ? "Starting…" : "Start Practice Session"}
          </XpButton>
        </span>
      )}
      {notice ? <span className="stateful-notice">{notice}</span> : null}
    </div>
  );
}