<div align="center">
  <img src="media/logo.png" alt="DevEnv Inspector Logo" width="120" />

  <h1>DevEnv Inspector</h1>

  <p>A unified desktop GUI for inspecting runtimes, managing global packages, and monitoring active local ports — no terminal required.</p>

  <p>
    <img src="https://img.shields.io/badge/version-0.3.0-5a7af5?style=for-the-badge" alt="Version" />
    <img src="https://img.shields.io/badge/platform-macOS-lightgrey?style=for-the-badge&logo=apple" alt="Platform" />
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
</div>

---

## What is this?

Developers who work across Python, Node.js, and Conda constantly switch between terminal commands just to see what's installed — and what's running. DevEnv Inspector puts it all in one window: version badges, a searchable package list, one-click uninstallation, and a live view of every port in use on your machine.

<div align="center">
  <img src="media/screenshot.png" alt="DevEnv Inspector Screenshot" width="780" />
</div>

---

## Features

- **Runtime detection** — instantly shows installed versions of Python, Conda, Node.js, npm, Yarn, and pnpm
- **Unified package table** — all pip, conda, npm, yarn, and pnpm global packages in one searchable list
- **Safe uninstallation** — confirmation dialog before any package is removed
- **Filter by manager** — dynamically shows only the managers that are installed on your machine
- **Active Ports tab** — see every TCP/UDP port in use: port number, protocol, PID, and process name
- **Kill process** — terminate any port's process with a single click and a confirmation dialog
- **Graceful fallbacks** — missing runtimes show "Not Installed" and hide irrelevant filter tabs
- **Plugin system** — add support for new package managers in a single file, zero changes to core code
- **No internet required** — everything runs locally against your machine

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

### Package as a macOS app

```bash
npm run package
```

This builds the source and produces a `.dmg` installer in `dist/`:
- `DevEnv Inspector-0.3.0-arm64.dmg` — Apple Silicon
- `DevEnv Inspector-0.3.0.dmg` — Intel

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    Renderer Process                     │
│   React UI — runtime cards, Packages tab, Ports tab    │
│   Tabs derived dynamically from registry metadata       │
└──────────────────────┬──────────────────────────────────┘
                       │  IPC (contextBridge)
┌──────────────────────▼──────────────────────────────────┐
│                     Main Process                        │
│  runtimes/builtins.js  →  registerRuntime() × 6        │
│  registry.js           →  getRegisteredRuntimes()       │
│  detectors.js          →  registry loop → versions      │
│  parsers.js            →  registry loop → packages      │
│  ports.js              →  lsof → TCP/UDP port list      │
│  ipcHandlers.js        →  uninstall + kill-port routing │
│  shell.js              →  login shell executor          │
└─────────────────────────────────────────────────────────┘
```

Every command runs through the user's login shell (`zsh -i -l -c`) so that conda, pyenv, nvm, and other shell-managed tools are always found — both in dev mode and in the packaged `.app`.

---

## Supported Runtimes (v0.3.0)

| Runtime | Detect | Packages | Uninstall |
|---|---|---|---|
| Python | `python3 --version` | `python3 -m pip list --format=json` | `python3 -m pip uninstall -y` |
| Anaconda | `conda --version` | `conda list --json` | `conda remove -y` |
| Node.js | `node --version` | — | — |
| npm | `npm --version` | `npm list -g --depth=0 --json` | `npm uninstall -g` |
| Yarn | `yarn --version` | `yarn global list --json` | `yarn global remove` |
| pnpm | `pnpm --version` | `pnpm list -g --json` | `pnpm remove -g` |

---

## Active Local Ports

The **Active Ports** tab gives you an instant overview of every listening port on your machine — the same information as `lsof`, presented without the terminal.

| Column | Description |
|---|---|
| **Port** | The open port number |
| **Protocol** | TCP or UDP |
| **PID** | Process ID using the port |
| **Process** | Name of the program / service |

### In the GUI

- Switch to the **Active Ports** tab next to Packages — a live count badge shows how many ports are open
- Search by port number, process name, or PID
- Filter by **TCP** / **UDP**
- Click **Kill** on any row → confirmation dialog → sends `SIGTERM` to that process

### How ports are detected

`lsof -F pcn` is used with structured field output — no text parsing of headers, injection-safe. TCP ports are filtered to `LISTEN` state only. IPv4/IPv6 duplicates are deduplicated automatically.

---

## Plugin System

v0.3.0 ships a runtime registry that makes adding new package managers trivial. Each built-in (pip, conda, npm, yarn, pnpm) is now a self-describing plugin object registered via `registerRuntime()`. The core detectors, parsers, IPC handlers, and renderer UI are all driven by the registry — they contain zero hardcoded manager names.

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
  uninstall:    (pkg) => ['bun', ['remove', '-g', pkg]]
})
```

Then add **one import line** in `src/main/index.js`:

```js
import './runtimes/bun.js'
```

That's it. The runtime card, filter tab, package listing, and uninstall button all appear automatically — **zero changes to core code**.

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

---

## Roadmap

### Shipped
- [x] Python, Conda, Node.js, npm, Yarn, pnpm support
- [x] Searchable + filterable global package table
- [x] One-click uninstall with confirmation
- [x] CLI companion (`devenv-inspector-cli` on npm)
- [x] Docker support for the CLI
- [x] **Plugin system** — add any runtime in a single file
- [x] **Active Local Ports** — live TCP/UDP port viewer with process names and kill support

### Upcoming
- [ ] nvm / pyenv version manager support
- [ ] Virtual environment detection
- [ ] Package update detection (`outdated` view)
- [ ] Dependency graph visualization
- [ ] Dark / light mode toggle
- [ ] Windows & Linux support

---

## Contributing

Contributions are what make open source great. Any contribution you make is **hugely appreciated**.

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-idea`
3. Commit your changes — `git commit -m "Add your feature"`
4. Push to the branch — `git push origin feature/your-idea`
5. Open a Pull Request

</a>

---

## License

Distributed under the **MIT License** — see [`LICENSE`](LICENSE) for details.

---

<div align="center">
  <sub>Built with care for developers who just want to see what's on their machine.</sub>
</div>
