<div align="center">
  <h1>devenv-inspector-cli</h1>
  <p>Inspect runtimes and manage global packages from your terminal — no GUI required.</p>

  <p>
    <img src="https://img.shields.io/badge/version-0.1.0-5a7af5?style=for-the-badge" alt="Version" />
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
```

---

### `devenv packages [--runtime <mgr>]`
List all global packages. Optionally filter by manager.

```bash
devenv packages                  # all packages
devenv packages --runtime pip    # pip only
devenv packages --runtime conda  # conda only
devenv packages --runtime npm    # npm only
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
```

```
$ devenv info python

  Python

  Status   Installed
  Version  3.13.5
  Packages 211 pip packages
```

---

## How It Works

All commands run through your login shell (`zsh -i -l -c`) — the same approach as the GUI app — so conda, pyenv, nvm, and other shell-managed tools are always found.

Package names are validated against `/^[a-zA-Z0-9._\-@/]+$/` before any shell call to prevent injection.

---

## License

MIT — see [LICENSE](../LICENSE)
