<div align="center">
  <h1>devenv-inspector-cli</h1>
  <p>Inspect runtimes, manage global packages, and monitor active local ports from your terminal — no GUI required.</p>

  <p>
    <img src="https://img.shields.io/badge/version-0.6.0-5a7af5?style=for-the-badge" alt="Version" />
    <img src="https://img.shields.io/badge/platform-macOS-lightgrey?style=for-the-badge&logo=apple" alt="Platform" />
    <img src="https://img.shields.io/badge/license-MIT-44c98b?style=for-the-badge" alt="License" />
    <img src="https://img.shields.io/npm/v/devenv-inspector-cli?style=for-the-badge&logo=npm&color=cc3534" alt="npm" />
  </p>

  <img src="https://raw.githubusercontent.com/Ali-Aldahmani/devenv-inspector/main/cli/media/screenshot-cli.png" alt="devenv-inspector-cli screenshot" width="720" />
</div>

> Prefer a desktop GUI? Check out **[DevEnv Inspector](https://github.com/Ali-Aldahmani/devenv-inspector)** — the same features in a native macOS window.

---

## Install

### via npm
```bash
npm install -g devenv-inspector-cli
```

### via Docker
No Node.js or Python required — just Docker:

```bash
# Pull and run
docker run --rm ghcr.io/ali-aldahmani/devenv-inspector-cli list
docker run --rm ghcr.io/ali-aldahmani/devenv-inspector-cli packages
docker run --rm ghcr.io/ali-aldahmani/devenv-inspector-cli info python
docker run --rm ghcr.io/ali-aldahmani/devenv-inspector-cli ports

# Or build locally from source
git clone https://github.com/Ali-Aldahmani/devenv-inspector.git
cd devenv-inspector/cli
docker build -t devenv-inspector-cli .
docker run --rm devenv-inspector-cli list
```

> **Note:** Docker runs in an isolated container — it shows packages installed inside the image, not on your host machine. Use the npm install for inspecting your own machine.

---

## Commands

### `devenv list`
Show all installed runtimes with their versions.

```
$ devenv list

  DevEnv Inspector — Runtimes

  Python      3.13.5
  Conda       26.1.0
  Node.js     24.13.0
  npm         11.6.2
  Yarn        1.22.22
  pnpm        9.15.4
```

---

### `devenv packages [--runtime <mgr>]`
List all global packages. Optionally filter by manager.

```bash
devenv packages                  # all packages
devenv packages --runtime pip    # pip only
devenv packages --runtime conda  # conda only
devenv packages --runtime npm    # npm only
devenv packages --runtime yarn   # yarn only
devenv packages --runtime pnpm   # pnpm only
```

```
$ devenv packages --runtime npm

  DevEnv Inspector — Packages (npm)

  ┌──────────────────────────────────────┬────────────────────┬──────────┐
  │ Name                                 │ Version            │ Manager  │
  ├──────────────────────────────────────┼────────────────────┼──────────┤
  │ electron                             │ 33.4.0             │ npm      │
  └──────────────────────────────────────┴────────────────────┴──────────┘
  1 package
```

---

### `devenv uninstall <package> --runtime <mgr>`
Uninstall a package with a confirmation prompt.

```bash
devenv uninstall requests --runtime pip
devenv uninstall numpy --runtime conda
devenv uninstall electron --runtime npm
devenv uninstall create-react-app --runtime yarn
devenv uninstall typescript --runtime pnpm
```

```
$ devenv uninstall requests --runtime pip
? Uninstall requests via pip? (y/N) y

  ✓ requests uninstalled successfully.
```

---

### `devenv info <runtime>`
Show detailed info for a single runtime.

```bash
devenv info python
devenv info conda
devenv info node
devenv info npm
devenv info yarn
devenv info pnpm
```

```
$ devenv info python

  Python

  Status   Installed
  Version  3.13.5
  Packages 211 pip packages
```

---

### `devenv ports`
Show all active local listening ports (TCP + UDP) with their process details.

```
$ devenv ports

  DevEnv Inspector — Active Local Ports

  ┌────────┬──────────┬───────┬────────────┐
  │ Port   │ Protocol │ PID   │ Process    │
  ├────────┼──────────┼───────┼────────────┤
  │ 3000   │ TCP      │ 1234  │ node       │
  │ 5432   │ TCP      │ 2345  │ postgres   │
  │ 8000   │ TCP      │ 3456  │ python3    │
  │ 8080   │ TCP      │ 4567  │ node       │
  └────────┴──────────┴───────┴────────────┘

  4 active ports
```

TCP ports are colored **blue**, UDP ports **orange**. Only `LISTEN` state TCP sockets and bound UDP sockets are shown — established connections are excluded.

---

## How It Works

All commands run through your login shell (`zsh -i -l -c`) — the same approach as the GUI app — so conda, pyenv, nvm, and other shell-managed tools are always found.

Package names are validated against `/^[a-zA-Z0-9._\-@/]+$/` before any shell call to prevent injection.

Port detection uses `lsof -F pcn` with structured field output — no fragile header parsing. IPv4/IPv6 duplicates are deduplicated automatically.

Runtimes are powered by a **plugin registry** — each manager is a self-describing object registered via `registerRuntime()`. The CLI commands contain zero hardcoded manager names; everything is derived from the registry at runtime.

---

## Plugin System

Adding support for a new package manager requires **one file** and **one import line**.

Create `cli/src/runtimes/bun.js`:

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

Then add one line in `cli/bin/devenv.js`:

```js
import '../src/runtimes/bun.js'
```

Bun immediately appears in `devenv list`, `devenv packages --runtime bun`, `devenv uninstall`, and `devenv info bun` — **zero changes to CLI command files**.

### Plugin shape reference

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Unique key used as `--runtime` value |
| `label` | `string` | Display name in output |
| `color` | `string` | Hex color for colored output |
| `detect` | `async () => string \| null` | Returns raw stdout, or `null` if not installed |
| `parseVersion` | `(output) => string` | Cleans `detect()` output to a version string |
| `list` | `async () => [{name, version}] \| null` | `null` = no packages for this runtime |
| `uninstall` | `(pkg) => [cmd, args] \| null` | `null` = uninstall not supported |

---

## Roadmap

### Shipped
- [x] Python, Conda, Node.js, npm, Yarn, pnpm support
- [x] Colored, tabular package output with `cli-table3`
- [x] Confirmation prompt before uninstall
- [x] `devenv info` command for per-runtime details
- [x] Docker support
- [x] **Plugin system** — add any runtime in a single file
- [x] **`devenv ports`** — active TCP/UDP port viewer with process names

### Upcoming
- [ ] nvm / pyenv version manager support
- [ ] `devenv packages --outdated` — highlight packages with available updates
- [ ] JSON output flag (`--json`) for scripting
- [ ] Windows & Linux support

---

## License

MIT — see [LICENSE](../LICENSE)
