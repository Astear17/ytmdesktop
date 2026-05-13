# YouTube Music Desktop App

> This is a fork of [ytmdesktop/ytmdesktop](https://github.com/ytmdesktop/ytmdesktop) which includes unofficial programs and modified components. I do not handle any responsibility if user has done any further actions that violates the license which stands by the owner of the repository

A cross-platform desktop application for YouTube Music, providing a native experience with enhanced features.

![YouTube Music Desktop App](.github/images/readme_main_app.png)

[![Discord][discord-img]][discord-url]
[![GitHub license][license-img]][license-url]
[![GitHub release][release-img]][release-url]
[![Download][download-img]][download-url]

## Features

- **Native Experience**: Integrated media keys, taskbar controls, and desktop notifications.
- **Customization**: Support for custom CSS themes, including a built-in Liquid Glass aesthetic.
- **Integrated Adblocker**: Built-in protection against advertisements and tracking.
- **Cross-Platform**: Available for Windows, macOS, and Linux.
- **Integrations**: Support for Last.fm scrobbling, Discord Rich Presence, and more.

## Download

Official fork builds use the **[Manual Build & Release](https://github.com/Astear17/ytmdesktop/actions/workflows/manual-build.yml)** workflow. Example successful run: **[#25806701001](https://github.com/Astear17/ytmdesktop/actions/runs/25806701001)** (commit `09bda90`, **3.0.0-hotfix**). Open the run, scroll to **Artifacts**, and download the ZIP whose name matches your OS and CPU below (each ZIP contains the installer(s) produced for that matrix job, e.g. `.exe` on Windows, `.deb`/`.rpm` on Linux, `.zip` on macOS).

| OS | Architecture | GitHub Actions | GitHub Releases |
| --- | --- | --- | --- |
| Windows | x86_64 (amd64) | [Artifacts — pick `YTMDesktop-Astear17_3.0.0-hotfix_windows-x64`](https://github.com/Astear17/ytmdesktop/actions/runs/25806701001#artifacts) | [Astear17/ytmdesktop Releases](https://github.com/Astear17/ytmdesktop/releases) |
| Windows | ARM64 (aarch64) | [Artifacts — pick `YTMDesktop-Astear17_3.0.0-hotfix_windows-arm64`](https://github.com/Astear17/ytmdesktop/actions/runs/25806701001#artifacts) | [Astear17/ytmdesktop Releases](https://github.com/Astear17/ytmdesktop/releases) |
| macOS | x86_64 (Intel) | [Artifacts — pick `YTMDesktop-Astear17_3.0.0-hotfix_macos-x64`](https://github.com/Astear17/ytmdesktop/actions/runs/25806701001#artifacts) | [Astear17/ytmdesktop Releases](https://github.com/Astear17/ytmdesktop/releases) |
| macOS | ARM64 (Apple Silicon) | [Artifacts — pick `YTMDesktop-Astear17_3.0.0-hotfix_macos-arm64`](https://github.com/Astear17/ytmdesktop/actions/runs/25806701001#artifacts) | [Astear17/ytmdesktop Releases](https://github.com/Astear17/ytmdesktop/releases) |
| Linux | x86_64 (amd64) | [Artifacts — pick `YTMDesktop-Astear17_3.0.0-hotfix_linux-x64`](https://github.com/Astear17/ytmdesktop/actions/runs/25806701001#artifacts) | [Astear17/ytmdesktop Releases](https://github.com/Astear17/ytmdesktop/releases) |
| Linux | ARM64 (aarch64) | [Artifacts — pick `YTMDesktop-Astear17_3.0.0-hotfix_linux-arm64`](https://github.com/Astear17/ytmdesktop/actions/runs/25806701001#artifacts) | [Astear17/ytmdesktop Releases](https://github.com/Astear17/ytmdesktop/releases) |

**SHA-256 (from CI, run 25806701001)**  
`windows-x64` — `c05b0940da58ac0914ce27cf0d3b81a1e36055d5337b925a2949d17b498006c6` · `windows-arm64` — `0498ae5f4dd01dc66f1ddf4fc995f407b69c6118ed9a9443cde9274171a717e9` · `macos-x64` — `16c1e9e62753fd78057a5692c2b1d18d1047e2cb85170ba69a07bb396382b122` · `macos-arm64` — `58ed808f61658b296085fb80c5c2f5f38b10613ab581bf2b548df6e555e8caa6` · `linux-x64` — `bf4720ee5336eeb3b876fa8927398fd4b79270e58a86dd15e8ff92cd17a2bf4f` · `linux-arm64` — `4065218151beda7234ebf368186af6eb9e4782cb4f520145055647ad08134397`

For the next manual build, open the **[Actions](https://github.com/Astear17/ytmdesktop/actions)** tab and use the newest **Manual Build & Release** run; artifact names will include the current `package.json` version.

## Development

### Prerequisites
- [Git](https://git-scm.com)
- [Node.js (v20 or higher)](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

### Build & Run in Development Mode
1. Clone the repository:
   ```bash
   git clone https://github.com/Astear17/ytmdesktop.git
   ```
2. Navigate to the project directory:
   ```bash
   cd ytmdesktop
   ```
3. Enable Corepack to use the included Yarn version:
   ```bash
   corepack enable
   ```
4. Install dependencies:
   ```bash
   yarn install
   ```
5. Start the application in development mode:
   ```bash
   yarn start
   ```

## Building

To package the application for your current platform, run:
```bash
yarn make
```

### Build Requirements
- **Windows**: Requires [Electron Build Tools](https://github.com/electron/build-tools) or Visual Studio with C++ build tools.
- **Linux**: Requires `fakeroot` and `dpkg` (for Debian/Ubuntu) or `rpm` (for RedHat/Fedora).

## License

This project is licensed under the GPL-3.0 License. See the [LICENSE](LICENSE) file for details.

[discord-img]: https://img.shields.io/badge/Discord-ADD-GREEN.svg?style=for-the-badge&logo=discord
[discord-url]: https://discord.com/users/1036621192515297322
[license-img]: https://img.shields.io/github/license/Astear17/ytmdesktop.svg?style=for-the-badge&logo=librarything
[license-url]: https://github.com/Astear17/ytmdesktop/blob/master/LICENSE
[release-img]: https://img.shields.io/github/release/Astear17/ytmdesktop.svg?style=for-the-badge&logo=flattr
[release-url]: https://github.com/Astear17/ytmdesktop/releases/
[download-img]: https://img.shields.io/github/downloads/Astear17/ytmdesktop/total.svg?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZGF0YS1wcmVmaXg9ImZhcyIgZGF0YS1pY29uPSJjbG91ZC1kb3dubG9hZC1hbHQiIGNsYXNzPSJzdmctaW5saW5lLS1mYSBmYS1jbG91ZC1kb3dubG9hZC1hbHQgZmEtdy0yMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNjQwIDUxMiI+PHBhdGggZmlsbD0iI0ZGRiIgZD0iTTUzOCAyMjdjNC0xMSA2LTIzIDYtMzVhOTYgOTYgMCAwMC0xNDktODAgMTYwIDE2MCAwIDAwLTI5OSA4OCAxNDQgMTQ0IDAgMDA0OCAyODBoMzY4YTEyOCAxMjggMCAwMDI2LTI1M3ptLTEzMyA4OEwyOTkgNDIxYy02IDYtMTYgNi0yMiAwTDE3MSAzMTVjLTEwLTEwLTMtMjcgMTItMjdoNjVWMTc2YzAtOSA3LTE2IDE2LTE2aDQ4YzkgMCAxNiA3IDE2IDE2djExMmg2NWMxNSAwIDIyIDE3IDEyIDI3eiIvPjwvc3ZnPg==
[download-url]: https://github.com/Astear17/ytmdesktop/releases/
