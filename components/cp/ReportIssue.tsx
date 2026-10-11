"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { submitReport } from "@/lib/cp/store";
import { Button, Field, Modal, Select, Textarea } from "./ui";

/** Lets a learner flag incorrect or outdated content. Reports are stored with the account. */
export function ReportIssue({ refId, label }: { refId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("Incorrect answer or explanation");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function send() {
    if (message.trim().length < 10) return setError("Please describe the issue in at least 10 characters.");
    submitReport("content", `${kind} — ${label}`, message.trim(), refId);
    setSent(true);
    setMessage("");
    setError("");
  }

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setSent(false); }} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
        <Flag size={12} aria-hidden /> Report an issue with this content
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Report a content issue"
        footer={sent ? <Button onClick={() => setOpen(false)}>Done</Button> : <><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={send}>Submit report</Button></>}
      >
        {sent ? (
          <p className="text-sm leading-relaxed">Thank you — your report on <strong>{label}</strong> was saved. You can review your reports under Settings → Feedback.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">Reporting: <span className="text-foreground font-medium">{label}</span></p>
            <Field label="What is wrong?" htmlFor="report-kind">
              <Select id="report-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                {["Incorrect answer or explanation", "Outdated information", "Unclear wording", "Broken link or formatting", "Other"].map((k) => <option key={k}>{k}</option>)}
              </Select>
            </Field>
            <Field label="Details" htmlFor="report-msg" error={error}>
              <Textarea id="report-msg" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What should it say instead?" maxLength={1000} />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}
