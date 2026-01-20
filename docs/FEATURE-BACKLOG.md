# Acquisitions Module - Feature Backlog

**Created:** January 2026
**Status:** Active Development

---

## Phase 1: Core Backend (Weeks 1-4)
*Foundation for the application*

| ID | Feature | Status | Priority | Sessions |
|----|---------|--------|----------|----------|
| 1.1 | Backend foundation (Node/Express) | ⬜ Pending | Critical | 2-3 |
| 1.2 | PostgreSQL database setup | ⬜ Pending | Critical | 1-2 |
| 1.3 | Database migrations (all tables) | ⬜ Pending | Critical | 2 |
| 1.4 | Loans API (CRUD) | ⬜ Pending | Critical | 2 |
| 1.5 | Borrowers API (CRUD) | ⬜ Pending | Critical | 1-2 |
| 1.6 | Collateral API (CRUD) | ⬜ Pending | Critical | 1-2 |
| 1.7 | Comments API (CRUD) | ⬜ Pending | High | 1 |
| 1.8 | Payment History API | ⬜ Pending | Critical | 2 |
| 1.9 | Projections API | ⬜ Pending | High | 2 |
| 1.10 | Exit Strategies API | ⬜ Pending | High | 1-2 |

---

## Phase 2: Data Import & Auth (Weeks 4-6)
*Get real data in, secure the system*

| ID | Feature | Status | Priority | Sessions |
|----|---------|--------|----------|----------|
| 2.1 | Excel/CSV tape import | ⬜ Pending | Critical | 3-4 |
| 2.2 | Column mapping interface | ⬜ Pending | High | 2 |
| 2.3 | Import validation & error handling | ⬜ Pending | High | 2 |
| 2.4 | Authentication system | ⬜ Pending | Critical | 2 |
| 2.5 | User management | ⬜ Pending | High | 1-2 |
| 2.6 | Role-based permissions | ⬜ Pending | Medium | 1-2 |
| 2.7 | Session management | ⬜ Pending | High | 1 |

---

## Phase 3: Frontend Integration (Weeks 6-7)
*Connect existing UI to real backend*

| ID | Feature | Status | Priority | Sessions |
|----|---------|--------|----------|----------|
| 3.1 | Replace mock API with real API | ⬜ Pending | Critical | 2-3 |
| 3.2 | Loading states & error handling | ⬜ Pending | High | 1 |
| 3.3 | Data refresh & caching | ⬜ Pending | Medium | 1 |
| 3.4 | Optimistic updates | ⬜ Pending | Low | 1 |

---

## Phase 4: Dashboard & Reports (Weeks 7-8)
*Portfolio-level views and exports*

| ID | Feature | Status | Priority | Sessions |
|----|---------|--------|----------|----------|
| 4.1 | Deal/Project data model | ⬜ Pending | High | 1-2 |
| 4.2 | Deal pipeline dashboard | ⬜ Pending | High | 3-4 |
| 4.3 | Portfolio summary view | ⬜ Pending | High | 2 |
| 4.4 | Excel export | ⬜ Pending | High | 2 |
| 4.5 | PDF report generation | ⬜ Pending | Medium | 2-3 |
| 4.6 | Bid comparison tracking | ⬜ Pending | Medium | 2 |

---

## Phase 5: Rich Text Overview (Weeks 9-11)
*Enhanced loan analysis documentation*

| ID | Feature | Status | Priority | Sessions |
|----|---------|--------|----------|----------|
| 5.1 | TipTap rich text editor integration | ⬜ Pending | High | 1-2 |
| 5.2 | Formatting toolbar (bold, italic, lists, etc.) | ⬜ Pending | High | 1-2 |
| 5.3 | Text highlighting | ⬜ Pending | High | 1 |
| 5.4 | Table support in editor | ⬜ Pending | High | 1 |
| 5.5 | Image upload (local filesystem) | ⬜ Pending | High | 2 |
| 5.6 | Image paste from clipboard | ⬜ Pending | High | 1 |
| 5.7 | Image drag & drop | ⬜ Pending | Medium | 1 |
| 5.8 | Image storage abstraction layer | ⬜ Pending | Medium | 1 |
| 5.9 | Overview sections (Summary, Analysis, Risks, Recommendation) | ⬜ Pending | High | 2 |
| 5.10 | Collapsible sections | ⬜ Pending | Medium | 1 |
| 5.11 | Auto-save | ⬜ Pending | Medium | 1 |
| 5.12 | Overview database schema & API | ⬜ Pending | High | 2 |
| 5.13 | Spell check (browser native) | ⬜ Pending | Low | Built-in |

---

## Phase 6: Deployment & Polish (Week 12)
*Production-ready*

| ID | Feature | Status | Priority | Sessions |
|----|---------|--------|----------|----------|
| 6.1 | Deployment configuration | ⬜ Pending | Critical | 1-2 |
| 6.2 | Environment variables setup | ⬜ Pending | Critical | 1 |
| 6.3 | Database backup strategy | ⬜ Pending | High | 1 |
| 6.4 | Error logging & monitoring | ⬜ Pending | High | 1 |
| 6.5 | Performance testing | ⬜ Pending | Medium | 1 |
| 6.6 | Bug fixes & polish | ⬜ Pending | High | 3-4 |

---

## Future Features (Post-Launch)
*Nice to have, not in initial scope*

| ID | Feature | Status | Priority | Notes |
|----|---------|--------|----------|-------|
| F.1 | Tax research integration | ⬜ Backlog | Medium | Internal tool, not API product |
| F.2 | Microsoft SSO | ⬜ Backlog | Medium | If IT requires |
| F.3 | Overview version history | ⬜ Backlog | Low | See who changed what |
| F.4 | Overview templates | ⬜ Backlog | Low | Pre-fill for new loans |
| F.5 | Export overview to Word/PDF | ⬜ Backlog | Medium | For external sharing |
| F.6 | Document attachment (non-image) | ⬜ Backlog | Medium | PDFs, Word docs |
| F.7 | Audit trail UI | ⬜ Backlog | Low | View change history |
| F.8 | Advanced search | ⬜ Backlog | Medium | Search across all loans |
| F.9 | Bulk operations | ⬜ Backlog | Low | Update multiple loans |
| F.10 | Custom fields | ⬜ Backlog | Low | User-defined fields |
| F.11 | Mobile responsive | ⬜ Backlog | Low | Phone/tablet access |
| F.12 | Cloud image storage (S3) | ⬜ Backlog | Low | If scale requires |

---

## Summary

| Phase | Features | Sessions | Weeks |
|-------|----------|----------|-------|
| 1. Core Backend | 10 | 15-18 | 4 |
| 2. Import & Auth | 7 | 12-15 | 2 |
| 3. Frontend Integration | 4 | 5-6 | 1 |
| 4. Dashboard & Reports | 6 | 12-15 | 2 |
| 5. Rich Text Overview | 13 | 15-18 | 3 |
| 6. Deployment & Polish | 6 | 8-10 | 1 |
| **Total** | **46** | **67-82** | **~12 weeks** |

---

## Notes

- Sessions assume 2-3 per week with Claude
- Your testing/integration time is additional
- Priorities: Critical > High > Medium > Low
- Features can be reordered based on business need

---

## Change Log

| Date | Change |
|------|--------|
| Jan 2026 | Initial backlog created |
| Jan 2026 | Added Phase 5: Rich Text Overview with image storage |
