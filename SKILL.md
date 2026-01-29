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

### Deploy App

```ts
// Deploy การเปลี่ยนแปลง
await client.app.deployApp({ apps: [{ app: "1" }] });

// เช็คสถานะ deploy
const { apps } = await client.app.getDeployStatus({ apps: ["1"] });
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
