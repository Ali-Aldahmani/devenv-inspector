export default function KillDialog({ port, onConfirm, onCancel }) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog-title">Kill Process</h2>
        <p className="dialog-body">
          Are you sure you want to terminate{' '}
          <strong>{port.process}</strong>{' '}
          <span className="protocol-badge protocol-pid">PID {port.pid}</span>?
        </p>
        <p className="dialog-sub">
          This sends SIGTERM to the process on port {port.port}. Unsaved work may be lost.
        </p>
        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-kill" onClick={onConfirm}>
            Kill Process
          </button>
        </div>
      </div>
    </div>
  )
}
