export function UploadProgress({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="progress-wrap" aria-label={`Upload progress: ${pct}%`}>
      <div className="progress-label">
        <span>Uploading to Drive…</span>
        <span>{pct}%</span>
      </div>
      <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
