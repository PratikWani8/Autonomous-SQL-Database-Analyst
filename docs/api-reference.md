# API Reference Documentation

## 1. Node.js Application Gateway APIs (Port 5000)

Base URL: `http://localhost:5000/api`

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new user.
  - Body: `{ "name": "...", "email": "...", "password": "...", "preferredLanguage": "en"|"hi"|"mr" }`
  - Returns: `{ "success": true, "token": "...", "user": { ... } }`
- `POST /api/auth/login`: Authenticate existing user.
  - Body: `{ "email": "...", "password": "..." }`
  - Returns: `{ "success": true, "token": "...", "user": { ... } }`
- `GET /api/auth/me`: Current logged-in user profile (Requires `Authorization: Bearer <token>`).
- `PUT /api/auth/profile`: Update profile / language preferences.
- `POST /api/auth/logout`: Clears session token.

### Datasets (`/api/datasets`)
- `GET /api/datasets`: List all public Indian datasets metadata.
- `GET /api/datasets/:id`: Get detailed metadata for specific dataset.
- `GET /api/datasets/:id/schema`: Inspect column specifications, descriptions, and units.
- `GET /api/datasets/:id/preview`: Preview first 20 records directly from PostgreSQL.

### Analytics Pipeline (`/api/analytics`)
- `POST /api/analytics/query`: Execute natural-language question.
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "question": "Which five districts have the highest population in 2011?", "tableName": "district_demographics_stats" }`
  - Returns: Full structured `AnalysisResponse` object.
- `GET /api/analytics/history`: Paginated list of user's past queries.
- `GET /api/analytics/history/:id`: Fetch single history item by ID.
- `POST /api/analytics/history/:id/rerun`: Reruns historical query.
- `DELETE /api/analytics/history/:id`: Removes historical record.

### Saved Insights (`/api/saved-insights`)
- `GET /api/saved-insights`: List user's saved analytical charts.
- `POST /api/saved-insights`: Save an insight with custom title, notes, and chart preferences.
- `DELETE /api/saved-insights/:id`: Delete saved insight.

### Dashboard & Health (`/api/dashboard`, `/api/health`)
- `GET /api/dashboard/summary`: Summary metrics (datasets count, query count, saved count, quick questions).
- `GET /api/health`: Service health status for server, MongoDB, and FastAPI.

---

## 2. Python FastAPI Internal Service APIs (Port 8000)

Base URL: `http://localhost:8000`
Header required: `x-internal-service-key: <INTERNAL_SERVICE_KEY>`

- `POST /internal/analyze`: Main pipeline orchestrator.
  - Body: `AnalysisRequest` (`question`, `dataset_id`, `table_name`, `preferred_language`, `request_id`).
  - Returns: Complete `AnalysisResponse`.
- `POST /internal/sql/validate`: Standalone SQL AST validator via SQLGlot.
  - Body: `{ "sql": "SELECT ...", "target_table": "..." }`
  - Returns: `SQLValidationResult`.
- `POST /internal/sql/execute`: Standalone read-only query executor.
  - Body: `{ "sql": "SELECT ...", "max_rows": 500 }`
  - Returns: `SQLExecutionResult`.
- `POST /internal/results/validate`: Standalone Pandas result quality validator.
  - Body: Array of row objects `[{ ... }]`.
  - Returns: `ResultValidationResult`.
- `GET /health`: Database connection status and active LLM provider.
