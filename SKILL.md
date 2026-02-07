# SKILL.md - kintone-rest-api-client Quick Reference

Quick reference guide for `@kintone/rest-api-client` usage with Claude Code.

## Creating a Client

```ts
import { KintoneRestAPIClient } from "@kintone/rest-api-client";

// Use in kintone customization (uses the logged-in user's session)
const client = new KintoneRestAPIClient();

// Or specify a baseUrl
const client = new KintoneRestAPIClient({
  baseUrl: "https://example.cybozu.com"
});
```

---

## Record API (`client.record.*`)

### Get Records

```ts
// Get a single record
const { record } = await client.record.getRecord({ app: "1", id: "10" });

// Get multiple records (max 500)
const { records } = await client.record.getRecords({
  app: "1",
  query: 'status = "Open"',
  fields: ["field1", "field2"]
});

// Get all records (unlimited)
const records = await client.record.getAllRecords({
  app: "1",
  condition: 'status = "Open"',
  orderBy: "created_time desc"
});
```

### Add Records

```ts
// Add a single record
const { id, revision } = await client.record.addRecord({
  app: "1",
  record: {
    field_code: { value: "value" }
  }
});

// Add multiple records (max 100)
const result = await client.record.addRecords({
  app: "1",
  records: [
    { field_code: { value: "value1" } },
    { field_code: { value: "value2" } }
  ]
});

// Add unlimited records
const result = await client.record.addAllRecords({
  app: "1",
  records: [/* more than 100 records */]
});
```

### Update Records

```ts
// Update by record ID
await client.record.updateRecord({
  app: "1",
  id: "10",
  record: {
    field_code: { value: "new value" }
  }
});

// Update by unique key
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

// Upsert (update or insert)
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

// Update multiple records
await client.record.updateRecords({
  app: "1",
  records: [
    { id: "1", record: { field: { value: "v1" } } },
    { id: "2", record: { field: { value: "v2" } } }
  ]
});
```

### Delete Records

```ts
// Delete multiple records
await client.record.deleteRecords({
  app: "1",
  ids: ["1", "2", "3"]
});

// Delete unlimited records
await client.record.deleteAllRecords({
  app: "1",
  records: [
    { id: "1" },
    { id: "2" }
  ]
});
```

### Comments

```ts
// Get comments
const { comments } = await client.record.getRecordComments({
  app: "1",
  record: "10"
});

// Add a comment
await client.record.addRecordComment({
  app: "1",
  record: "10",
  comment: {
    text: "Comment text",
    mentions: [{ code: "user1", type: "USER" }]
  }
});

// Delete a comment
await client.record.deleteRecordComment({
  app: "1",
  record: "10",
  comment: "5"
});
```

### Process Management (Status)

```ts
// Update status
await client.record.updateRecordStatus({
  app: "1",
  id: "10",
  action: "Submit"
});

// Update assignees
await client.record.updateRecordAssignees({
  app: "1",
  id: "10",
  assignees: ["user1", "user2"]
});
```

---

## File API (`client.file.*`)

```ts
// Upload a file
const { fileKey } = await client.file.uploadFile({
  file: {
    name: "hello.txt",
    data: "Hello World!"
  }
});

// Upload from path (Node.js only)
const { fileKey } = await client.file.uploadFile({
  file: { path: "/path/to/file.pdf" }
});

// Attach file to a record
await client.record.addRecord({
  app: "1",
  record: {
    Attachment: { value: [{ fileKey }] }
  }
});

// Download a file
const data = await client.file.downloadFile({
  fileKey: "file-key-from-record"
});
```

---

## App API (`client.app.*`)

### Get App Info

```ts
// Get app info
const app = await client.app.getApp({ id: "1" });

// Get multiple apps
const { apps } = await client.app.getApps({
  ids: ["1", "2"],
  name: "search name"
});

// Get form fields
const { properties } = await client.app.getFormFields({ app: "1" });

// Get form layout
const { layout } = await client.app.getFormLayout({ app: "1" });

// Get views
const { views } = await client.app.getViews({ app: "1" });
```

### Create a New App

```ts
// Create a preview app
const { app, revision } = await client.app.addApp({
  name: "App Name",
  space: 5  // optional: space ID
});

// Add fields
await client.app.addFormFields({
  app: "1",
  properties: {
    text_field: {
      type: "SINGLE_LINE_TEXT",
      code: "text_field",
      label: "Text"
    },
    number_field: {
      type: "NUMBER",
      code: "number_field",
      label: "Number"
    }
  }
});

// Update form layout
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
// Get app settings
const settings = await client.app.getAppSettings({
  app: "1",
  lang: "ja",    // optional: default, en, zh, ja, user
  preview: true  // optional: get pre-live settings
});
// Returns: { name, description, icon, theme, revision, ... }

// Update app settings
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

### Process Management (Workflow)

```ts
// Get process management settings
const process = await client.app.getProcessManagement({
  app: "1",
  preview: true  // optional
});
// Returns: { enable, states, actions, revision }

// Update process management
await client.app.updateProcessManagement({
  app: "1",
  enable: true,
  states: {
    "Not Started": { name: "Not Started", index: "0" },
    "In Progress": {
      name: "In Progress",
      index: "1",
      assignee: {
        type: "ONE",  // ONE, ALL, ANY
        entities: [
          { entity: { type: "USER", code: "user1" } }
        ]
      }
    },
    "Completed": { name: "Completed", index: "2" }
  },
  actions: [
    { name: "Start", from: "Not Started", to: "In Progress" },
    { name: "Complete", from: "In Progress", to: "Completed" }
  ]
});
```

### Deploy App

```ts
// Deploy changes (pre-live -> live)
await client.app.deployApp({
  apps: [{ app: "1" }],
  revert: false  // true = revert pre-live to live settings
});

// Check deploy status
const { apps } = await client.app.getDeployStatus({ apps: ["1"] });
// Status: PROCESSING, SUCCESS, FAIL, CANCEL
```

---

## Bulk Request

Run multiple API requests simultaneously (max 20 requests):

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
// Get installed plugins
const { plugins } = await client.plugin.getPlugins({ limit: 10 });

// Install plugin
const { id } = await client.plugin.installPlugin({ fileKey: "..." });

// Uninstall plugin
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

For `addAllRecords`, `updateAllRecords`, `deleteAllRecords`:

```ts
import { KintoneAllRecordsError } from "@kintone/rest-api-client";

try {
  await client.record.addAllRecords({ app: "1", records });
} catch (error) {
  if (error instanceof KintoneAllRecordsError) {
    console.log(error.processedRecordsResult); // Successfully processed records
    console.log(error.unprocessedRecords);     // Unprocessed records
    console.log(error.numOfProcessedRecords);  // Number of processed records
    console.log(error.errorIndex);             // Index where error occurred
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

## Important Notes

1. **API Limits**:
   - `getRecords`: max 500 records
   - `addRecords`/`updateRecords`: max 100 records
   - `deleteRecords`: max 100 records
   - `bulkRequest`: max 20 requests

2. **Use `*AllRecords` methods** for large datasets (automatically chunks into 2000-record batches)

3. **Revision number**: Used to prevent conflicts during concurrent updates

4. **Query syntax**: See https://kintone.dev/en/docs/kintone/overview/query-string/

---

## App Management Scripts

CLI scripts for managing kintone apps organized by category:

### Folder Structure

```text
scripts/app-management/
├── common/          # Shared utilities
├── app/             # App info & settings
├── form/            # Fields & layout
├── views/           # Views
├── customize/       # JS/CSS customization
├── acl/             # Permissions
├── process/         # Process management (workflow)
├── notifications/   # Notifications
├── reports/         # Reports (graphs)
├── records/         # Record CRUD, comments, cursor, status
├── file/            # File upload/download
├── bulk/            # Bulk request
├── deploy/          # Deploy & status
└── space/           # Space & guest management
```

### App - App Info & Settings

```bash
npm run app:get <appId>                              # Get app info
npm run app:get-all                                   # Get all apps
npm run app:add "App Name" [spaceId]                  # Create new app
npm run app:get-settings <appId> [--preview]          # Get app settings
npm run app:update-settings <appId> <jsonPath>        # Update app settings
```

### Form - Fields & Layout

```bash
npm run form:get-fields <appId>                       # Get fields + generate TypeScript
npm run form:add-fields <appId> <jsonPath>            # Add fields
npm run form:update-fields <appId> <jsonPath>         # Update fields
npm run form:delete-fields <appId> <code1> [code2]    # Delete fields
npm run form:get-layout <appId>                       # Get layout
npm run form:update-layout <appId> <jsonPath>         # Update layout
```

### Views

```bash
npm run views:get <appId> [--preview]                 # Get views
npm run views:update <appId> <jsonPath>               # Update views
```

### Customize - JS/CSS Customization

```bash
npm run customize:get <appId> [--preview]             # Get customization settings
npm run customize:update <appId> <jsonPath>           # Update customization
```

### ACL - Permissions

```bash
npm run acl:get-app <appId> [--preview]               # Get app permissions
npm run acl:update-app <appId> <jsonPath>             # Update app permissions
npm run acl:get-record <appId> [--preview]            # Get record permissions
npm run acl:update-record <appId> <jsonPath>          # Update record permissions
npm run acl:get-field <appId> [--preview]             # Get field permissions
npm run acl:update-field <appId> <jsonPath>           # Update field permissions
npm run acl:evaluate <appId> <recordId1> [recordId2]  # Evaluate record permissions
```

### Process - Process Management (Workflow)

```bash
npm run process:get <appId> [--preview]               # Get process management
npm run process:update <appId> <jsonPath>             # Update process management
```

### Notifications

```bash
npm run notify:get-general <appId> [--preview]        # Get general notifications
npm run notify:update-general <appId> <jsonPath>      # Update general notifications
npm run notify:get-record <appId> [--preview]         # Get per-record notifications
npm run notify:update-record <appId> <jsonPath>       # Update per-record notifications
npm run notify:get-reminder <appId> [--preview]       # Get reminder notifications
npm run notify:update-reminder <appId> <jsonPath>     # Update reminder notifications
```

### Reports (Graphs)

```bash
npm run reports:get <appId> [--preview]               # Get reports
npm run reports:update <appId> <jsonPath>             # Update reports
```

### Deploy

```bash
npm run deploy:app <appId> [--revert] [--no-wait]     # Deploy app
npm run deploy:status <appId> [appId2] ...            # Check deploy status
```

### Records - Record Management

```bash
# Single Record
npm run record:get <appId> <recordId>                 # Get record
npm run record:add <appId> [recordJsonPath]           # Add record
npm run record:update <appId> <recordId> <jsonPath>   # Update record
npm run record:upsert <appId> <keyField> <keyValue> [jsonPath]  # Upsert record

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

### Comments - Record Comments

```bash
npm run comment:get <appId> <recordId> [--order=asc|desc] [--limit=N]
npm run comment:add <appId> <recordId> "<text>"
npm run comment:add <appId> <recordId> --json=<commentJsonPath>  # with mentions
npm run comment:delete <appId> <recordId> <commentId>
```

### Cursor - Fetch Large Record Sets

```bash
npm run cursor:create <appId> [--query="..."] [--size=N]   # Create cursor
npm run cursor:get <cursorId>                              # Get records
npm run cursor:delete <cursorId>                           # Delete cursor
```

### Status/Assignees - Process Management (Workflow)

```bash
npm run status:update <appId> <recordId> "<action>" [--assignee=<user>]
npm run status:update-many <appId> <recordsJsonPath>
npm run assignees:update <appId> <recordId> <user1> [user2] ...
npm run assignees:update <appId> <recordId> --clear        # Remove assignees
```

### File - Upload/Download

```bash
npm run file:upload <filePath>                            # Upload file (returns fileKey)
npm run file:download <fileKey> [outputPath]              # Download file
```

### Bulk - Run Multiple APIs

```bash
npm run bulk:request <requestsJsonPath>                   # Run multiple APIs (max 20)
```

JSON format for bulk request:

```json
[
  { "method": "POST", "api": "/k/v1/record.json", "payload": { "app": "1", "record": {...} } },
  { "method": "PUT", "api": "/k/v1/record.json", "payload": { "app": "1", "id": "10", "record": {...} } }
]
```

### Example: Creating a New App

```bash
# 1. Create App
npm run app:add "Customer Management"
# Output: App ID: 123

# 2. Add Fields
npm run form:add-fields 123 ./fields.json

# 3. Update Layout
npm run form:update-layout 123 ./layout.json

# 4. Configure Views
npm run views:update 123 ./views.json

# 5. Deploy
npm run deploy:app 123
```

---

## Field Types Reference

| Type | Description | Example Value |
|------|-------------|---------------|
| `SINGLE_LINE_TEXT` | Single line text | `{ value: "text" }` |
| `MULTI_LINE_TEXT` | Multi-line text | `{ value: "line1\nline2" }` |
| `RICH_TEXT` | Rich text (HTML) | `{ value: "<p>text</p>" }` |
| `NUMBER` | Number | `{ value: "123" }` |
| `CALC` | Calculated field | (read-only) |
| `DROP_DOWN` | Dropdown | `{ value: "option1" }` |
| `RADIO_BUTTON` | Radio button | `{ value: "option1" }` |
| `CHECK_BOX` | Checkbox | `{ value: ["opt1", "opt2"] }` |
| `MULTI_SELECT` | Multi-select | `{ value: ["opt1", "opt2"] }` |
| `DATE` | Date | `{ value: "2024-01-15" }` |
| `TIME` | Time | `{ value: "10:30" }` |
| `DATETIME` | Date and time | `{ value: "2024-01-15T10:30:00Z" }` |
| `LINK` | Link | `{ value: "https://..." }` |
| `FILE` | File attachment | `{ value: [{ fileKey: "..." }] }` |
| `USER_SELECT` | User selection | `{ value: [{ code: "user1" }] }` |
| `ORGANIZATION_SELECT` | Organization selection | `{ value: [{ code: "org1" }] }` |
| `GROUP_SELECT` | Group selection | `{ value: [{ code: "group1" }] }` |
| `SUBTABLE` | Subtable | `{ value: [{ value: { field: { value } } }] }` |

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
// Same as Desktop but replace "app" with "mobile.app"
kintone.events.on("mobile.app.record.index.show", (event) => { ... });
kintone.events.on("mobile.app.record.detail.show", (event) => { ... });
kintone.events.on("mobile.app.record.create.show", (event) => { ... });
kintone.events.on("mobile.app.record.edit.show", (event) => { ... });
```

### Event Object Properties

```ts
// General event object
{
  appId: number,
  recordId: number,  // Not available in create events
  record: { ... },   // Record data
  type: string       // Event type
}

// For change events
{
  ...
  changes: {
    field: { value: ... },  // Changed field
    row: { ... }            // For subtable changes
  }
}
```

### Return Values

```ts
// Cancel submit
return false;

// Modify record before save
event.record.field_code.value = "new value";
return event;

// Async operation
return kintone.Promise.resolve(event);
```

---

## Space API (`client.space.*`)

### Get Space Info

```ts
// Get space info
const space = await client.space.getSpace({ id: "1" });
// Returns: { id, name, defaultThread, isPrivate, creator, memberCount, body, useMultiThread, isGuest, attachedApps, fixedMember, permissions, ... }

// Get space members
const { members } = await client.space.getSpaceMembers({ id: "1" });
// Returns: { members: [{ entity: { type, code }, isAdmin, isImplicit, includeSubs }] }
```

### Manage Spaces

```ts
// Update space settings
await client.space.updateSpace({
  id: "1",
  name: "New Name",
  isPrivate: true,
  fixedMember: false,
  useMultiThread: true,
  permissions: { createApp: "EVERYONE" }
});

// Update space body (HTML)
await client.space.updateSpaceBody({ id: "1", body: "<h1>Welcome</h1>" });

// Update members
await client.space.updateSpaceMembers({
  id: "1",
  members: [
    { entity: { type: "USER", code: "user1" }, isAdmin: true },
    { entity: { type: "GROUP", code: "group1" }, isAdmin: false }
  ]
});

// Delete space
await client.space.deleteSpace({ id: "1" });

// Create space from template
const { id } = await client.space.addSpaceFromTemplate({
  id: "1",  // template ID
  name: "New Space",
  members: [{ entity: { type: "USER", code: "admin" }, isAdmin: true }],
  isPrivate: false,
  isGuest: false
});
```

### Threads

```ts
// Create thread (requires multi-thread enabled)
const { id } = await client.space.addThread({ space: "1", name: "Thread Name" });

// Update thread
await client.space.updateThread({ id: "222", name: "New Name", body: "<p>Body</p>" });

// Add comment
const { id: commentId } = await client.space.addThreadComment({
  space: "1",
  thread: "222",
  comment: {
    text: "Comment text",
    mentions: [{ code: "user1", type: "USER" }]
  }
});
```

### Guest Users

```ts
// Add guest users
await client.space.addGuests({
  guests: [{
    name: "Guest",
    code: "guest@example.com",
    password: "tempPass123",
    timezone: "Asia/Tokyo",
    locale: "ja"
  }]
});

// Add guest to space
await client.space.updateSpaceGuests({
  id: "1",
  guests: ["guest@example.com"]
});

// Delete guest users
await client.space.deleteGuests({ guests: ["guest@example.com"] });
```

### Space CLI Commands

```bash
npm run space:get <spaceId>                              # Get space info
npm run space:update <spaceId> <jsonPath>                 # Update space settings
npm run space:delete <spaceId> --confirm                  # Delete space
npm run space:update-body <spaceId> <htmlPath>            # Update space body
npm run space:get-members <spaceId>                       # Get space members
npm run space:update-members <spaceId> <jsonPath>         # Update members
npm run space:add-thread <spaceId> "Thread Name"          # Create thread
npm run space:update-thread <threadId> --name="..."       # Update thread
npm run space:add-thread-comment <spaceId> <threadId> "text"  # Add comment
npm run space:add-from-template <templateId> "Name" <membersJsonPath>  # Create space from template
npm run guest:add <guestsJsonPath>                        # Add guest users
npm run guest:delete <email> --confirm                    # Delete guest users
npm run guest:update-space <spaceId> <email1> [email2]    # Update guest members in space
```
