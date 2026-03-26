---

## Supported Runtimes (v0.7.0)

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

## Keyboard Shortcuts

Access via **Tools → Keyboard Shortcuts** or `Ctrl+/`

| Action | Windows/Linux | macOS |
|---|---|---|
| Refresh | `Ctrl+R` | `⌘R` |
| Focus search | `Ctrl+F` | `⌘F` |
| Open settings | `Ctrl+,` | `⌘,` |
| Toggle theme | `Ctrl+Shift+T` | `⌘⇧T` |
| Upgrade all packages | `Ctrl+Shift+U` | `⌘⇧U` |
| Keyboard shortcuts | `Ctrl+/` | `⌘/` |
| Packages tab | `Ctrl+1` | `⌘1` |
| Environments tab | `Ctrl+2` | `⌘2` |
| Active Ports tab | `Ctrl+3` | `⌘3` |
| Diagnostics tab | `Ctrl+4` | `⌘4` |
| Plugins tab | `Ctrl+5` | `⌘5` |
| Export data | `Ctrl+E` | `⌘E` |
| Close modal | `Esc` | `Esc` |

All shortcuts are remappable via **Settings → Shortcuts**.

---

## Settings

Access via the ⚙ gear icon in the titlebar. All settings save instantly.

| Section | Settings |
|---|---|
| **Appearance** | Theme (Dark/Light/System), Accent color, Font size, Compact mode |
| **Refresh** | Refresh on startup, Auto-refresh, Refresh interval (30s/1min/5min) |
| **Packages** | Show system packages, Confirm before uninstall, Confirm before upgrade |
| **Ports** | Confirm before killing a process |
| **Environments** | Scan depth (1/2/3 levels), Excluded folders |
| **Updates** | Check on launch, Auto-download, Update channel (Stable/Beta) |
| **Notifications** | New port opened, Package updates available, Plugin load failure |
| **Shortcuts** | Remap all 11 keyboard shortcuts |

---

## Plugin System

Each runtime is a self-describing plugin registered via `registerRuntime()`. Install community plugins from the catalog or create your own with the guided form — no coding required.

### Community Catalog

| Category | Plugins |
|---|---|
| Language | Java · Kotlin · Rust · Go · Ruby · Deno · Swift · Bun |
| Framework | Django · FastAPI · Laravel · Next.js · NestJS · Vue CLI · Angular CLI · Flutter · Electron |
| Tools | PHP Composer · .NET |

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
- [x] Plugin system — install from catalog or create with guided form
- [x] Active Local Ports — live TCP/UDP port viewer with kill support
- [x] Full UI redesign — dark terminal aesthetic
- [x] Package update detection with one-click upgrade
- [x] Upgrade All — bulk upgrade via Tools menu with live output
- [x] nvm / pyenv version manager support
- [x] Virtual environment detection + creation
- [x] Custom scan folders + scan depth + excluded folders
- [x] Export packages and environments to JSON / CSV
- [x] Diagnostics tab with copyable structured logs
- [x] Full Settings panel (theme, accent, font, refresh, notifications, updates, shortcuts)
- [x] Remappable keyboard shortcuts with reference modal
- [x] Tools menu (Keyboard Shortcuts + Upgrade All)
- [x] Auto-update via electron-updater
- [x] Windows support
- [x] Linux support (AppImage + deb)
- [x] App icon

### Upcoming
- [ ] Framework detection in Environments (React, Next.js, Vue, etc.)
- [ ] Package details panel
- [ ] Global search (Ctrl+K)
- [ ] Docker container integration
- [ ] Dependency graph visualization

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