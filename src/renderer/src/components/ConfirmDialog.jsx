export default function ConfirmDialog({ pkg, onConfirm, onCancel }) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog-title">Remove Package</h2>
        <p className="dialog-body">
          Are you sure you want to uninstall{' '}
          <strong>{pkg.name}</strong>{' '}
          <span className={`manager-badge manager-${pkg.manager}`}>{pkg.manager}</span>?
        </p>
        <p className="dialog-sub">This action cannot be undone from this app.</p>
        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-delete" onClick={onConfirm}>
            Uninstall
          </button>
        </div>
      </div>
    </div>
  )
}
