<p align="center">
  <img alt="banner" src="app_logo.png" width="600">
</p>
<p align="center" href="">
  An easy-to-use platform for EEG experimentation in the classroom
</p>

## Features

- Design, run, and analyze an experiment using real EEG data all in one desktop
  app
- Investigate visual event-related brain waves (ERPs)
- Supports Muse and Neurosity EEG devices

## Screenshots

<p align="center">
  <img src="app_home.png" width="600">
</p>

## Installing

Download the installer for your platform from the
[latest release](https://github.com/makebrainwaves/BrainWaves/releases/latest).

### macOS — "BrainWaves is damaged and can't be opened"

BrainWaves is not yet signed with an Apple Developer ID, so macOS refuses to open
it after download. The app is fine; macOS just can't verify who built it. Remove
the download quarantine flag to open it:

```bash
xattr -dr com.apple.quarantine ~/Downloads/BrainWaves-*-arm64.dmg
```

Then open the `.dmg`, drag BrainWaves to Applications, and:

```bash
xattr -dr com.apple.quarantine /Applications/BrainWaves.app
```

Right-click → Open does **not** work for this dialog — the quarantine flag has to
go. This step disappears once the project is signed and notarized.

## Prerequisites

The rest of this README is for developers building from source.

- **Node.js** >= 18
- **npm** >= 9
- No Python installation required — EEG analysis runs via [Pyodide](https://pyodide.org) (Python compiled to WebAssembly), which is downloaded automatically on first `npm install`.

> **Note:** `npm install` downloads ~300 MB of Pyodide WASM files on first run. This is expected and only happens once.

### macOS (Apple Silicon) — install liblsl

The `node-labstreaminglayer` npm package only ships an x86_64 `liblsl.dylib`, so arm64 Macs (M1/M2/M3/M4) need an arm64 build of liblsl from Homebrew. The dev script automatically symlinks the Homebrew binary into `node_modules/` on every install.

```bash
brew install labstreaminglayer/tap/lsl
```

If you skip this step, `npm run dev` will fail at startup with `Failed to load shared library: ... incompatible architecture`. Intel Macs, Linux, and Windows do not need this step — the bundled binaries work as-is.

## Installing from Source (for developers)

1. Clone the repo:

```bash
git clone https://github.com/makebrainwaves/BrainWaves.git
cd BrainWaves
```

2. Install dependencies (this also installs Pyodide and patches certain deps):

```bash
npm install
```

### Development

Start the app with hot-reload using [electron-vite](https://electron-vite.org/):

```bash
npm run dev
```

### Testing

```bash
npm test           # run all Vitest tests once
npm run test:watch # run tests in watch mode
npm run test-all   # lint + typecheck + build + test (full CI check)
```

### Typecheck & Lint

```bash
npm run typecheck  # TypeScript type check (no emit)
npm run lint       # ESLint
npm run lint-fix   # ESLint + Prettier auto-fix
```

## Packaging

Build only (no installer):

```bash
npm run build
```

Package for the current platform:

```bash
npm run package
```

Package for specific platforms:

```bash
npm run package-mac    # macOS .dmg
npm run package-win    # Windows .exe (x64)
npm run package-linux  # Linux
npm run package-all    # all platforms (requires cross-platform build tools)
```

For cross-platform builds, see [electron-builder multi-platform docs](https://www.electron.build/multi-platform-build).

To debug a production build with DevTools:

```bash
DEBUG_PROD=true npm run package
```

## Contributing

if you are interested in fixing issues with the BrainWaves app or helping us add additional features, that's amazing! Please see our [How to Contribute](https://github.com/makebrainwaves/BrainWaves/blob/master/CONTRIBUTING.md).

Also, read our [Code of Conduct](https://github.com/makebrainwaves/BrainWaves/blob/master/CODE_OF_CONDUCT.md)

## License

[MIT](https://github.com/makebrainwaves/BrainWaves/blob/master/LICENSE)
