export default function RuntimeCard({
  label,
  info,
  loading,
  hasUpdate = false,
  latestVersion = null,
  onUpdateClick
}) {
  const runtimeKey = String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <div className={`runtime-card runtime-${runtimeKey} ${hasUpdate ? 'runtime-has-update' : ''}`}>
      <span className="runtime-label">{label}</span>
      {loading || !info ? (
        <span className="badge badge-loading">—</span>
      ) : info.installed ? (
        <div className="runtime-version-wrap">
          <span className="badge badge-installed">v{info.version}</span>
          {hasUpdate && latestVersion && (
            <button
              type="button"
              className="runtime-update-pill"
              onClick={onUpdateClick}
              title={`Update to v${latestVersion}`}
            >
              ↑ v{latestVersion}
            </button>
          )}
        </div>
      ) : (
        <span className="badge badge-missing">Not Installed</span>
      )}
    </div>
  )
}
