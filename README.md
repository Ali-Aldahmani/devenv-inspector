<div align="center">
  <img src="media/logo.png" alt="DevEnv Inspector Logo" width="120" />

  <h1>DevEnv Inspector</h1>

  <p>A unified desktop GUI for inspecting and managing your development runtimes and global packages — no terminal required.</p>

  <p>
    <img src="https://img.shields.io/badge/version-0.1.0-5a7af5?style=for-the-badge" alt="Version" />
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

Developers who work across Python, Node.js, and Conda constantly switch between terminal commands just to see what's installed. DevEnv Inspector puts it all in one window — version badges, a searchable package list, and one-click uninstallation.

<div align="center">
  <img src="media/screenshot.png" alt="DevEnv Inspector Screenshot" width="780" />
</div>

---

## Features

- **Runtime detection** — instantly shows installed versions of Python, Conda, and Node.js
- **Unified package table** — all pip, conda, and npm global packages in one searchable list
- **Safe uninstallation** — confirmation dialog before any package is removed
- **Filter by manager** — quickly scope the list to pip / conda / npm
- **Graceful fallbacks** — missing runtimes show "Not Installed" and hide irrelevant packages
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
devenv uninstall numpy --runtime conda
devenv info python
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
- `DevEnv Inspector-0.1.0-arm64.dmg` — Apple Silicon
- `DevEnv Inspector-0.1.0.dmg` — Intel

---

## How It Works

```
┌─────────────────────────────────────────────┐
│              Renderer Process               │
│   React UI — table, filters, dialogs        │
└──────────────────┬──────────────────────────┘
                   │  IPC (contextBridge)
┌──────────────────▼──────────────────────────┐
│               Main Process                  │
│  detectors.js  →  python3 / conda / node    │
│  parsers.js    →  pip / conda / npm --json  │
│  ipcHandlers.js → uninstall routing         │
│  shell.js      →  login shell executor      │
└─────────────────────────────────────────────┘
```

Every command runs through the user's login shell (`zsh -i -l -c`) so that conda, pyenv, nvm, and other shell-managed tools are always found — both in dev mode and in the packaged `.app`.

---

## Supported Runtimes (v0.1.0)

| Runtime | Packages | Uninstall |
|---|---|---|
| Python | `python3 -m pip list` | `python3 -m pip uninstall -y` |
| Anaconda | `conda list --json` | `conda remove -y` |
| Node.js | `npm list -g --depth=0` | `npm uninstall -g` |
| Yarn | `yarn global list --json` | `yarn global remove` |
| pnpm | `pnpm list -g --json` | `pnpm remove -g` |

---

## Roadmap

- [ ] nvm / pyenv support
- [ ] Virtual environment detection
- [ ] Package update detection
- [ ] Dependency graph visualization
- [ ] Dark / light mode toggle
- [ ] Plugin system for new package managers
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
