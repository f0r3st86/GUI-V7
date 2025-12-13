# GUI-V7 Comprehensive Analysis & Development Roadmap

## PhD-Level Analysis: Computer Science, Finance, Data Analytics, and Cybersecurity

**Document Version:** 1.1
**Date:** December 2025
**System:** Loan Portfolio Acquisition & Bidding Platform (GUI-V7)
**Codebase Size:** 7,146 lines of TypeScript

---

# Part I: Business Context & Domain Analysis

## Executive Summary

GUI-V7 is a **loan portfolio acquisition and bidding platform** designed for institutional investors who purchase distressed or performing loan portfolios from banks, servicers, and government entities (FDIC, Fannie Mae, Freddie Mac, etc.).

## Business Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     LOAN PORTFOLIO ACQUISITION WORKFLOW                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │  Receive     │    │   Import     │    │   Analyze    │    │  Develop  │ │
│  │  Data Tape   │───►│   Loan Data  │───►│   Documents  │───►│   Bids    │ │
│  │  (Excel/CSV) │    │   to System  │    │   & Values   │    │           │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └─────┬─────┘ │
│                                                                      │      │
│                                                                      ▼      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   Close &    │    │    Win       │    │   Submit     │    │  Review   │ │
│  │   Board      │◄───│    Bid       │◄───│   Bids       │◄───│   Bids    │ │
│  │   Loans      │    │              │    │              │    │           │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Business Concepts

### 1. Data Tape
A standardized Excel/CSV file provided by the seller containing loan-level data:
- Loan identification (loan numbers, borrower names)
- Balance information (principal, interest, escrow, fees)
- Payment terms (rate, payment amount, frequency)
- Collateral details (property address, values)
- Payment history (trailing 12-month payments)
- Status (performing, non-performing, foreclosure, REO)

### 2. Relationship Grouping
Loans are grouped by **relationship** (e.g., "Haskell") because:
- Multiple loans may be cross-collateralized
- Same borrower/guarantor across loans
- Bidding strategy may be relationship-level, not loan-level
- Workout strategies affect related loans together

### 3. Bid Development Process

| Stage | Description | System Support |
|-------|-------------|----------------|
| **Data Import** | Load seller's data tape | Data tape import |
| **Document Review** | Analyze loan files, title, appraisals | Collateral/Borrower tabs |
| **Valuation** | Determine property values, exit strategies | Projections tab |
| **Cash Flow Modeling** | Project payments, expenses, exit proceeds | Projections tab |
| **Bid Pricing** | Calculate bid based on target yield | Exit scenarios |
| **Bid Submission** | Export bids for submission | Export feature |

### 4. Exit Strategies (Already Implemented)

| Exit Type | Description | Use Case |
|-----------|-------------|----------|
| **Pay in Full** | Borrower pays off loan | Performing loans |
| **DPO (Discounted Payoff)** | Negotiated settlement < full balance | Sub-performing |
| **Value Cap** | Recovery limited to property value | Underwater loans |
| **YTM Sell Solve** | Price for target yield on resale | Whole loan sales |
| **Liquidation** | Foreclosure and REO sale | Non-performing |

### 5. Projection Persistence Requirement

The user's workflow requires:
> "We import new loan data near bid dates and want projection settings to persist."

**Meaning:**
- Initial data tape imported → Run projections → Save settings
- Updated data tape near bid date → Re-import balances → Settings preserved
- Projection assumptions (exit strategy, expenses) should NOT reset on data refresh

**Current Implementation:** ✅ Phase 3 added per-loan projection/exit settings persistence via React Query

---

## Data Tape Field Mapping

### Standard Data Tape Fields → System Fields

| Data Tape Column | System Field | Tab |
|------------------|--------------|-----|
| Loan Number | `mwLoanNo` | Loan |
| Borrower Name | `borrowerName` | Loan, Borrower |
| Original Balance | `origBal` | Loan |
| Current Principal | `principal` | Loan |
| Accrued Interest | `interest` | Loan |
| Escrow Balance | `escrow` | Loan |
| Interest Rate | `intRate` | Loan |
| Payment Amount | `pmt` | Loan |
| Payment Frequency | `pmtFreq` | Loan |
| Origination Date | `origDt` | Loan |
| Maturity Date | `matDt` | Loan |
| Last Payment Date | `lastPmt` | Loan |
| Property Address | `address1`, `city`, `state`, `zip` | Loan, Collateral |
| Appraised Value | `appraisedValue` | Collateral |
| BPO Value | `bpoValue` | Collateral |
| Loan Status | `status` | Loan |
| T12 Payments | Payment records by month | PayHist |

---

## Bid Calculation Framework

### Target Yield Approach (Industry Standard)

```
Bid Price = PV(target_yield, cash_flows) + PV(target_yield, exit_proceeds)

Where:
- target_yield = Investor's required IRR (e.g., 15-25% for NPLs)
- cash_flows = Projected monthly payments during hold period
- exit_proceeds = Value at exit (PIF, DPO, Liquidation, etc.)
```

### Current System Capabilities

| Calculation | Status | Location |
|-------------|--------|----------|
| Monthly Payment Projections | ✅ Implemented | `ProjectionsTab.tsx` |
| Interest-Only Payments | ✅ Implemented | Payment method option |
| Trailing Payment % | ✅ Implemented | Payment method option |
| Expense Projections | ✅ Implemented | Initial legal, holding costs |
| Exit Value Calculations | ✅ Implemented | 6 exit methods |
| Add-Back Recovery | ✅ Implemented | Expense recovery |
| **IRR/Yield Calculation** | ❌ Not Implemented | Needed for bid pricing |
| **Bid Price Solve** | ❌ Not Implemented | Needed for bid pricing |

### Missing: Bid Price Solver

```typescript
// NEEDED: Solve for bid price given target yield
function solveBidPrice(
  targetYield: number,        // e.g., 0.18 for 18% IRR
  monthlyPayments: number[],  // Projected cash flows
  exitProceeds: number,       // Exit value at end
  exitMonth: number           // When exit occurs
): number {
  // Binary search or Newton-Raphson to find price where IRR = targetYield
  return bidPrice;
}
```

---

## Relationship-Level vs Loan-Level Bidding

### Current Architecture

```
Project (Pool)
  └── Relationship ("Haskell")
        ├── Loan 7758 ─────► Individual projections & exit
        ├── Loan 2461 ─────► Individual projections & exit
        ├── Loan 5091 ─────► Individual projections & exit
        └── Related Borrowers/Collateral (shared)
```

### Bidding Strategies

| Strategy | Description | System Need |
|----------|-------------|-------------|
| **Loan-Level** | Bid on each loan individually | ✅ Current design |
| **Relationship-Level** | Single bid for all related loans | ❌ Aggregation needed |
| **Pool-Level** | Bid on entire portfolio | ❌ Aggregation needed |
| **Cherry-Pick** | Bid on selected subset | Partially supported |

---

## Updated Feature Priorities

Based on the loan acquisition workflow, here are the prioritized features:

### Critical for Bidding Workflow

| Priority | Feature | Business Need |
|----------|---------|---------------|
| P0 | **Data Tape Import** | Load seller data efficiently |
| P0 | **Projection Refresh** | Update balances, preserve settings |
| P0 | **IRR/Yield Calculator** | Determine bid pricing |
| P0 | **Bid Price Solver** | Calculate bid for target yield |
| P1 | **Relationship Aggregation** | Roll up to relationship-level bids |
| P1 | **Bid Export** | Generate bid submission format |
| P1 | **Scenario Comparison** | Compare multiple exit scenarios |

### Supporting Features

| Priority | Feature | Business Need |
|----------|---------|---------------|
| P2 | Document Management | Link loan files to records |
| P2 | Due Diligence Checklist | Track review completion |
| P2 | Bid History | Track bids across projects |
| P3 | Comparable Analysis | Reference similar deals |
| P3 | Portfolio Dashboard | Overview of all projects |

---

# Part II: Technical Analysis Summary

## Architecture Strengths for Acquisition Platform

| Feature | Implementation | Benefit |
|---------|----------------|---------|
| Per-loan settings | React Query + API | Projections persist on data refresh |
| Relationship grouping | `relatedLoans` field | Supports relationship-level analysis |
| Multiple exit methods | 6 methods implemented | Covers standard exit strategies |
| Payment history grid | Year/month matrix | Easy T12/T6/T3 analysis |
| Trailing analytics | Calculated metrics | Payment performance assessment |

## Architecture Gaps for Acquisition Platform

| Gap | Current State | Needed |
|-----|---------------|--------|
| Data tape import | Manual entry only | Excel/CSV import |
| IRR calculation | Not implemented | Core pricing function |
| Bid price solver | Not implemented | Inverse yield calculation |
| Relationship rollup | View only | Aggregated projections |
| Bid export | Not implemented | Submission format |
| Project management | Single pool | Multi-project support |

---

# Part III: Updated Development Roadmap

## Revised Phase Structure

### Phase 5: Fix Async Tests (Ready to Implement)
**Effort:** 1-2 days | **Status:** Plan created

### Phase 6: Security Hardening
**Effort:** 2-3 weeks | **Priority:** Before production

### Phase 7: Data Tape Import ⭐ NEW
**Effort:** 2-3 weeks | **Priority:** Critical for workflow

| Task | Description |
|------|-------------|
| 7.1 | Excel/CSV file parser |
| 7.2 | Field mapping configuration |
| 7.3 | Data validation on import |
| 7.4 | Merge vs. replace options |
| 7.5 | Import history/audit log |
| 7.6 | **Refresh mode** - Update balances, preserve projection settings |

### Phase 8: Bid Pricing Engine ⭐ NEW
**Effort:** 2-3 weeks | **Priority:** Critical for workflow

| Task | Description |
|------|-------------|
| 8.1 | IRR calculation function |
| 8.2 | NPV calculation function |
| 8.3 | Bid price solver (target yield → price) |
| 8.4 | Sensitivity analysis (yield tables) |
| 8.5 | Relationship-level aggregation |
| 8.6 | Bid summary export |

### Phase 9: Backend API Integration
**Effort:** 4-6 weeks | **Priority:** After core features

### Phase 10: Advanced Analytics
**Effort:** 3-4 weeks | **Priority:** Enhancement

| Task | Description |
|------|-------------|
| 10.1 | Portfolio-level metrics |
| 10.2 | Scenario comparison tool |
| 10.3 | Bid history tracking |
| 10.4 | Performance attribution |

### Phase 11: Microsoft SSO
**Effort:** 1-2 weeks | **Priority:** Before production

### Phase 12: Electron Hardening
**Effort:** 1-2 weeks | **Priority:** Before distribution

---

## Revised Implementation Timeline

```
                        Month 1          Month 2          Month 3          Month 4
                    ┌────────────────┬────────────────┬────────────────┬────────────────┐
Phase 5 (Tests)     │████            │                │                │                │
Phase 6 (Security)  │    ████████████│                │                │                │
Phase 7 (Import)    │                │████████████    │                │                │
Phase 8 (Pricing)   │                │        ████████│████            │                │
Phase 9 (Backend)   │                │                │    ████████████│████████        │
Phase 11 (SSO)      │                │                │                │    ████        │
                    └────────────────┴────────────────┴────────────────┴────────────────┘
                                                                              │
                                                                              ▼
                                                                    Production Ready
```

---

# Part IV: Cybersecurity Analysis

## Executive Security Summary

GUI-V7 demonstrates **foundational security patterns** but requires **significant hardening** before production deployment, particularly for a financial system handling PII (SSN, credit scores, DOB).

### Threat Model Context

| Asset | Sensitivity | Primary Threats |
|-------|-------------|-----------------|
| SSN/EIN | **Critical** | Data breach, identity theft |
| Credit Scores | **High** | Privacy violation, discrimination |
| Loan Balances | **High** | Financial fraud, insider threat |
| Payment History | **Medium** | Business intelligence theft |
| User Credentials | **Critical** | Account takeover, privilege escalation |

---

## 1. Security Findings Summary

### Severity Distribution

| Severity | Count | Examples |
|----------|-------|----------|
| **CRITICAL** | 4 | Unencrypted PII, Missing auth dependencies, Auth env fallbacks |
| **HIGH** | 11 | No RBAC, Token storage patterns, TypeScript auth exclusion |
| **MEDIUM** | 12 | Input validation gaps, Debug exposure, No audit logging |
| **LOW** | 3 | Division by zero handling, StrictMode inconsistency |
| **Total** | **30** | |

---

## 2. Critical Security Findings

### CRITICAL-1: Unencrypted PII in Memory and State

**Location:** `src/context/LoanContext.tsx`, `src/data/initialBorrowers.ts`

**Issue:** All Personally Identifiable Information stored in plaintext React state:
```typescript
// src/data/initialBorrowers.ts:19-21
ssnEin: '123-45-6789',
creditScore: '720',
dob: '03/15/1975',
```

**Attack Vectors:**
- Browser DevTools inspection exposes full state
- Memory dump attacks on Electron app
- React Query cache retains PII after component unmount
- No encryption at rest or in transit (within app)

**Risk:** GLBA/SOC2 compliance violation, identity theft liability

**Remediation:**
```typescript
// Implement field-level encryption
interface SecureBorrower {
  ssnToken: string;  // Tokenized reference, not actual SSN
  creditScoreEncrypted: EncryptedField;
  // Never store full SSN in frontend state
}
```

---

### CRITICAL-2: Authentication Dependencies Missing

**Location:** `package.json`

**Issue:** MSAL libraries referenced in code but not in dependencies:
```json
// Missing from package.json:
"@azure/msal-browser": "^2.40.0",
"@azure/msal-react": "^2.0.0"
```

**Risk:** Build will fail; developers may add unvetted versions

---

### CRITICAL-3: Authentication Configuration Fallbacks

**Location:** `src/auth/authConfig.ts:9-11`

```typescript
clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',  // Empty fallback!
authority: `...${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,  // Multi-tenant fallback!
```

**Risk:**
- Empty clientId allows app to load without authentication
- `'common'` fallback enables multi-tenant mode (security anti-pattern)

**Remediation:**
```typescript
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
if (!clientId) throw new Error('VITE_AZURE_CLIENT_ID is required');
```

---

### CRITICAL-4: TypeScript Auth Exclusion

**Location:** `tsconfig.json:24-26`

```json
"exclude": [
  "src/auth/**/*",  // Security-critical code excluded from type checking!
]
```

**Risk:** Authentication code bypasses TypeScript validation, runtime errors possible

---

## 3. High Severity Findings

### HIGH-1: No Role-Based Access Control

**Location:** `src/auth/AuthContext.tsx:42-43`

```typescript
roles: []  // Empty array, never populated from token claims
```

**Issue:** All authenticated users have identical access. No admin/user distinction.

**Remediation:**
```typescript
const setUserFromAccount = (account: AccountInfo) => {
  const idTokenClaims = account.idTokenClaims as { roles?: string[] };
  setUser({
    ...
    roles: idTokenClaims?.roles || ['user']  // Extract from Azure AD token
  });
};
```

---

### HIGH-2: No Session Cleanup on Logout

**Location:** `src/auth/AuthContext.tsx:65-76`

```typescript
const logout = async () => {
  await instance.logoutPopup();
  setUser(null);
  // MISSING: Clear React Query cache, sessionStorage, application state
};
```

**Risk:** PII persists in memory after logout

**Remediation:**
```typescript
const logout = async () => {
  queryClient.clear();           // Clear all cached data
  sessionStorage.clear();        // Clear session storage
  setUser(null);
  await instance.logoutPopup();
};
```

---

### HIGH-3: Error Boundary Exposes Stack Traces

**Location:** `src/components/ErrorBoundary.tsx:69-77`

```typescript
<pre>{this.state.error?.stack}</pre>  // Exposes file paths, framework internals
```

**Risk:** Information leakage to attackers

---

### HIGH-4: Debug Mode Always Enabled

**Location:** `src/utils/debug.ts:4-6`

```typescript
const isDev = true;  // Hardcoded! Should use import.meta.env.DEV
```

---

## 4. Input Validation Analysis

### Strengths

| Validation | Location | Pattern |
|------------|----------|---------|
| SSN Format | `validation.ts:45` | `/^\d{3}-\d{2}-\d{4}$/` |
| EIN Format | `validation.ts:52` | `/^\d{2}-\d{7}$/` |
| Phone | `validation.ts:38` | 10-digit normalization |
| ZIP Code | `validation.ts:31` | 5 or 9 digit |
| Currency | `validation.ts:89` | Range + decimal limits |

### Critical Strength: Safe Expression Parser

**Location:** `src/utils/expressionParser.ts`

```typescript
// Uses Shunting-Yard algorithm instead of eval()
// Whitelist validation: /^[0-9+\-*/().]+$/
// Prevents arbitrary code execution
```

**Assessment:** Excellent security practice - no `eval()` or `Function()` constructor

### Weaknesses

| Issue | Location | Risk |
|-------|----------|------|
| Multiple decimal points | `validation.ts:177` | Calculation errors |
| No content length limits | TextArea components | DoS via unbounded input |
| Division by zero returns 0 | `expressionParser.ts:94` | Silent failures |

---

## 5. Data Protection Assessment

### PII Inventory

| Data Element | Classification | Current Protection | Required |
|--------------|----------------|-------------------|----------|
| SSN/EIN | **Critical** | Display masking only | Tokenization + encryption |
| Credit Score | **High** | None | Encryption at rest |
| DOB | **High** | None | Encryption |
| Address | **Medium** | None | Access controls |
| Phone | **Medium** | None | Access controls |
| Loan Balances | **High** | None | Audit logging |

### Compliance Gap Analysis

| Requirement | GLBA | SOC2 | Current State |
|-------------|------|------|---------------|
| PII Encryption | Required | Required | **Not Implemented** |
| Access Controls | Required | Required | **Partial (Auth only)** |
| Audit Logging | Required | Required | **Not Implemented** |
| Session Management | Required | Required | **Partial** |
| Data Retention | Required | Required | **Not Implemented** |

---

## 6. API Security Analysis

### Current State (Mock API)

| Control | Status | Risk |
|---------|--------|------|
| Authentication | None | Critical in production |
| Authorization | None | All users equal access |
| Rate Limiting | None | DoS vulnerability |
| Input Validation | Client-side only | Bypassable |
| Error Handling | Generic messages | Good practice |
| CORS | Not configured | Requires backend config |

### Production API Requirements

```typescript
// Required middleware stack for production
app.use(helmet());              // Security headers
app.use(rateLimit({ max: 100 })); // Rate limiting
app.use(cors({ origin: whitelist })); // CORS
app.use(authenticate);          // JWT/OAuth validation
app.use(authorize);             // RBAC enforcement
app.use(auditLog);              // Action logging
app.use(piiFilter);             // Response sanitization
```

---

## 7. Client-Side Security

### React State Security Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Memory                            │
├─────────────────────────────────────────────────────────────┤
│  React Context (LoanContext)                                 │
│  ├── loans[] ─────────────────── Contains principal/rates   │
│  ├── borrowersList[] ─────────── Contains SSN, DOB, scores  │
│  ├── collateralList[] ────────── Contains property values   │
│  └── paymentRecords[] ────────── Contains payment history   │
│                                                              │
│  React Query Cache                                           │
│  ├── ['loans'] ───────────────── Cached loan data           │
│  ├── ['borrowers'] ───────────── Cached PII                 │
│  └── ['payments'] ────────────── Cached financials          │
│                                                              │
│  ⚠️ All accessible via DevTools                              │
│  ⚠️ No encryption                                            │
│  ⚠️ Persists after component unmount                         │
└─────────────────────────────────────────────────────────────┘
```

### Electron Security Considerations

| Setting | Recommended | Current |
|---------|-------------|---------|
| `nodeIntegration` | `false` | Unknown |
| `contextIsolation` | `true` | Unknown |
| `webSecurity` | `true` | Unknown |
| `preload` validation | Required | Not verified |

---

## 8. Security Remediation Roadmap

### Phase 1: Critical (Before Any Production Use)

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Add MSAL dependencies | P0 | 1 hour | Auth works |
| Fix auth env fallbacks | P0 | 2 hours | Prevent bypass |
| Remove auth from tsconfig exclude | P0 | 1 hour | Type safety |
| Implement PII tokenization | P0 | 2 weeks | Compliance |
| Add session cleanup on logout | P0 | 4 hours | Data protection |

### Phase 2: High Priority (Before Beta)

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Implement RBAC from Azure AD tokens | P1 | 1 week | Access control |
| Add audit logging | P1 | 1 week | Compliance |
| Fix debug mode flag | P1 | 1 hour | Info leakage |
| Hide error stacks in production | P1 | 2 hours | Info leakage |
| Add input length limits | P1 | 4 hours | DoS prevention |

### Phase 3: Medium Priority (Before GA)

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Implement CSP headers | P2 | 4 hours | XSS prevention |
| Add rate limiting (backend) | P2 | 1 week | DoS prevention |
| Configure CORS properly | P2 | 4 hours | Origin control |
| Add session timeout | P2 | 8 hours | Session security |
| Implement cache-control headers | P2 | 4 hours | Data caching |

---

# Part V: Development Roadmap

## Current State Assessment

| Area | Completion | Quality |
|------|------------|---------|
| Core UI Components | 95% | High |
| State Management | 90% | High |
| Financial Calculations | 95% | Verified |
| Data Persistence | 70% | Mock only |
| Authentication | 40% | Deferred |
| Testing | 80% | 126 async failures |
| Security | 30% | Needs hardening |
| Documentation | 40% | Partial |

---

## Development Phases

### Phase 5: Fix Async Test Handling (Current)
**Status:** Plan created, ready to implement
**Effort:** 1-2 days
**Scope:**
- Add async test helpers to `test-utils.tsx`
- Convert 126 failing tests to async patterns
- Verify all 628 tests pass

**Files:** 7 test files + test-utils.tsx

---

### Phase 6: Security Hardening
**Effort:** 2-3 weeks
**Dependencies:** None

| Task | Description | Files |
|------|-------------|-------|
| 6.1 | Add MSAL dependencies | `package.json` |
| 6.2 | Fix auth configuration | `authConfig.ts`, `tsconfig.json` |
| 6.3 | Implement RBAC | `AuthContext.tsx`, new `rbac.ts` |
| 6.4 | Add session cleanup | `AuthContext.tsx` |
| 6.5 | Fix debug exposure | `debug.ts`, `ErrorBoundary.tsx` |
| 6.6 | Add input validation limits | UI components |
| 6.7 | Implement audit logging | New `auditLog.ts` |

---

### Phase 7: Backend API Integration
**Effort:** 4-6 weeks
**Dependencies:** Phase 6

| Task | Description | Priority |
|------|-------------|----------|
| 7.1 | Design REST API schema | P0 |
| 7.2 | Implement loan CRUD endpoints | P0 |
| 7.3 | Implement borrower endpoints | P0 |
| 7.4 | Implement collateral endpoints | P0 |
| 7.5 | Implement payment endpoints | P0 |
| 7.6 | Implement projection settings persistence | P1 |
| 7.7 | Add API authentication middleware | P0 |
| 7.8 | Add rate limiting | P1 |
| 7.9 | Add audit logging | P1 |

**Technology Options:**
- Node.js/Express + PostgreSQL (recommended)
- .NET Core + SQL Server
- Python/FastAPI + PostgreSQL

---

### Phase 8: Data Import/Export
**Effort:** 2-3 weeks
**Dependencies:** Phase 7

| Task | Description |
|------|-------------|
| 8.1 | Excel import for loan tape |
| 8.2 | CSV export for projections |
| 8.3 | PDF report generation |
| 8.4 | Batch projection refresh (user request) |
| 8.5 | Data validation on import |

---

### Phase 9: Portfolio Analytics
**Effort:** 3-4 weeks
**Dependencies:** Phase 7

| Feature | Description |
|---------|-------------|
| 9.1 | Aggregate LTV calculation |
| 9.2 | Concentration risk metrics |
| 9.3 | Portfolio performance dashboard |
| 9.4 | Cohort analysis |
| 9.5 | Stress testing scenarios |

---

### Phase 10: Advanced Financial Modeling
**Effort:** 4-6 weeks
**Dependencies:** Phase 9

| Feature | Description |
|---------|-------------|
| 10.1 | Daily interest accrual option |
| 10.2 | Floating rate index modeling (SOFR/Prime) |
| 10.3 | Prepayment speed assumptions (CPR/PSA) |
| 10.4 | Probability-weighted exit scenarios |
| 10.5 | Loss severity curves |
| 10.6 | IRR/NPV calculations |

---

### Phase 11: Microsoft SSO Production Integration
**Effort:** 1-2 weeks
**Dependencies:** Phase 6

| Task | Description |
|------|-------------|
| 11.1 | Azure AD App Registration |
| 11.2 | Configure redirect URIs |
| 11.3 | Set up user/group assignments |
| 11.4 | Configure token claims for RBAC |
| 11.5 | Test SSO flow end-to-end |

---

### Phase 12: Electron Desktop Hardening
**Effort:** 1-2 weeks
**Dependencies:** Phase 6

| Task | Description |
|------|-------------|
| 12.1 | Verify preload script security |
| 12.2 | Configure webPreferences |
| 12.3 | Implement IPC validation |
| 12.4 | Code signing setup |
| 12.5 | Auto-update mechanism |

---

## Recommended Implementation Order

```
Phase 5 (Tests) ──────────────────────────────────────┐
                                                       │
Phase 6 (Security) ───────────────────────────────────┼──► Beta Release
                                                       │
Phase 11 (SSO) ───────────────────────────────────────┘
        │
        ▼
Phase 7 (Backend API) ────────────────────────────────┐
                                                       │
Phase 8 (Import/Export) ──────────────────────────────┼──► v1.0 Release
                                                       │
Phase 12 (Electron) ──────────────────────────────────┘
        │
        ▼
Phase 9 (Portfolio Analytics) ────────────────────────┐
                                                       ├──► v2.0 Release
Phase 10 (Advanced Modeling) ─────────────────────────┘
```

---

## Resource Requirements

### Development Team

| Role | Count | Phases |
|------|-------|--------|
| Frontend Developer | 1-2 | 5, 6, 8, 9 |
| Backend Developer | 1-2 | 7, 8 |
| Security Engineer | 0.5 | 6, 11, 12 |
| QA Engineer | 1 | All phases |
| DevOps | 0.5 | 7, 11, 12 |

### Technology Stack (Recommended)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React + TypeScript | Already implemented |
| State | React Query + Context | Already implemented |
| Backend | Node.js + Express | JavaScript ecosystem consistency |
| Database | PostgreSQL | ACID compliance, JSON support |
| Auth | Azure AD + MSAL | Enterprise SSO requirement |
| Desktop | Electron | Already configured |
| CI/CD | GitHub Actions | Standard tooling |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| PII data breach | Medium | Critical | Phase 6 security hardening |
| SSO integration issues | Medium | High | Early Phase 11 start |
| Backend API delays | Medium | High | Parallel development |
| Test suite instability | Low | Medium | Phase 5 completion |
| Electron security gaps | Medium | High | Phase 12 audit |

---

## Success Metrics

### Phase 5 Success
- [ ] 628/628 tests passing
- [ ] 0 async-related failures
- [ ] Test execution < 60 seconds

### Phase 6 Success
- [ ] All CRITICAL findings resolved
- [ ] All HIGH findings resolved
- [ ] MSAL integration working
- [ ] RBAC enforced

### Phase 7 Success
- [ ] All CRUD operations functional
- [ ] API response times < 200ms
- [ ] 100% test coverage on endpoints

### Production Readiness
- [ ] SOC2 audit passed
- [ ] Penetration test passed
- [ ] GLBA compliance verified
- [ ] User acceptance testing complete

---

## Appendix: File Change Summary by Phase

### Phase 5 Files
```
src/test/test-utils.tsx
src/components/tabs/ProjectionsTab.test.tsx
src/components/tabs/LoanTab.test.tsx
src/components/tabs/BorrowerTab.test.tsx
src/components/tabs/CollateralTab.test.tsx
src/components/tabs/CommentTab.test.tsx
src/components/tabs/PayHistTab.test.tsx
src/context/LoanContext.test.tsx
```

### Phase 6 Files
```
package.json (add MSAL)
tsconfig.json (remove auth exclude)
src/auth/authConfig.ts (fix fallbacks)
src/auth/AuthContext.tsx (RBAC, cleanup)
src/utils/debug.ts (fix isDev)
src/components/ErrorBoundary.tsx (hide stacks)
src/utils/auditLog.ts (new)
src/utils/piiProtection.ts (new)
```

### Phase 7 Files (New)
```
server/
├── src/
│   ├── routes/
│   │   ├── loans.ts
│   │   ├── borrowers.ts
│   │   ├── collateral.ts
│   │   ├── payments.ts
│   │   └── projections.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   ├── rateLimit.ts
│   │   └── auditLog.ts
│   ├── models/
│   └── services/
└── package.json
```

---

**Document Prepared By:** Claude Code Analysis
**Review Required By:** Security Team, Development Lead, Compliance Officer
