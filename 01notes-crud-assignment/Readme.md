# Assignment 01: Notes Management REST API

## Objective

Build a Notes Management REST API using Node.js, Express, MongoDB, and Mongoose.

This assignment focuses on:
- database connection setup
- schema design
- MVC architecture
- proper CRUD operations with correct HTTP methods

Scope:
- no frontend
- no authentication
- no extra features

## Mandatory Development Discipline

### Commit Rule (Strict)
After completing each endpoint, create a separate commit.

Do not implement all endpoints and commit once.

### Required Workflow
1. Implement one endpoint.
2. Test the endpoint in Postman.
3. Verify functionality, status code, and response format.
4. Commit immediately.

### Commit Message Format
```bash
git add .
git commit -m "feat: add create note endpoint (POST /api/notes)"
```

Failure to follow the workflow may lead to assignment rejection.

## Project Structure

```text
01notes-crud-assignment/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   └── note.model.js
│   ├── controllers/
│   │   └── note.controller.js
│   ├── routes/
│   │   └── note.routes.js
│   ├── middlewares/
│   ├── app.js
│   └── index.js
├── .env
├── .env.example
├── package.json
└── README.md
```

### File Responsibility
- src/config/db.js: mongoose.connect() logic only
- src/models/note.model.js: schema and model only
- src/controllers/note.controller.js: business logic + queries + responses
- src/routes/note.routes.js: routes only (no controller logic)
- src/app.js: express setup, express.json(), route mounting
- src/index.js: app.listen() only

## Data Model

File: src/models/note.model.js

```js
const noteSchema = new mongoose.Schema(
  {
    title:    { type: String, required: [true, "Title is required"] },
    content:  { type: String, required: [true, "Content is required"] },
    category: { type: String, enum: ["work", "personal", "study"], default: "personal" },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);
```

Fields:
- title: String, required
- content: String, required
- category: String enum (work, personal, study), default personal
- isPinned: Boolean, default false
- createdAt/updatedAt: auto-generated

## API Specification

Base URL: /api/notes

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | POST | /api/notes | Create a single note |
| 2 | POST | /api/notes/bulk | Create multiple notes |
| 3 | GET | /api/notes | Get all notes |
| 4 | GET | /api/notes/:id | Get one note by id |
| 5 | PUT | /api/notes/:id | Replace a note completely |
| 6 | PATCH | /api/notes/:id | Update specific fields only |
| 7 | DELETE | /api/notes/:id | Delete a single note |
| 8 | DELETE | /api/notes/bulk | Delete multiple notes by ids |

### 1) POST /api/notes
Request:
```json
{
  "title": "Team standup agenda",
  "content": "Discuss sprint blockers and deployment plan",
  "category": "work",
  "isPinned": true
}
```

Success (201):
```json
{
  "success": true,
  "message": "Note created successfully",
  "data": {}
}
```

### 2) POST /api/notes/bulk
Request:
```json
{
  "notes": [
    { "title": "Note one", "content": "Content one", "category": "work" },
    { "title": "Note two", "content": "Content two", "category": "study" },
    { "title": "Note three", "content": "Content three", "category": "personal" }
  ]
}
```

Success (201):
```json
{
  "success": true,
  "message": "3 notes created successfully",
  "data": []
}
```

Note: use Note.insertMany().

### 3) GET /api/notes
Success (200):
```json
{
  "success": true,
  "message": "Notes fetched successfully",
  "data": []
}
```

### 4) GET /api/notes/:id
Success (200):
```json
{
  "success": true,
  "message": "Note fetched successfully",
  "data": {}
}
```

### 5) PUT /api/notes/:id
Request:
```json
{
  "title": "Completely new title",
  "content": "Completely new content",
  "category": "personal",
  "isPinned": false
}
```

Success (200):
```json
{
  "success": true,
  "message": "Note replaced successfully",
  "data": {}
}
```

Use overwrite semantics with runValidators.

### 6) PATCH /api/notes/:id
Request:
```json
{
  "isPinned": true
}
```

Success (200):
```json
{
  "success": true,
  "message": "Note updated successfully",
  "data": {}
}
```

Use partial update with runValidators.

### 7) DELETE /api/notes/:id
Success (200):
```json
{
  "success": true,
  "message": "Note deleted successfully",
  "data": null
}
```

### 8) DELETE /api/notes/bulk
Request:
```json
{
  "ids": [
    "64b1f2c3e4d5a6b7c8d9e0f1",
    "64b1f2c3e4d5a6b7c8d9e0f2",
    "64b1f2c3e4d5a6b7c8d9e0f3"
  ]
}
```

Success (200):
```json
{
  "success": true,
  "message": "3 notes deleted successfully",
  "data": null
}
```

Note: use Note.deleteMany({ _id: { $in: ids } }).

## Response Format (Required)

All responses (success and error) must follow:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Where data can be object, array, or null.

## Status Codes

- 200: successful GET, PUT, PATCH, DELETE
- 201: successful POST
- 400: invalid input, invalid ObjectId, empty body/array
- 404: note not found
- 500: unexpected server/database error

## Validation Rules

- title and content are required on create
- validate ObjectId format first on all /:id routes
- return 404 if note not found
- PATCH with empty body -> 400 and message "No fields provided to update"
- bulk create with missing/empty notes -> 400
- bulk delete with missing/empty ids -> 400

## PUT vs PATCH

| | PUT | PATCH |
|-|-----|-------|
| Meaning | Replace full document | Update only provided fields |
| Unsent fields | Reset to default | Stay unchanged |
| Use case | Full edit submission | Small/partial updates |

## Environment Variables

.env (do not commit):
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/notes-db
PORT=5000
```

.env.example (commit this):
```env
MONGO_URI=your_mongodb_connection_string_here
PORT=5000
```

## Packages

```bash
npm install express mongoose dotenv
npm install --save-dev nodemon
```

Required scripts:
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

## How To Run

```bash
npm install
npm run dev
```


