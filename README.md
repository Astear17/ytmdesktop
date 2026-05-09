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

It is recommended to download the latest version of your OS at [GitHub Actions](https://github.com/Astear17/ytmdesktop/actions) on the latest workflow run.
You could still download over [Releases](https://github.com/ytmdesktop/ytmdesktop/releases) page but some build conflicts with names so this could be fixed soon.
Or click on the hyperlinks of your build below to download

### Windows
+ 64bit (x86_64): [`ytmdesktop-windows-x64.zip`](https://github.com/Astear17/ytmdesktop/actions/runs/25591117110/artifacts/6892671613)
+ ARM64: [`ytmdesktop-windows-arm64.zip`](https://github.com/Astear17/ytmdesktop/actions/runs/25591117110/artifacts/6892671684)

### macOS
+ 64bit (x86_64): [`ytmdesktop-macos-x64.zip`](https://github.com/Astear17/ytmdesktop/actions/runs/25591117110/artifacts/6892659096)<br>
+ ARM64: [`ytmdesktop-macos-arm64.zip`](https://github.com/Astear17/ytmdesktop/actions/runs/25591117110/artifacts/6892658973)

### Linux
+ 64bit (x86_64): [`ytmdesktop-linux-x64.zip`](https://github.com/Astear17/ytmdesktop/actions/runs/25591117110/artifacts/6892665345)<br>
+ ARM64: [`ytmdesktop-linux-arm64.zip`](https://github.com/Astear17/ytmdesktop/actions/runs/25591117110/artifacts/6892664049)

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
