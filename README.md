<div align="center">
  <img src="media/logo.png" alt="DevEnv Inspector Logo" width="120" />

  <h1>DevEnv Inspector</h1>

  <p>A unified desktop GUI for inspecting runtimes, managing global packages, monitoring active ports, and detecting virtual environments — no terminal required.</p>

  <p>
    <img src="https://img.shields.io/badge/version-0.5.0-5a7af5?style=for-the-badge" alt="Version" />
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey?style=for-the-badge" alt="Platform" />
    <img src="https://img.shields.io/badge/license-MIT-44c98b?style=for-the-badge" alt="License" />
    <img src="https://img.shields.io/badge/open%20source-%E2%9D%A4-e05454?style=for-the-badge" alt="Open Source" />
    <a href="https://www.npmjs.com/package/devenv-inspector-cli">
      <img src="https://img.shields.io/npm/v/devenv-inspector-cli?style=for-the-badge&logo=npm&color=cc3534" alt="npm CLI" />
    </a>
  </p>

  <p>
    <a href="https://github.com/ali-aldahmani/devenv-inspector/issues">
      <img src="https://img.shields.io/badge/Report%20a%20Bug-e05454?style=for-the-badge&logo=github&logoColor=white" alt="Report Bug" />
    </a>
    <a href="https://github.com/ali-aldahmani/devenv-inspector/issues">
      <img src="https://img.shields.io/badge/Request%20Feature-5a7af5?style=for-the-badge&logo=github&logoColor=white" alt="Request Feature" />
    </a>
    <a href="https://github.com/ali-aldahmani/devenv-inspector/fork">
      <img src="https://img.shields.io/badge/Fork%20this%20repo-44c98b?style=for-the-badge&logo=github&logoColor=white" alt="Fork" />
    </a>
  </p>

  <p align="center">
    <a href="https://www.buymeacoffee.com/alialdahmani" target="_blank">
      <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="40">
    </a>
  </p>
</div>

---

## What is this?

Developers who work across Python, Node.js, and Conda constantly switch between terminal commands just to see what's installed, what's running, and where their environments live. DevEnv Inspector puts it all in one window: runtime version badges, a searchable package table, one-click uninstall and upgrade, virtual environment detection, a live port viewer, and an in-app diagnostics panel.

<div align="center">
  <img src="media/screenshot.png" alt="DevEnv Inspector Screenshot" width="780" />
</div>

---

## Features

- **Runtime detection** — instantly shows installed versions of Python, Conda, Node.js, npm, Yarn, pnpm, nvm, and pyenv
- **Unified package table** — all pip, conda, npm, yarn, and pnpm global packages in one searchable list
- **Package update detection** — outdated packages shown with amber upgrade badges, one-click upgrade with confirmation
- **Safe uninstallation** — confirmation dialog before any package is removed
- **Filter by manager** — dynamically shows only the managers installed on your machine
- **Environments tab** — scans your machine for Python venv, Conda, Node, Poetry, and Pipenv environments
- **Custom scan folders** — add any directory to the environment scanner, saved across sessions
- **Create environment** — 3-step modal to create a new venv/conda/node/poetry environment and install packages, with live terminal output
- **Export to JSON / CSV** — export packages or environments with current filters applied
- **Active Ports tab** — see every TCP/UDP port in use: port number, protocol, PID, and process name
- **Kill process** — terminate any port's process with a single click and a confirmation dialog
- **Dark / light mode** — one-click toggle, preference saved across sessions
- **Diagnostics tab** — structured in-app logs from all key operations, copyable for bug reports
- **Plugin system** — add support for new package managers in a single file, zero changes to core code
- **No internet required** — everything runs locally against your machine

---

## Downloads

| Platform | Installer |
|---|---|
| 🍎 macOS (Apple Silicon) | [DevEnv-Inspector-0.5.0-arm64.dmg](https://github.com/ali-aldahmani/devenv-inspector/releases/latest) |
| 🍎 macOS (Intel) | [DevEnv-Inspector-0.5.0.dmg](https://github.com/ali-aldahmani/devenv-inspector/releases/latest) |
| 🪟 Windows (x64) | [DevEnv-Inspector-Setup-0.5.0.exe](https://github.com/ali-aldahmani/devenv-inspector/releases/latest) |

---

## CLI Companion

Prefer the terminal? The same functionality is available as a standalone npm package — **[devenv-inspector-cli on npm](https://www.npmjs.com/package/devenv-inspector-cli)**:
```bash
npm install -g devenv-inspector-cli
```
```bash
devenv list                        # show all runtimes
devenv packages                    # list all global packages
devenv packages --runtime pip      # filter by manager
devenv packages --runtime pnpm     # pnpm only
devenv uninstall numpy --runtime conda
devenv info pnpm
devenv ports                       # show all active local ports
```

> Source lives in [`cli/`](./cli) — same repo, zero Electron. Docker support included.

---

## Built With

<div align="center">
  <img src="https://skillicons.dev/icons?i=electron,react,vite,nodejs,python,npm,yarn,pnpm,docker,git&theme=dark" />
</div>

<div align="center">

| Technology | Role |
|---|---|
| <img src="https://img.shields.io/badge/Electron-47848f?style=flat-square&logo=electron&logoColor=white" /> | Desktop shell & system command execution |
| <img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=black" /> | Renderer UI & component state |
| <img src="https://img.shields.io/badge/Vite-646cff?style=flat-square&logo=vite&logoColor=white" /> | Build tooling via electron-vite |
| <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" /> | Runtime & IPC bridge |
| <img src="https://img.shields.io/badge/Python-3776ab?style=flat-square&logo=python&logoColor=white" /> | pip package detection & uninstall |
| <img src="https://img.shields.io/badge/npm-cc3534?style=flat-square&logo=npm&logoColor=white" /> | Global npm package detection |
| <img src="https://img.shields.io/badge/Yarn-2c8ebb?style=flat-square&logo=yarn&logoColor=white" /> | Global yarn package detection & uninstall |
| <img src="https://img.shields.io/badge/pnpm-f69220?style=flat-square&logo=pnpm&logoColor=white" /> | Global pnpm package detection & uninstall |
| <img src="https://img.shields.io/badge/Docker-2496ed?style=flat-square&logo=docker&logoColor=white" /> | Containerized CLI environment |
| <img src="https://img.shields.io/badge/Git-f05032?style=flat-square&logo=git&logoColor=white" /> | Version control |

</div>

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- npm v9 or later

### Installation
```bash
# Clone the repository
git clone https://github.com/ali-aldahmani/devenv-inspector.git

# Navigate into the project
cd devenv-inspector

# Install dependencies
npm install

# Start the app in development mode
npm run dev
```

### Build installers
```bash
npm run package
```

Produces installers in `dist/`:
- `DevEnv-Inspector-0.5.0-arm64.dmg` — macOS Apple Silicon
- `DevEnv-Inspector-0.5.0.dmg` — macOS Intel
- `DevEnv-Inspector-Setup-0.5.0.exe` — Windows x64

---

## How It Works
```
┌─────────────────────────────────────────────────────────────┐
│                      Renderer Process                       │
│  React UI — runtime cards, Packages, Environments,         │
│             Active Ports, Diagnostics tabs                  │
│  Tabs derived dynamically from registry metadata            │
└──────────────────────┬──────────────────────────────────────┘
                       │  IPC (contextBridge)
┌──────────────────────▼──────────────────────────────────────┐
│                      Main Process                           │
│  runtimes/builtins.js  →  registerRuntime() × 8            │
│  registry.js           →  getRegisteredRuntimes()           │
│  detectors.js          →  registry loop → versions          │
│  parsers.js            →  registry loop → packages          │
│  ports.js              →  lsof / netstat → TCP/UDP list     │
│  envDetector.js        →  scan dirs → virtual envs          │
│  envCreator.js         →  create venv/conda/node/poetry     │
│  exporter.js           →  JSON / CSV export                 │
│  diagnostics.js        →  structured in-app log store       │
│  ipcHandlers.js        →  all IPC channel routing           │
│  shell.js              →  login shell executor              │
└─────────────────────────────────────────────────────────────┘
```

Every command runs through the user's login shell (`zsh -i -l -c` on macOS, `cmd.exe /c` on Windows) so that conda, pyenv, nvm, and other shell-managed tools are always found — both in dev mode and in the packaged app.

---

## Supported Runtimes (v0.5.0)

| Runtime | Detect | Packages | Uninstall | Outdated |
|---|---|---|---|---|
| Python | `python3 --version` | `pip list --format=json` | `pip uninstall -y` | `pip list --outdated` |
| Anaconda | `conda --version` | `conda list --json` | `conda remove -y` | — |
| Node.js | `node --version` | — | — | — |
| npm | `npm --version` | `npm list -g --json` | `npm uninstall -g` | `npm outdated -g` |
| Yarn | `yarn --version` | `yarn global list --json` | `yarn global remove` | `yarn global outdated` |
| pnpm | `pnpm --version` | `pnpm list -g --json` | `pnpm remove -g` | `pnpm outdated -g` |
| nvm | `nvm --version` | installed Node versions | — | — |
| pyenv | `pyenv --version` | installed Python versions | — | — |

---

## Active Local Ports

The **Active Ports** tab gives you an instant overview of every listening port on your machine.

| Column | Description |
|---|---|
| **Port** | The open port number |
| **Protocol** | TCP or UDP |
| **PID** | Process ID using the port |
| **Process** | Name of the program / service |

- Search by port number, process name, or PID
- Filter by **TCP** / **UDP**
- Click **Kill** → confirmation dialog → sends `SIGTERM` to the process

---

## Environments Tab

Automatically scans your machine for virtual environments two levels deep across common directories (`~/Documents`, `~/Desktop`, `~/Projects`, `~/dev`, and Windows equivalents).

**Detected types:** Python venv · Conda · Node modules · Poetry · Pipenv

- **Custom scan folders** — add any directory via native folder picker, saved across sessions
- **Create Environment** — 3-step modal: choose type → pick packages → live install output
- **Open** button launches the project folder in your file explorer
- **Export** to JSON or CSV with current filters applied

---

## Plugin System

Each runtime is a self-describing plugin registered via `registerRuntime()`. The core detectors, parsers, IPC handlers, and renderer UI are all driven by the registry — zero hardcoded manager names.

### Adding a community runtime (e.g. Bun)

Create one file — `src/main/runtimes/bun.js`:
```js
import { registerRuntime } from '../registry.js'
import { runInShell } from '../shell.js'

registerRuntime({
  name:         'bun',
  label:        'Bun',
  color:        '#fbf0df',
  detect:       () => runInShell('bun', ['--version'], { timeout: 10000 }).catch(() => null),
  parseVersion: (o) => o.trim().replace(/^bun\s+v?/i, ''),
  list:         async () => { /* parse: bun pm ls --global */ },
  uninstall:    (pkg) => ['bun', ['remove', '-g', pkg]],
  outdated:     async () => { /* parse: bun outdated */ }
})
```

Then add **one import line** in `src/main/index.js`:
```js
import './runtimes/bun.js'
```

The runtime card, filter tab, package listing, upgrade badge, and uninstall button all appear automatically — **zero changes to core code**.

### Plugin shape reference

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Unique key (also used as `manager` in package rows) |
| `label` | `string` | Display name in UI and CLI |
| `color` | `string` | Hex color for the manager badge |
| `detect` | `async () => string \| null` | Returns raw stdout, or `null` if not installed |
| `parseVersion` | `(output) => string` | Cleans `detect()` output to a version string |
| `list` | `async () => [{name, version}] \| null` | `null` = no packages for this runtime |
| `uninstall` | `(pkg) => [cmd, args] \| null` | `null` = uninstall not supported |
| `outdated` | `async () => [{name, current, latest}] \| null` | `null` = outdated detection not supported |

---

## Roadmap

### Shipped
- [x] Python, Conda, Node.js, npm, Yarn, pnpm support
- [x] Searchable + filterable global package table
- [x] One-click uninstall with confirmation
- [x] CLI companion (`devenv-inspector-cli` on npm)
- [x] Docker support for the CLI
- [x] Plugin system — add any runtime in a single file
- [x] Active Local Ports — live TCP/UDP port viewer with kill support
- [x] Full UI redesign — dark terminal aesthetic with dark/light mode toggle
- [x] Package update detection with one-click upgrade
- [x] nvm / pyenv version manager support
- [x] Virtual environment detection (Environments tab)
- [x] Create environment modal with live package installer
- [x] Custom scan folders for environment detection
- [x] Export packages and environments to JSON / CSV
- [x] Diagnostics tab with copyable structured logs
- [x] Windows support

### Upcoming
- [ ] Linux support
- [ ] Dependency graph visualization
- [ ] Auto-update via `electron-updater`
- [ ] Docker container port integration

---

## Contributing

Contributions are what make open source great. Any contribution you make is **hugely appreciated**.

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-idea`
3. Commit your changes — `git commit -m "feat: your feature"`
4. Push to the branch — `git push origin feature/your-idea`
5. Open a Pull Request

---

## License

Distributed under the **MIT License** — see [`LICENSE`](LICENSE) for details.

---

<div align="center">
  <sub>Built with care for developers who want visibility and control over their local machine.</sub>
</div>