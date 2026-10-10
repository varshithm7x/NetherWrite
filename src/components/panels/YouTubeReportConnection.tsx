import { useEffect, useId, useRef, useState } from "react";
import { getAPI } from "../../utils/api";
import { isMissingYouTubeHandler, YOUTUBE_RESTART_MESSAGE } from "../../utils/learning-videos";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--interactive-accent)";
export function YouTubeReportConnection({ disabled, enabled, queries, onEnabledChange }: {
  disabled: boolean; enabled: boolean; queries: string[]; onEnabledChange: (enabled: boolean) => void;
}) {
  const [status, setStatus] = useState<{ configured: boolean; secureStorage: boolean; sessionOnly?: boolean } | null>(null);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const mounted = useRef(true);
  const saving = useRef(false);
  const keyInput = useRef<HTMLInputElement>(null);
  const statusVersion = useRef(0);
  const hintId = useId();
  const youtube = getAPI().youtube;
  async function refreshStatus() {
    if (!youtube || saving.current || disabled) return;
    const version = ++statusVersion.current;
    setChecking(true);
    try {
      const value = await youtube.status();
      if (mounted.current && version === statusVersion.current) {
        setStatus(value); setMessage("");
      }
    } catch (error) {
      if (mounted.current && version === statusVersion.current) setMessage(isMissingYouTubeHandler(error) ? YOUTUBE_RESTART_MESSAGE : "YouTube setup is unavailable. Restart NetherWrite and retry; save your key again if it cannot be unlocked.");
    } finally { if (mounted.current && version === statusVersion.current) setChecking(false); }
  }
  useEffect(() => {
    mounted.current = true;
    void refreshStatus();
    return () => { mounted.current = false; statusVersion.current++; };
  }, []);
  async function save(sessionOnly = false) {
    if (!youtube || saving.current || disabled) return;
    if (sessionOnly && typeof youtube.useSessionKey !== "function") { setMessage(YOUTUBE_RESTART_MESSAGE); return; }
    // Password managers can fill the DOM without firing React's change event.
    const displayedKey = (keyInput.current?.value ?? key).trim();
    if (!displayedKey) { setMessage("Enter your YouTube Data API key, then click Save YouTube Key."); return; }
    statusVersion.current++; setChecking(false);
    saving.current = true; setBusy(true); setMessage("");
    try {
      const value = await (sessionOnly ? youtube.useSessionKey(displayedKey) : youtube.saveKey(displayedKey));
      if (mounted.current) { setStatus(value); setKey(""); setMessage(value.sessionOnly ? "Key active for this session. It is kept only in memory and will be cleared when NetherWrite quits." : "Key saved securely. Enable video recommendations below before generating."); }
    } catch (error) { if (mounted.current) setMessage(isMissingYouTubeHandler(error) ? YOUTUBE_RESTART_MESSAGE : sessionOnly ? "Could not activate the session key. Check its format and retry." : "Could not save the YouTube key. Check its format and system credential storage, then retry."); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  async function disconnect() {
    if (!youtube || saving.current || disabled) return;
    statusVersion.current++; setChecking(false);
    saving.current = true; setBusy(true);
    try {
      const value = await youtube.disconnect();
      if (mounted.current) { setStatus(value); setKey(""); setMessage("YouTube key removed. Saved reports are kept."); onEnabledChange(false); }
    } catch { if (mounted.current) setMessage("Could not remove the YouTube key. Please retry."); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  return <section aria-label="YouTube setup" className="space-y-2 rounded-lg border border-(--border-subtle) p-2.5">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">YouTube videos</span><span className="text-[10px] text-(--text-muted)">{status?.sessionOnly ? "Session key active" : status?.configured ? "Key saved" : "Not connected"}</span></div>
    {!youtube ? <p className="text-[10px] text-(--text-muted)">Restart NetherWrite to enable YouTube setup. Browser mode does not support secure YouTube keys.</p> : <details>
      <summary className={`cursor-pointer rounded ${focus}`}>{status?.configured ? "Manage YouTube key" : "Connect YouTube"}</summary>
      <p className="text-[10px] text-(--text-muted)">Use your own Google Cloud key with YouTube Data API v3 enabled. It is encrypted on this device; it is never saved in notes or reports. Saving a key does not verify API access.</p>
      <button type="button" onClick={() => { void getAPI().openExternal("https://developers.google.com/youtube/v3/getting-started").catch(() => setMessage("Could not open the setup guide.")); }} className={`rounded underline ${focus}`}>YouTube API setup guide</button>
      <label className="mt-2 block">YouTube Data API key<input ref={keyInput} type="password" aria-label="YouTube Data API key" value={key} onChange={event => setKey(event.target.value)}
        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); void save(status?.secureStorage === false); } }}
        autoComplete="off" spellCheck={false} maxLength={200} disabled={busy}
        className={`mt-1.5 w-full min-w-0 rounded-md border border-(--border-medium) bg-(--bg-secondary) px-2.5 py-2 ${focus}`} /></label>
      <div className="mt-2 flex flex-wrap gap-3"><button type="button" onClick={() => void save()} disabled={busy || disabled || status?.secureStorage === false} className={`rounded-md border border-(--border-medium) bg-(--bg-active) px-2.5 py-1.5 font-medium hover:bg-(--bg-hover) disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}>{busy ? "Saving…" : "Save YouTube Key"}</button>
        {status?.secureStorage === false && <button type="button" onClick={() => void save(true)} disabled={busy || disabled} className={`rounded-md border border-(--border-medium) bg-(--bg-active) px-2.5 py-1.5 font-medium disabled:opacity-50 ${focus}`}>Use for this session</button>}
        {status?.configured && <button type="button" onClick={() => void disconnect()} disabled={busy || disabled} className={`rounded underline disabled:opacity-50 ${focus}`}>Remove YouTube Key</button>}</div>
      {status?.secureStorage === false && <p className="text-[10px] text-(--text-muted)">Secure system credential storage is unavailable. You can use a temporary key for this session; it will not be written to disk.</p>}
    </details>}
    <label className={`flex items-start gap-2 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}><input type="checkbox" aria-label="Include YouTube recommendations" aria-describedby={hintId} checked={enabled} disabled={disabled}
      onChange={event => onEnabledChange(event.target.checked)} className={`mt-0.5 ${focus}`} /><span>Include YouTube recommendations</span></label>
    <p id={hintId} className="m-0 text-[10px] leading-relaxed text-(--text-muted)">{disabled ? "Video selection is locked while the report is generating. Wait for it to finish or cancel generation." : checking ? "Checking YouTube connection…" : busy ? "Updating YouTube connection…"
      : !youtube ? "Restart the desktop app to enable YouTube setup."
      : status?.secureStorage === false && !status.sessionOnly ? "Secure credential storage is unavailable on this device. Enter the key and choose Use for this session."
      : !status?.configured ? "You can select this option now. Save your YouTube Data API key above before generating videos."
      : !queries.length ? "No eligible weak-topic queries are available for this note. You can enable the option, but this report will not search YouTube."
      : "Ready to include videos for the topic queries below."}</p>
    {youtube && <button type="button" onClick={() => void refreshStatus()} disabled={disabled || busy || checking} className={`rounded text-[10px] underline disabled:opacity-50 ${focus}`}>Refresh YouTube connection</button>}
    <p className="m-0 text-[10px] leading-relaxed text-(--text-muted)">Optional. Generating with videos sends only these topic queries to Google, using your API quota. Note contents and quiz answers are not sent. Saved reports reopen without searching.</p>
    {queries.length > 0 && <ul className="my-1 list-disc space-y-1 break-words pl-4 text-[10px] text-(--text-muted)">{queries.map(query => <li key={query}>{query}</li>)}</ul>}
    {message && <p role="status" className="m-0 text-[10px] text-(--text-muted)">{message}</p>}
  </section>;
}
