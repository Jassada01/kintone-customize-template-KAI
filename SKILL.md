# SKILL.md - kintone-rest-api-client Quick Reference

คู่มือสรุปการใช้งาน `@kintone/rest-api-client` สำหรับ Claude Code

## การสร้าง Client

```ts
import { KintoneRestAPIClient } from "@kintone/rest-api-client";

// ใช้ใน kintone customization (ใช้ session ของ user ที่ login อยู่)
const client = new KintoneRestAPIClient();

// หรือระบุ baseUrl
const client = new KintoneRestAPIClient({
  baseUrl: "https://example.cybozu.com"
});
```

---

## Record API (`client.record.*`)

### ดึงข้อมูล Record

```ts
// ดึง 1 record
const { record } = await client.record.getRecord({ app: "1", id: "10" });

// ดึงหลาย records (สูงสุด 500)
const { records } = await client.record.getRecords({
  app: "1",
  query: 'status = "Open"',
  fields: ["field1", "field2"]
});

// ดึงทั้งหมด (ไม่จำกัดจำนวน)
const records = await client.record.getAllRecords({
  app: "1",
  condition: 'status = "Open"',
  orderBy: "created_time desc"
});
```

### เพิ่ม Record

```ts
// เพิ่ม 1 record
const { id, revision } = await client.record.addRecord({
  app: "1",
  record: {
    field_code: { value: "value" }
  }
});

// เพิ่มหลาย records (สูงสุด 100)
const result = await client.record.addRecords({
  app: "1",
  records: [
    { field_code: { value: "value1" } },
    { field_code: { value: "value2" } }
  ]
});

// เพิ่มไม่จำกัดจำนวน
const result = await client.record.addAllRecords({
  app: "1",
  records: [/* มากกว่า 100 records */]
});
```

### อัปเดต Record

```ts
// อัปเดตด้วย record ID
await client.record.updateRecord({
  app: "1",
  id: "10",
  record: {
    field_code: { value: "new value" }
  }
});

// อัปเดตด้วย unique key
await client.record.updateRecord({
  app: "1",
  updateKey: {
    field: "unique_field",
    value: "unique_value"
  },
  record: {
    field_code: { value: "new value" }
  }
});

// Upsert (update หรือ insert)
await client.record.upsertRecord({
  app: "1",
  updateKey: {
    field: "unique_field",
    value: "unique_value"
  },
  record: {
    field_code: { value: "value" }
  }
});

// อัปเดตหลาย records
await client.record.updateRecords({
  app: "1",
  records: [
    { id: "1", record: { field: { value: "v1" } } },
    { id: "2", record: { field: { value: "v2" } } }
  ]
});
```

### ลบ Record

```ts
// ลบหลาย records
await client.record.deleteRecords({
  app: "1",
  ids: ["1", "2", "3"]
});

// ลบไม่จำกัดจำนวน
await client.record.deleteAllRecords({
  app: "1",
  records: [
    { id: "1" },
    { id: "2" }
  ]
});
```

### Comment

```ts
// ดึง comments
const { comments } = await client.record.getRecordComments({
  app: "1",
  record: "10"
});

// เพิ่ม comment
await client.record.addRecordComment({
  app: "1",
  record: "10",
  comment: {
    text: "Comment text",
    mentions: [{ code: "user1", type: "USER" }]
  }
});

// ลบ comment
await client.record.deleteRecordComment({
  app: "1",
  record: "10",
  comment: "5"
});
```

### Process Management (สถานะ)

```ts
// อัปเดตสถานะ
await client.record.updateRecordStatus({
  app: "1",
  id: "10",
  action: "Submit"
});

// อัปเดต assignees
await client.record.updateRecordAssignees({
  app: "1",
  id: "10",
  assignees: ["user1", "user2"]
});
```

---

## File API (`client.file.*`)

```ts
// อัปโหลดไฟล์
const { fileKey } = await client.file.uploadFile({
  file: {
    name: "hello.txt",
    data: "Hello World!"
  }
});

// อัปโหลดจาก path (Node.js only)
const { fileKey } = await client.file.uploadFile({
  file: { path: "/path/to/file.pdf" }
});

// แนบไฟล์กับ record
await client.record.addRecord({
  app: "1",
  record: {
    Attachment: { value: [{ fileKey }] }
  }
});

// ดาวน์โหลดไฟล์
const data = await client.file.downloadFile({
  fileKey: "file-key-from-record"
});
```

---

## App API (`client.app.*`)

### ดึงข้อมูล App

```ts
// ดึงข้อมูล app
const app = await client.app.getApp({ id: "1" });

// ดึงหลาย apps
const { apps } = await client.app.getApps({
  ids: ["1", "2"],
  name: "search name"
});

// ดึง form fields
const { properties } = await client.app.getFormFields({ app: "1" });

// ดึง form layout
const { layout } = await client.app.getFormLayout({ app: "1" });

// ดึง views
const { views } = await client.app.getViews({ app: "1" });
```

### สร้าง App ใหม่

```ts
// สร้าง preview app
const { app, revision } = await client.app.addApp({
  name: "App Name",
  space: 5  // optional: space ID
});

// เพิ่ม fields
await client.app.addFormFields({
  app: "1",
  properties: {
    text_field: {
      type: "SINGLE_LINE_TEXT",
      code: "text_field",
      label: "テキスト"
    },
    number_field: {
      type: "NUMBER",
      code: "number_field",
      label: "数値"
    }
  }
});

// อัปเดต form layout
await client.app.updateFormLayout({
  app: "1",
  layout: [
    {
      type: "ROW",
      fields: [
        { type: "SINGLE_LINE_TEXT", code: "text_field", size: { width: "200" } }
      ]
    }
  ]
});
```

### App Settings

```ts
// ดึง app settings
const settings = await client.app.getAppSettings({
  app: "1",
  lang: "ja",    // optional: default, en, zh, ja, user
  preview: true  // optional: get pre-live settings
});
// Returns: { name, description, icon, theme, revision, ... }

// อัปเดต app settings
await client.app.updateAppSettings({
  app: "1",
  name: "New App Name",
  description: "<p>Description in HTML</p>",
  theme: "BLUE",  // WHITE, RED, BLUE, GREEN, YELLOW, BLACK
  icon: {
    type: "PRESET",  // PRESET or FILE
    key: "APP72"     // preset icon key
  }
});
```

### Process Management (ワークフロー)

```ts
// ดึง process management settings
const process = await client.app.getProcessManagement({
  app: "1",
  preview: true  // optional
});
// Returns: { enable, states, actions, revision }

// อัปเดต process management
await client.app.updateProcessManagement({
  app: "1",
  enable: true,
  states: {
    "未着手": { name: "未着手", index: "0" },
    "進行中": {
      name: "進行中",
      index: "1",
      assignee: {
        type: "ONE",  // ONE, ALL, ANY
        entities: [
          { entity: { type: "USER", code: "user1" } }
        ]
      }
    },
    "完了": { name: "完了", index: "2" }
  },
  actions: [
    { name: "開始", from: "未着手", to: "進行中" },
    { name: "完了", from: "進行中", to: "完了" }
  ]
});
```

### Deploy App

```ts
// Deploy การเปลี่ยนแปลง (pre-live -> live)
await client.app.deployApp({
  apps: [{ app: "1" }],
  revert: false  // true = revert pre-live to live settings
});

// เช็คสถานะ deploy
const { apps } = await client.app.getDeployStatus({ apps: ["1"] });
// Status: PROCESSING, SUCCESS, FAIL, CANCEL
```

---

## Bulk Request

รันหลาย API requests พร้อมกัน (สูงสุด 20 requests)

```ts
const result = await client.bulkRequest({
  requests: [
    {
      method: "POST",
      api: "/k/v1/record.json",
      payload: { app: "1", record: { field: { value: "v1" } } }
    },
    {
      method: "PUT",
      api: "/k/v1/record.json",
      payload: { app: "1", id: "10", record: { field: { value: "v2" } } }
    }
  ]
});
```

---

## Plugin API (`client.plugin.*`)

```ts
// ดึง plugins ที่ติดตั้ง
const { plugins } = await client.plugin.getPlugins({ limit: 10 });

// ติดตั้ง plugin
const { id } = await client.plugin.installPlugin({ fileKey: "..." });

// ถอนการติดตั้ง
await client.plugin.uninstallPlugin({ id: "plugin-id" });
```

---

## Error Handling

```ts
import { KintoneRestAPIError } from "@kintone/rest-api-client";

try {
  await client.record.getRecord({ app: "1", id: "9999" });
} catch (error) {
  if (error instanceof KintoneRestAPIError) {
    console.log(error.id);      // Error ID
    console.log(error.code);    // Error code (e.g., "GAIA_RE01")
    console.log(error.message); // Error message
    console.log(error.status);  // HTTP status (e.g., 404)
  }
}
```

### KintoneAllRecordsError

สำหรับ `addAllRecords`, `updateAllRecords`, `deleteAllRecords`:

```ts
import { KintoneAllRecordsError } from "@kintone/rest-api-client";

try {
  await client.record.addAllRecords({ app: "1", records });
} catch (error) {
  if (error instanceof KintoneAllRecordsError) {
    console.log(error.processedRecordsResult); // Records ที่สำเร็จแล้ว
    console.log(error.unprocessedRecords);     // Records ที่ยังไม่ได้ทำ
    console.log(error.numOfProcessedRecords);  // จำนวนที่สำเร็จ
    console.log(error.errorIndex);             // Index ที่เกิด error
  }
}
```

---

## TypeScript Types

```ts
import type {
  KintoneRecordField,
  KintoneFormFieldProperty,
  KintoneFormLayout
} from "@kintone/rest-api-client";
```

---

## หมายเหตุสำคัญ

1. **Limit ของ API**:
   - `getRecords`: สูงสุด 500 records
   - `addRecords`/`updateRecords`: สูงสุด 100 records
   - `deleteRecords`: สูงสุด 100 records
   - `bulkRequest`: สูงสุด 20 requests

2. **ใช้ `*AllRecords` methods** สำหรับข้อมูลจำนวนมาก (จะแบ่ง chunk 2000 records อัตโนมัติ)

3. **Revision number**: ใช้เพื่อป้องกัน conflict เมื่ออัปเดตพร้อมกัน

4. **Query syntax**: ดูเพิ่มเติมที่ https://kintone.dev/en/docs/kintone/overview/query-string/

---

## App Management Scripts

Scripts สำหรับจัดการ kintone App ผ่าน CLI จัดเป็นหมวดหมู่:

### โครงสร้าง Folder

```text
scripts/app-management/
├── common/          # Shared utilities
├── app/             # App info & settings
├── form/            # Fields & layout
├── views/           # Views (一覧)
├── customize/       # JS/CSS customization
├── acl/             # Permissions
├── process/         # Process management (ワークフロー)
├── notifications/   # Notifications
├── reports/         # Reports (グラフ)
├── records/         # Record CRUD, comments, cursor, status
├── file/            # File upload/download
├── bulk/            # Bulk request
└── deploy/          # Deploy & status
```

### App - ข้อมูลและการตั้งค่า App

```bash
npm run app:get <appId>                              # ดึงข้อมูล App
npm run app:get-all                                   # ดึงรายการ Apps ทั้งหมด
npm run app:add "App Name" [spaceId]                  # สร้าง App ใหม่
npm run app:get-settings <appId> [--preview]          # ดึง App Settings
npm run app:update-settings <appId> <jsonPath>        # อัปเดต App Settings
```

### Form - Fields และ Layout

```bash
npm run form:get-fields <appId>                       # ดึง Fields + generate TypeScript
npm run form:add-fields <appId> <jsonPath>            # เพิ่ม Fields
npm run form:update-fields <appId> <jsonPath>         # อัปเดต Fields
npm run form:delete-fields <appId> <code1> [code2]    # ลบ Fields
npm run form:get-layout <appId>                       # ดึง Layout
npm run form:update-layout <appId> <jsonPath>         # อัปเดต Layout
```

### Views - มุมมอง (一覧)

```bash
npm run views:get <appId> [--preview]                 # ดึง Views
npm run views:update <appId> <jsonPath>               # อัปเดต Views
```

### Customize - JS/CSS Customization

```bash
npm run customize:get <appId> [--preview]             # ดึง Customization settings
npm run customize:update <appId> <jsonPath>           # อัปเดต Customization
```

### ACL - Permissions (アクセス権)

```bash
npm run acl:get-app <appId> [--preview]               # ดึง App permissions
npm run acl:update-app <appId> <jsonPath>             # อัปเดต App permissions
npm run acl:get-record <appId> [--preview]            # ดึง Record permissions
npm run acl:update-record <appId> <jsonPath>          # อัปเดต Record permissions
npm run acl:get-field <appId> [--preview]             # ดึง Field permissions
npm run acl:update-field <appId> <jsonPath>           # อัปเดต Field permissions
npm run acl:evaluate <appId> <recordId1> [recordId2]  # ตรวจสอบ permissions ของ records
```

### Process - Process Management (ワークフロー)

```bash
npm run process:get <appId> [--preview]               # ดึง Process Management
npm run process:update <appId> <jsonPath>             # อัปเดต Process Management
```

### Notifications - การแจ้งเตือน

```bash
npm run notify:get-general <appId> [--preview]        # ดึง General notifications
npm run notify:update-general <appId> <jsonPath>      # อัปเดต General notifications
npm run notify:get-record <appId> [--preview]         # ดึง Per-record notifications
npm run notify:update-record <appId> <jsonPath>       # อัปเดต Per-record notifications
npm run notify:get-reminder <appId> [--preview]       # ดึง Reminder notifications
npm run notify:update-reminder <appId> <jsonPath>     # อัปเดต Reminder notifications
```

### Reports - กราฟ (グラフ)

```bash
npm run reports:get <appId> [--preview]               # ดึง Reports
npm run reports:update <appId> <jsonPath>             # อัปเดต Reports
```

### Deploy - การ Deploy

```bash
npm run deploy:app <appId> [--revert] [--no-wait]     # Deploy App
npm run deploy:status <appId> [appId2] ...            # เช็คสถานะ Deploy
```

### Records - จัดการ Record

```bash
# Single Record
npm run record:get <appId> <recordId>                 # ดึง Record
npm run record:add <appId> [recordJsonPath]           # เพิ่ม Record
npm run record:update <appId> <recordId> <jsonPath>   # อัปเดต Record
npm run record:upsert <appId> <keyField> <keyValue> [jsonPath]  # Upsert Record

# Multiple Records (max 500 for get, 100 for others)
npm run record:get-many <appId> [--query="..."] [--fields=f1,f2]
npm run record:add-many <appId> <recordsJsonPath>
npm run record:update-many <appId> <recordsJsonPath> [--upsert]
npm run record:delete <appId> <id1> [id2] ...

# All Records (unlimited)
npm run record:get-all <appId> [--condition="..."] [--orderBy="..."]
npm run record:get-all-by-id <appId> [--condition="..."]
npm run record:get-all-by-offset <appId> [--condition="..."]   # warning: slow for >10k records
npm run record:get-all-by-cursor <appId> [--query="..."]       # recommended
npm run record:add-all <appId> <recordsJsonPath>
npm run record:update-all <appId> <recordsJsonPath> [--upsert]
npm run record:delete-all <appId> <recordsJsonPath>
```

### Comments - ความคิดเห็นใน Record

```bash
npm run comment:get <appId> <recordId> [--order=asc|desc] [--limit=N]
npm run comment:add <appId> <recordId> "<text>"
npm run comment:add <appId> <recordId> --json=<commentJsonPath>  # with mentions
npm run comment:delete <appId> <recordId> <commentId>
```

### Cursor - ดึง Record จำนวนมาก

```bash
npm run cursor:create <appId> [--query="..."] [--size=N]   # สร้าง cursor
npm run cursor:get <cursorId>                              # ดึง records
npm run cursor:delete <cursorId>                           # ลบ cursor
```

### Status/Assignees - Process Management (ワークフロー)

```bash
npm run status:update <appId> <recordId> "<action>" [--assignee=<user>]
npm run status:update-many <appId> <recordsJsonPath>
npm run assignees:update <appId> <recordId> <user1> [user2] ...
npm run assignees:update <appId> <recordId> --clear        # ลบ assignees
```

### File - อัปโหลด/ดาวน์โหลดไฟล์

```bash
npm run file:upload <filePath>                            # อัปโหลดไฟล์ (returns fileKey)
npm run file:download <fileKey> [outputPath]              # ดาวน์โหลดไฟล์
```

### Bulk - รันหลาย API พร้อมกัน

```bash
npm run bulk:request <requestsJsonPath>                   # รันหลาย API (max 20)
```

JSON format สำหรับ bulk request:

```json
[
  { "method": "POST", "api": "/k/v1/record.json", "payload": { "app": "1", "record": {...} } },
  { "method": "PUT", "api": "/k/v1/record.json", "payload": { "app": "1", "id": "10", "record": {...} } }
]
```

### ตัวอย่างการสร้าง App ใหม่

```bash
# 1. สร้าง App
npm run app:add "顧客管理"
# Output: App ID: 123

# 2. เพิ่ม Fields
npm run form:add-fields 123 ./fields.json

# 3. อัปเดต Layout
npm run form:update-layout 123 ./layout.json

# 4. ตั้งค่า Views
npm run views:update 123 ./views.json

# 5. Deploy
npm run deploy:app 123
```

---

## Field Types Reference

| Type | คำอธิบาย | ตัวอย่าง value |
|------|----------|----------------|
| `SINGLE_LINE_TEXT` | ข้อความบรรทัดเดียว | `{ value: "text" }` |
| `MULTI_LINE_TEXT` | ข้อความหลายบรรทัด | `{ value: "line1\nline2" }` |
| `RICH_TEXT` | Rich text (HTML) | `{ value: "<p>text</p>" }` |
| `NUMBER` | ตัวเลข | `{ value: "123" }` |
| `CALC` | คำนวณ | (read-only) |
| `DROP_DOWN` | Dropdown | `{ value: "option1" }` |
| `RADIO_BUTTON` | Radio button | `{ value: "option1" }` |
| `CHECK_BOX` | Checkbox | `{ value: ["opt1", "opt2"] }` |
| `MULTI_SELECT` | Multi-select | `{ value: ["opt1", "opt2"] }` |
| `DATE` | วันที่ | `{ value: "2024-01-15" }` |
| `TIME` | เวลา | `{ value: "10:30" }` |
| `DATETIME` | วันที่และเวลา | `{ value: "2024-01-15T10:30:00Z" }` |
| `LINK` | Link | `{ value: "https://..." }` |
| `FILE` | ไฟล์แนบ | `{ value: [{ fileKey: "..." }] }` |
| `USER_SELECT` | เลือก User | `{ value: [{ code: "user1" }] }` |
| `ORGANIZATION_SELECT` | เลือกองค์กร | `{ value: [{ code: "org1" }] }` |
| `GROUP_SELECT` | เลือก Group | `{ value: [{ code: "group1" }] }` |
| `SUBTABLE` | ตาราง | `{ value: [{ value: { field: { value } } }] }` |

---

## kintone Events Reference

### Desktop Events

```ts
// Record List
kintone.events.on("app.record.index.show", (event) => { ... });
kintone.events.on("app.record.index.edit.show", (event) => { ... });
kintone.events.on("app.record.index.edit.submit", (event) => { ... });
kintone.events.on("app.record.index.edit.submit.success", (event) => { ... });
kintone.events.on("app.record.index.delete.submit", (event) => { ... });

// Record Detail
kintone.events.on("app.record.detail.show", (event) => { ... });
kintone.events.on("app.record.detail.delete.submit", (event) => { ... });
kintone.events.on("app.record.detail.process.proceed", (event) => { ... });

// Record Create
kintone.events.on("app.record.create.show", (event) => { ... });
kintone.events.on("app.record.create.change.<field_code>", (event) => { ... });
kintone.events.on("app.record.create.submit", (event) => { ... });
kintone.events.on("app.record.create.submit.success", (event) => { ... });

// Record Edit
kintone.events.on("app.record.edit.show", (event) => { ... });
kintone.events.on("app.record.edit.change.<field_code>", (event) => { ... });
kintone.events.on("app.record.edit.submit", (event) => { ... });
kintone.events.on("app.record.edit.submit.success", (event) => { ... });

// Print
kintone.events.on("app.record.print.show", (event) => { ... });

// Report (Graph)
kintone.events.on("app.report.show", (event) => { ... });
```

### Mobile Events

```ts
// เหมือน Desktop แต่เปลี่ยน "app" เป็น "mobile.app"
kintone.events.on("mobile.app.record.index.show", (event) => { ... });
kintone.events.on("mobile.app.record.detail.show", (event) => { ... });
kintone.events.on("mobile.app.record.create.show", (event) => { ... });
kintone.events.on("mobile.app.record.edit.show", (event) => { ... });
```

### Event Object Properties

```ts
// event object ทั่วไป
{
  appId: number,
  recordId: number,  // ไม่มีใน create
  record: { ... },   // record data
  type: string       // event type
}

// สำหรับ change events
{
  ...
  changes: {
    field: { value: ... },  // field ที่เปลี่ยน
    row: { ... }            // สำหรับ subtable
  }
}
```

### Return Values

```ts
// ยกเลิก submit
return false;

// แก้ไข record ก่อน save
event.record.field_code.value = "new value";
return event;

// Async operation
return kintone.Promise.resolve(event);
```
