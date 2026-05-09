# YouTube Music Desktop App

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

The latest version can be downloaded from the [Releases](https://github.com/ytmdesktop/ytmdesktop/releases) page.

### Windows
- **Direct Download**: Available in the Releases section.

### macOS
- **Direct Download**: Available in the Releases section.

### Linux
- **Direct Download**: Available in the Releases section (AppImage, Deb, RPM).

## Development

### Prerequisites
- [Git](https://git-scm.com)
- [Node.js (v20 or higher)](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

### Getting Started
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
