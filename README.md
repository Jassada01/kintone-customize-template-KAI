# kintone Customization Template

## Overview

This project provides a template for customizing kintone using [esbuild](https://esbuild.github.io/) and modern frontend tools.
You can easily build, bundle, and serve your JavaScript/CSS for kintone customization.

## Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- **OpenSSL** (for generating a local development certificate)

## Initial Setup

Copy `.env_sample` to `.env` and fill in your kintone credentials:

```sh
cp .env_sample .env
```

Generate a self-signed SSL certificate for local HTTPS server:

```sh
mkdir .cert && openssl req -x509 -newkey rsa:4096 -keyout .cert/private.key -out .cert/private.cert -days 9999 -nodes -subj /CN=127.0.0.1
```

This will create `.cert/private.key` and `.cert/private.cert` for local HTTPS.

## Installation

```sh
npm install
```

(Optional) Generate TypeScript definitions for your kintone app fields:

```sh
npx kintone-dts-gen --base-url https://***.cybozu.com -u <username> -p <password> --app-id <appId> --type-name <appName> -o "./src/js/fields.d.ts"
```

## Usage

### Development Mode (with local server & watch)

```sh
npm run build:dev
```

- Starts a local HTTPS server at [https://localhost:9000](https://localhost:9000)
- Watches for file changes and rebuilds automatically

### Production Build

```sh
npm run build:prod
```

- Outputs bundled files to the `dist` directory

## MCP Servers

This project includes MCP (Model Context Protocol) server configurations for AI-assisted development:

- **kintone** - Connects to kintone REST API for app/record operations
- **playwright** - Browser automation for testing and scraping

Configuration is in `.mcp.json`. Environment variables are loaded from `.env`.

## Directory Structure

```text
src/
  js/
    index.ts          # Main entry point
    fields.d.ts       # Generated kintone field types
    constant/
      config.ts       # Configuration constants
  style/
    style.css         # Styles
dist/                 # Bundled output
scripts/
  esbuild/
    build.mjs
    plugins/
      serve-mode-plugin.mjs
.cert/                # SSL certificates (git ignored)
.env                  # Environment variables (git ignored)
.mcp.json             # MCP server configuration
```
