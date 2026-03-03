export default function RuntimeCard({ label, info, loading }) {
  return (
    <div className="runtime-card">
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
