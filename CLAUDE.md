# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kintone customization template using esbuild for bundling TypeScript/CSS customizations for the Kintone platform. Outputs bundled files to `dist/` for deployment to Kintone.

## Build Commands

```bash
# Production build (minified, no sourcemaps)
npm run build:prod

# Development mode (watch mode + HTTPS server at https://localhost:9000)
npm run build:dev
```

Both commands run TypeScript type checking (`tsc --noEmit`) before building with esbuild.

## Initial Setup

Generate SSL certificates for local HTTPS development:
```bash
mkdir .cert && openssl req -x509 -newkey rsa:4096 -keyout .cert/private.key -out .cert/private.cert -days 9999 -nodes -subj /CN=127.0.0.1
```

Generate TypeScript definitions for Kintone app fields:
```bash
npx kintone-dts-gen --base-url https://***.cybozu.com -u <username> -p <password> --app-id <appId> --type-name <appName> -o "./src/js/fields.d.ts"
```

## Architecture

**Entry Points:**
- `src/js/index.ts` → `dist/index.js` (main customization code)
- `src/style/style.css` → `dist/style.css` (styles)

**Build System:**
- esbuild bundles to ES2024 modules
- TypeScript with strict mode enabled
- Development mode: inline sourcemaps, file watching, HTTPS server on port 9000
- Production mode: minified output, no sourcemaps

**Key Dependencies:**
- `@kintone/rest-api-client` - Kintone REST API calls
- `kintone-ui-component` - Official Kintone UI components
- `sweetalert2` - Modal dialogs
- `dayjs` - Date/time handling

## Code Conventions

- The global `kintone` object is available (defined as readonly in ESLint config)
- App-specific field types should be generated in `src/js/fields.d.ts`
- Constants belong in `src/js/constant/config.ts`
- Uses `@cybozu/eslint-config` with TypeScript + Prettier preset
