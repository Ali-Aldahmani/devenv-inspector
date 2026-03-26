import { useEffect, useMemo, useRef, useState } from 'react'

const TYPE_OPTIONS = [
  { id: 'venv', icon: '🐍', name: 'Python venv', desc: 'Create .venv in target folder' },
  { id: 'conda', icon: '🟢', name: 'Conda', desc: 'Create .conda-env in target folder' },
  { id: 'node', icon: '🟨', name: 'Node.js', desc: 'Initialize npm project' },
  { id: 'poetry', icon: '🟣', name: 'Poetry', desc: 'Create Poetry project' }
]

function normalizePackages(selectedPackages) {
  return selectedPackages
    .map((p) => ({
      name: p.name.trim(),
      version: p.version.trim()
    }))
    .filter((p) => p.name)
}

export default function CreateEnvironmentModal({
  scanFolders,
  onClose,
  onSuccess
}) {
  const [step, setStep] = useState(1)
  const [targetPath, setTargetPath] = useState(scanFolders[0] || '')
  const [envType, setEnvType] = useState('venv')
  const [pythonVersion, setPythonVersion] = useState('3.11')
  const [popular, setPopular] = useState([])
  const [packageInput, setPackageInput] = useState('')
  const [selectedPackages, setSelectedPackages] = useState([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [progressLines, setProgressLines] = useState([])
  const outputRef = useRef(null)

  const canUsePythonVersion = envType === 'venv' || envType === 'conda'

  useEffect(() => {
    let mounted = true
    window.electronAPI.getPopularPackages(envType).then((rows) => {
      if (mounted) setPopular(Array.isArray(rows) ? rows : [])
    }).catch(() => {
      if (mounted) setPopular([])
    })
    return () => { mounted = false }
  }, [envType])

  useEffect(() => {
    if (!outputRef.current) return
    outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [progressLines])

  const stepTitle = useMemo(() => {
    if (step === 1) return 'Choose location & type'
    if (step === 2) return 'Choose packages'
    return 'Creating environment'
  }, [step])

  const addPackage = (pkg) => {
    const name = String(pkg || '').trim()
    if (!name) return
    if (selectedPackages.some((p) => p.name.toLowerCase() === name.toLowerCase())) return
    setSelectedPackages((prev) => [...prev, { name, version: '' }])
  }

  const runCreate = async () => {
    setStep(3)
    setCreating(true)
    setCreateError('')
    setProgressLines([])

    const unsubscribe = window.electronAPI.onEnvCreateProgress((payload) => {
      setProgressLines((prev) => [...prev, payload])
    })

    try {
      const createResult = await window.electronAPI.createEnv(targetPath, envType, pythonVersion)
      if (!createResult?.success) {
        setCreateError(createResult?.message || 'Failed to create environment')
        setProgressLines((prev) => [...prev, { line: createResult?.message || 'Create failed', level: 'error' }])
        return
      }

      setProgressLines((prev) => [...prev, { line: createResult.message, level: 'success' }])

      const packagePayload = normalizePackages(selectedPackages)
      if (packagePayload.length > 0) {
        const installType = envType === 'venv' ? 'venv' : envType
        const installResult = await window.electronAPI.installPackages(targetPath, installType, packagePayload)
        if (!installResult?.success) {
          setCreateError('Environment created, but package installation failed.')
          return
        }
      }

      setProgressLines((prev) => [...prev, { line: 'Environment created successfully.', level: 'success' }])
    } finally {
      unsubscribe()
      setCreating(false)
    }
  }

  const handlePackageEnter = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    addPackage(packageInput)
    setPackageInput('')
  }

  const done = !creating && !createError && step === 3 && progressLines.some((l) => l.level === 'success')

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose])

  return (
    <div className="create-env-overlay" onClick={onClose}>
      <div className="create-env-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-env-steps">
          {[1, 2, 3].map((i) => (
            <span key={i} className={`step-dot ${step === i ? 'active' : ''}`} />
          ))}
        </div>
        <h2 className="create-env-title">{stepTitle}</h2>

        {step === 1 && (
          <div className="create-env-section">
            <label className="create-env-label">Target folder</label>
            <div className="create-env-row">
              <select
                className="create-env-select"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
              >
                {scanFolders.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                className="btn-add-folder"
                onClick={async () => {
                  const picked = await window.electronAPI.selectFolder()
                  if (picked) setTargetPath(picked)
                }}
              >
                Browse...
              </button>
            </div>

            <div className="type-grid">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  className={`type-card ${envType === opt.id ? `selected selected-${opt.id}` : ''}`}
                  onClick={() => setEnvType(opt.id)}
                >
                  <span className="type-icon">{opt.icon}</span>
                  <span className="type-name">{opt.name}</span>
                  <span className="type-desc">{opt.desc}</span>
                </button>
              ))}
            </div>

            {canUsePythonVersion && (
              <>
                <label className="create-env-label">Python version</label>
                <input
                  className="search-input"
                  value={pythonVersion}
                  onChange={(e) => setPythonVersion(e.target.value)}
                  placeholder="3.11"
                />
              </>
            )}

            <div className="create-env-actions">
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
              <button className="btn-refresh" disabled={!targetPath} onClick={() => setStep(2)}>Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="create-env-section">
            <input
              className="search-input"
              value={packageInput}
              onChange={(e) => setPackageInput(e.target.value)}
              onKeyDown={handlePackageEnter}
              placeholder="Type package name and press Enter"
            />

            <div className="popular-grid">
              {popular.map((pkg) => (
                <button key={pkg} className="popular-pill" onClick={() => addPackage(pkg)}>
                  {pkg}
                </button>
              ))}
            </div>

            <div className="selected-package-tags">
              {selectedPackages.map((pkg) => (
                <span key={pkg.name} className="selected-package-tag">
                  {pkg.name}
                  <input
                    className="selected-package-version"
                    placeholder="latest"
                    value={pkg.version}
                    onChange={(e) => setSelectedPackages((prev) => prev.map((p) => (
                      p.name === pkg.name ? { ...p, version: e.target.value } : p
                    )))}
                  />
                  <button
                    className="scan-folder-remove"
                    onClick={() => setSelectedPackages((prev) => prev.filter((p) => p.name !== pkg.name))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="create-env-actions">
              <button className="btn-cancel" onClick={() => setStep(1)}>Back</button>
              <button className="btn-refresh" onClick={runCreate}>Create Environment</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="create-env-section">
            <div className="terminal-output" ref={outputRef}>
              {progressLines.map((line, idx) => (
                <div
                  key={`${idx}-${line.line}`}
                  className={`terminal-line terminal-${line.level || 'info'}`}
                >
                  {line.line}
                </div>
              ))}
            </div>
            {creating && <div className="create-env-status">Creating...</div>}
            {createError && <div className="create-env-error">{createError}</div>}

            <div className="create-env-actions">
              {createError ? (
                <>
                  <button className="btn-cancel" onClick={() => setStep(2)}>Retry</button>
                  <button className="btn-delete" onClick={onClose}>Close</button>
                </>
              ) : done ? (
                <button
                  className="btn-refresh"
                  onClick={async () => {
                    await onSuccess()
                    onClose()
                  }}
                >
                  Done
                </button>
              ) : (
                <button className="btn-cancel" onClick={onClose}>Close</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
