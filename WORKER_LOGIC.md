# Worker Logic & Authority Control System

## Project: Clear City – Spot It. Report It. Resolve It.

---

## 1. Overview

This document defines the **Worker Logic** and **Authority Control Flow** within the Clear City platform.  
It explains how **Users (Citizens)**, **Workers (Field Staff)**, and **Authorities (Municipal Admins)** interact to ensure transparent, accountable, and efficient environmental issue resolution.

The system follows a **role-based access control (RBAC)** model with strong verification, auditability, and feedback loops.

---

## 2. System Roles & Responsibilities

### 2.1 User (Citizen / Community Member)

Users act as **issue reporters and validators**.

**Key Responsibilities**
- Register and authenticate via standard user authentication.
- Submit environmental issue reports using:
  - AI-assisted image detection
  - Manual form-based reporting
- View all reports on a live interactive map.
- Engage with community feed (view, comment, track).
- Rate issue resolution using a star-based feedback system.
- Earn points and ranks based on contribution quality.

Users **do not modify report states directly**.  
All lifecycle transitions are managed by Authority and Worker actions.

---

### 2.2 Worker (Field Staff / Cleaning Personnel)

Workers act as **execution agents** responsible for on-ground resolution.

**Key Characteristics**
- Cannot self-register.
- Access is granted **only after authority verification**.
- Assigned tasks explicitly by Authority.

---

### 2.3 Authority (Admin / Municipal Authority)

Authority acts as the **control layer** and **decision-making entity**.

**Key Responsibilities**
- Verify workers.
- Validate user reports.
- Assign tasks.
- Approve or reject resolutions.
- Monitor performance, SLAs, and citizen satisfaction.

---

## 3. Worker Authentication & Verification Flow

### 3.1 Worker Onboarding

1. Worker details are added by Authority.
2. Authority verifies:
   - Identity
   - Role
   - Assigned jurisdiction
3. System generates worker credentials.
4. Worker gains access only after verification approval.

**Security Principle**
> No anonymous or self-registered workers are allowed.

---

### 3.2 Worker Login Flow

Worker Login Request → Authority Verification Check → Access Granted / Denied → Worker Dashboard

---

## 4. Worker Dashboard Logic

Once authenticated, workers can access:

### 4.1 Assigned Reports View
Each task contains:
- Report ID
- Geo-location (latitude, longitude)
- Issue category (AI/manual)
- Severity level
- User-submitted images
- Assigned deadline (SLA)

Workers **cannot see unassigned reports**.

---

### 4.2 Task Status Lifecycle (Worker View)

Assigned → In Progress → Resolved (Pending Authority Approval)

Workers **cannot close tasks permanently**.

---

## 5. Issue Resolution Workflow (Worker Perspective)

### 5.1 Resolution Steps

1. Navigate to assigned location.
2. Resolve the issue physically.
3. Capture proof of resolution.
4. Upload resolution proof.
5. Mark task as **Resolved (Awaiting Approval)**.

---

## 6. Authority Verification & Control Logic

### 6.1 Resolution Verification

Worker Resolution Submitted → Authority Review → Approve / Reject

---

## 7. Feedback & Performance Evaluation

### 7.1 User Feedback Loop
Users rate resolution (⭐ 1–5).

### 7.2 Worker Performance Metrics
- Average rating
- Resolution time
- SLA compliance
- Rejection count

---

## 8. Governance & Transparency

- Role-based permissions enforced.
- Mandatory justification for rejections.
- Immutable audit logs.

---

## 9. Summary

This Worker–Authority logic ensures accountability, transparency, and scalable municipal operations.

---

End of Document
