# Worker Logic – Technical Specification
## Project: Clear City – Spot It. Report It. Resolve It.

---

## 1. Scope

This document defines the **technical implementation of the Worker subsystem** and its interaction with **Users** and **Authorities**.  
It focuses on backend logic, APIs, database models, state machines, SLA handling, and audit mechanisms.

---

## 2. Role-Based Access Control (RBAC)

### 2.1 Roles

| Role | Description | Core Permissions |
|-----|------------|-----------------|
| USER | Citizen reporter | Create reports, view status, rate resolution |
| WORKER | Field staff | Execute assigned tasks, upload proof |
| AUTHORITY | Admin | Approve reports, assign workers, verify resolution |

RBAC is enforced at:
- API Gateway
- Middleware authorization layer
- Service-level guards

---

## 3. Core Data Models

### 3.1 Users
```sql
user_id UUID PRIMARY KEY
role ENUM('USER','WORKER','AUTHORITY')
status ENUM('ACTIVE','SUSPENDED')
created_at TIMESTAMP
```

### 3.2 Reports
```sql
report_id UUID PRIMARY KEY
user_id UUID
category VARCHAR
severity INT
latitude DECIMAL
longitude DECIMAL
status ENUM(
  'SUBMITTED',
  'APPROVED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED_PENDING_VERIFICATION',
  'RESOLVED',
  'REJECTED'
)
created_at TIMESTAMP
```

### 3.3 Worker Tasks
```sql
task_id UUID PRIMARY KEY
report_id UUID
worker_id UUID
sla_deadline TIMESTAMP
task_status ENUM('ASSIGNED','IN_PROGRESS','COMPLETED')
```

### 3.4 Resolution Proof
```sql
proof_id UUID PRIMARY KEY
task_id UUID
image_url TEXT
geo_hash VARCHAR
uploaded_at TIMESTAMP
verified BOOLEAN
```

---

## 4. Worker State Machine

```text
ASSIGNED → IN_PROGRESS → RESOLVED_PENDING_VERIFICATION
                          ↓            ↑
                      APPROVED       REJECTED
                          ↓
                      RESOLVED
```

Workers cannot directly mark tasks as RESOLVED.

---

## 5. API Endpoints (Worker)

### Fetch Assigned Tasks
```http
GET /api/worker/tasks
Authorization: Bearer <JWT>
```

### Update Task Status
```http
PATCH /api/worker/tasks/{task_id}
```

```json
{ "task_status": "IN_PROGRESS" }
```

### Upload Resolution Proof
```http
POST /api/worker/tasks/{task_id}/proof
```

```json
{
  "image_url": "s3://bucket/proof.jpg",
  "geo_hash": "te7r9x"
}
```

---

## 6. Authority Verification Logic

```pseudo
IF proof.location != report.location → REJECT
IF proof.timestamp < task.assigned_at → REJECT
IF SLA expired → FLAG breach
ELSE → APPROVE
```

---

## 7. User Feedback Integration

After authority approval:
- User submits rating (1–5)
- Rating linked to worker metrics
- Used in performance scoring

---

## 8. SLA Monitoring

Background scheduler checks:
```pseudo
IF current_time > sla_deadline AND status != RESOLVED
  → escalate_to_authority
  → mark SLA_BREACH
```

---

## 9. Worker Performance Score

```text
Score =
(Avg_Rating × 0.5) +
(SLA_Compliance × 0.3) +
(Low_Rejection_Rate × 0.2)
```

Updated daily.

---

## 10. Audit Logging

```sql
audit_id UUID PRIMARY KEY
actor_id UUID
action VARCHAR
entity_id UUID
timestamp TIMESTAMP
```

All worker actions are logged and immutable.

---

## 11. Security Controls

- JWT authentication
- Role validation middleware
- No DELETE on core entities
- Authority-only overrides

---

## 12. Failure Handling

| Scenario | Action |
|--------|-------|
| Proof rejected | Task reopened |
| SLA breach | Authority escalation |
| Fake proof | Worker suspension |
| Worker inactive | Task reassignment |

---

## 13. Deployment Notes

- Stateless services
- Object storage for images
- Geo-indexed database
- Message queue for notifications

---

## 14. Summary

The Worker subsystem is:
- Execution-only
- Fully auditable
- Authority-controlled
- SLA-enforced
- Production-ready for Smart City deployments

---

**End of Document**
