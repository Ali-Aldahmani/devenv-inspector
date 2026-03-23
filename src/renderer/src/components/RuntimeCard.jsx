export default function RuntimeCard({ label, info, loading }) {
  const runtimeKey = String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <div className={`runtime-card runtime-${runtimeKey}`}>
      <span className="runtime-label">{label}</span>
      {loading || !info ? (
        <span className="badge badge-loading">—</span>
      ) : info.installed ? (
        <span className="badge badge-installed">v{info.version}</span>
      ) : (
        <span className="badge badge-missing">Not Installed</span>
      )}
    </div>
  )
}
