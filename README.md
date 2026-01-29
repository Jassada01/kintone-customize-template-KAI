# kintone Customization Template

## English

### Overview

This project provides a template for customizing kintone using [esbuild](https://esbuild.github.io/) and modern frontend tools.
You can easily build, bundle, and serve your JavaScript/CSS for kintone customization.

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- **OpenSSL** (for generating a local development certificate)

### Initial Setup

Before starting development, you need to generate a self-signed SSL certificate for local HTTPS server:

```sh
mkdir .cert && openssl req -x509 -newkey rsa:4096 -keyout .cert/private.key -out .cert/private.cert -days 9999 -nodes -subj /CN=127.0.0.1
```

This will create `.cert/private.key` and `.cert/private.cert` for local HTTPS.

### Get Form Fields Structure

To get the kintone app field structure, run this command in the browser console:

```javascript
await kintone.app.getFormFields()
```

Save the output JSON to the `FormField/` folder for reference.

Reference: [Get Form Fields - kintone Developer](https://kintone.dev/en/docs/kintone/js-api/app/get-form-fields/)

### Sample Files

If you have sample files (Excel, PDF, etc.), you can place them in the `Sample/` folder.

### Installation

```sh
npm install

npx kintone-dts-gen --base-url https://***.cybozu.com -u <username> -p <password> --app-id <appId> --type-name <appName> -o "./src/js/fields.d.ts"
```

### Usage

#### Development Mode (with local server & watch)

```sh
npm run build:dev
```

or

```sh
node scripts/esbuild/build.mjs --mode=development
```

- Starts a local HTTPS server at [https://localhost:9000](https://localhost:9000)
- Watches for file changes and rebuilds automatically
- Add the URL link (e.g., `https://localhost:9000/js/index.js`) to **kintone JavaScript Customization** settings

**Important:** When accessing `https://localhost:9000` for the first time, your browser will show a security warning because of the self-signed certificate. To fix this:

1. Open [https://localhost:9000](https://localhost:9000) in your browser
2. Click **"Advanced"** or **"Show Details"**
3. Click **"Proceed to localhost (unsafe)"** or **"visit this website"**
4. The browser will now trust the certificate for this session

#### Production Build

```sh
npm run build:prod
```

or

```sh
node scripts/esbuild/build.mjs --mode=production
```

- Outputs bundled files to the `dist` directory
- Upload the `.js` file from `dist/` folder to **kintone JavaScript Customization** settings

Reference: [JavaScript and CSS Customization - kintone Help](https://us.kintone.help/k/en/app/customize/js_customize)

### Directory Structure

```text
src/
  js/
    index.ts
  style/
    style.css
dist/
scripts/
  esbuild/
    build.mjs
    plugins/
      serve-mode-plugin.mjs
.cert/
  private.key
  private.cert
FormField/          # Store kintone form field structure JSON
Sample/             # Store sample files (Excel, PDF, etc.)
```

### Useful References

- [kintone Help](https://us.kintone.help/k/en/) - Basic kintone usage guide
- [kintone Developer](https://kintone.dev/en/) - For kintone development

---

## ภาษาไทย

### ภาพรวม

โปรเจกต์นี้เป็นเทมเพลตสำหรับการ customize kintone โดยใช้ [esbuild](https://esbuild.github.io/) และเครื่องมือ frontend สมัยใหม่
คุณสามารถ build, bundle และ serve JavaScript/CSS สำหรับการ customize kintone ได้อย่างง่ายดาย

### ข้อกำหนดเบื้องต้น

- Node.js (แนะนำ v18 ขึ้นไป)
- npm หรือ yarn
- **OpenSSL** (สำหรับสร้าง certificate สำหรับ local development)

### การตั้งค่าเริ่มต้น

ก่อนเริ่มพัฒนา คุณต้องสร้าง self-signed SSL certificate สำหรับ local HTTPS server:

```sh
mkdir .cert && openssl req -x509 -newkey rsa:4096 -keyout .cert/private.key -out .cert/private.cert -days 9999 -nodes -subj /CN=127.0.0.1
```

คำสั่งนี้จะสร้างไฟล์ `.cert/private.key` และ `.cert/private.cert` สำหรับ local HTTPS

### ดึงโครงสร้าง Form Fields

เพื่อดึงโครงสร้าง field ของ kintone app ให้รันคำสั่งนี้ใน browser console:

```javascript
await kintone.app.getFormFields()
```

บันทึกผลลัพธ์ JSON ไว้ในโฟลเดอร์ `FormField/` เพื่อใช้อ้างอิง

อ้างอิง: [Get Form Fields - kintone Developer](https://kintone.dev/en/docs/kintone/js-api/app/get-form-fields/)

### ไฟล์ตัวอย่าง

หากมีไฟล์ตัวอย่าง (Excel, PDF, ฯลฯ) สามารถวางไว้ในโฟลเดอร์ `Sample/` ได้

### การติดตั้ง

```sh
npm install

npx kintone-dts-gen --base-url https://***.cybozu.com -u <username> -p <password> --app-id <appId> --type-name <appName> -o "./src/js/fields.d.ts"
```

### วิธีใช้งาน

#### โหมด Development (พร้อม local server และ watch)

```sh
npm run build:dev
```

หรือ

```sh
node scripts/esbuild/build.mjs --mode=development
```

- เริ่มต้น local HTTPS server ที่ [https://localhost:9000](https://localhost:9000)
- ตรวจจับการเปลี่ยนแปลงไฟล์และ rebuild อัตโนมัติ
- นำลิงก์ URL (เช่น `https://localhost:9000/js/index.js`) ไปใส่ในการตั้งค่า **kintone JavaScript Customization**

**สำคัญ:** เมื่อเข้า `https://localhost:9000` ครั้งแรก browser จะแสดงคำเตือนเรื่องความปลอดภัยเนื่องจากเป็น self-signed certificate วิธีแก้ไข:

1. เปิด [https://localhost:9000](https://localhost:9000) ใน browser
2. คลิก **"Advanced"** หรือ **"แสดงรายละเอียด"**
3. คลิก **"Proceed to localhost (unsafe)"** หรือ **"เยี่ยมชมเว็บไซต์นี้"**
4. Browser จะยอมรับ certificate สำหรับ session นี้

#### Production Build

```sh
npm run build:prod
```

หรือ

```sh
node scripts/esbuild/build.mjs --mode=production
```

- ไฟล์ที่ bundle แล้วจะถูก output ไปยังโฟลเดอร์ `dist`
- นำไฟล์ `.js` จากโฟลเดอร์ `dist/` ไป upload ในการตั้งค่า **kintone JavaScript Customization**

อ้างอิง: [JavaScript and CSS Customization - kintone Help](https://us.kintone.help/k/en/app/customize/js_customize)

### โครงสร้างโฟลเดอร์

```text
src/
  js/
    index.ts
  style/
    style.css
dist/
scripts/
  esbuild/
    build.mjs
    plugins/
      serve-mode-plugin.mjs
.cert/
  private.key
  private.cert
FormField/          # เก็บ JSON โครงสร้าง form field ของ kintone
Sample/             # เก็บไฟล์ตัวอย่าง (Excel, PDF, ฯลฯ)
```

### Dependencies หลัก

| Package | คำอธิบาย |
|---------|----------|
| `@kintone/rest-api-client` | kintone REST API client |
| `kintone-ui-component` | Official kintone UI components |
| `sweetalert2` | Modal dialogs |
| `dayjs` | Date manipulation |

### ลิงก์อ้างอิงที่มีประโยชน์

- [kintone Help](https://us.kintone.help/k/en/) - คู่มือการใช้งาน kintone เบื้องต้น
- [kintone Developer](https://kintone.dev/en/) - สำหรับการพัฒนา kintone
