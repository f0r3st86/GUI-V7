# GUI-V7 Loan Portfolio Management System
## Development Roadmap

**Created:** December 22, 2025
**Target:** Production-Ready System

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Dashboard │ │  Loans   │ │ Reports  │ │   Maps   │           │
│  │ (Gantt)  │ │  Tabs    │ │ HTML/PDF │ │ Leaflet  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │ API
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node/Express)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Auth   │ │  Excel   │ │  Photos  │ │ Reports  │           │
│  │   API    │ │  Import  │ │ Storage  │ │   Gen    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │ SQL
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                       │
│  Projects │ Loans │ Borrowers │ Collateral │ Counties │ Photos │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Dec 22-31, 2025)
### Goal: Database + Basic Backend + Excel Import

#### 1.1 Database Schema Design
- [ ] Projects table (id, name, status, bid_date, close_date, created_at)
- [ ] Loans table (all current loan fields + project_id FK)
- [ ] Borrowers table (+ loan relationship)
- [ ] Collateral table (+ loan relationship, lat/lng for maps)
- [ ] Payment_History table (loan_id, year, month, amount)
- [ ] Comments table (loan_id, type, content, created_at)
- [ ] Counties table (name, state, assessor_url, tax_search_url, gis_url, delinquent_tax_url, recorder_url, phone)
- [ ] Photos table (id, loan_id, collateral_id, type, url, source, created_at)
- [ ] Users table (id, email, name, role)

#### 1.2 Backend API Setup
- [ ] Express.js server setup
- [ ] Database connection (pg or Prisma)
- [ ] Basic CRUD endpoints for all tables
- [ ] Authentication middleware (JWT)

#### 1.3 Excel Import Pipeline
- [ ] Excel parser (xlsx library)
- [ ] Column mapping configuration
- [ ] Validation rules
- [ ] Import API endpoint
- [ ] Error handling & reporting

#### 1.4 Connect Frontend to Backend
- [ ] Replace mock API with real API calls
- [ ] Environment configuration (dev/prod)
- [ ] Error handling

---

## Phase 2: Project Dashboard (Jan 1-15, 2026)
### Goal: Main Menu with Gantt Chart

#### 2.1 Project Management
- [ ] Create new project UI
- [ ] Project list view
- [ ] Project status tracking (Pipeline, Due Diligence, Bidding, Closed, Lost)

#### 2.2 Gantt Chart Dashboard
- [ ] Timeline visualization library (react-gantt-chart or similar)
- [ ] Project timeline display
- [ ] Milestone markers (bid date, close date)
- [ ] Filter by status
- [ ] Click to open project

#### 2.3 Project-Loan Association
- [ ] Associate loans with projects
- [ ] Bulk operations (move loans between projects)

---

## Phase 3: Reports (Jan 16-31, 2026)
### Goal: HTML & PDF Report Generation

#### 3.1 Report Templates
- [ ] Loan Summary Report (single loan)
- [ ] Portfolio Summary Report (all loans in project)
- [ ] Bid Analysis Report (projections + scenarios)
- [ ] Collateral Report (with photos and maps)

#### 3.2 HTML Reports
- [ ] React components for report views
- [ ] Print-friendly CSS
- [ ] Export to HTML file

#### 3.3 PDF Generation
- [ ] PDF library integration (puppeteer or react-pdf)
- [ ] Template rendering
- [ ] Download functionality
- [ ] Batch PDF generation

---

## Phase 4: Maps & Photos (Feb 1-15, 2026)
### Goal: Location Mapping + Photo Management

#### 4.1 Collateral Mapping
- [ ] Leaflet map integration (already have basics)
- [ ] Geocoding addresses to lat/lng
- [ ] Collateral markers on map
- [ ] Cluster view for multiple properties

#### 4.2 Comparable Sales Mapping
- [ ] Comp data entry
- [ ] Comps displayed on map with collateral
- [ ] Distance calculation

#### 4.3 Photo Management
- [ ] Photo upload UI
- [ ] Photo storage (S3 or local)
- [ ] Photo gallery view
- [ ] Associate photos with loans/collateral

#### 4.4 Google Street View Integration
- [ ] Street View API integration
- [ ] Capture street view from address
- [ ] Store captured images

---

## Phase 5: County Reference System (Feb 16-28, 2026)
### Goal: County/Town Tax Information Database

#### 5.1 County Database
- [ ] County CRUD operations
- [ ] State/county hierarchy
- [ ] Search by state, county name

#### 5.2 County Information Fields
- [ ] Assessor website URL
- [ ] Property tax search URL
- [ ] GIS/mapping URL
- [ ] Delinquent property tax URL
- [ ] Deed/county recorder URL
- [ ] Contact phone numbers
- [ ] Notes field

#### 5.3 Collateral-County Linking
- [ ] Auto-detect county from address
- [ ] Quick access to county links from collateral view
- [ ] "Open in new tab" functionality

---

## Phase 6: Polish & Production (Mar 1-15, 2026)
### Goal: Production Deployment

#### 6.1 Testing
- [ ] Fix existing test failures
- [ ] Add integration tests
- [ ] API endpoint tests
- [ ] E2E tests for critical paths

#### 6.2 Security
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Rate limiting
- [ ] Audit logging

#### 6.3 Deployment
- [ ] Production build optimization
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Monitoring & logging
- [ ] Backup strategy

#### 6.4 Documentation
- [ ] User guide
- [ ] Admin guide
- [ ] API documentation
- [ ] Database schema documentation

---

## Database Schema (Draft)

```sql
-- Projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    seller VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Pipeline',
    bid_date DATE,
    close_date DATE,
    loan_count INTEGER DEFAULT 0,
    total_upb DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loans
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    loan_number VARCHAR(100),
    relationship_name VARCHAR(255),

    -- Balances
    upb DECIMAL(15,2),
    principal_balance DECIMAL(15,2),
    interest_balance DECIMAL(15,2),
    escrow_balance DECIMAL(15,2),
    corporate_advance DECIMAL(15,2),

    -- Rates & Terms
    interest_rate DECIMAL(5,3),
    payment_amount DECIMAL(12,2),
    original_loan_amount DECIMAL(15,2),
    origination_date DATE,
    maturity_date DATE,

    -- Property Address
    property_address VARCHAR(255),
    property_city VARCHAR(100),
    property_state VARCHAR(2),
    property_zip VARCHAR(10),

    -- Status
    loan_status VARCHAR(50),
    payment_status VARCHAR(50),

    -- Calculated fields stored for performance
    months_to_maturity INTEGER,
    months_to_amortization INTEGER,
    interest_accrued_months DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Borrowers
CREATE TABLE borrowers (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(id),
    borrower_type VARCHAR(20), -- 'Primary', 'Co-Borrower', 'Guarantor'
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    entity_name VARCHAR(255),
    ssn_ein VARCHAR(20), -- Encrypted
    credit_score INTEGER,
    bankruptcy_flag BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    email VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collateral
CREATE TABLE collateral (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(id),
    property_type VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    county VARCHAR(100),

    -- Values
    appraised_value DECIMAL(15,2),
    appraised_date DATE,
    bpo_value DECIMAL(15,2),
    bpo_date DATE,
    tax_assessed_value DECIMAL(15,2),

    -- Property Details
    square_feet INTEGER,
    lot_size DECIMAL(10,2),
    lot_size_unit VARCHAR(20), -- 'SF', 'Acres'
    year_built INTEGER,
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    units INTEGER,

    -- Lien Info
    lien_position INTEGER,
    lien_amount DECIMAL(15,2),

    -- Geolocation
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment History
CREATE TABLE payment_history (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    amount DECIMAL(12,2) DEFAULT 0,
    payment_type VARCHAR(50), -- 'Regular', 'Partial', 'NSF', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(loan_id, year, month)
);

-- Comments
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(id),
    comment_type VARCHAR(50), -- 'Note', 'Legal', 'Underwriting', etc.
    content TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Counties
CREATE TABLE counties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    assessor_url VARCHAR(500),
    tax_search_url VARCHAR(500),
    gis_url VARCHAR(500),
    delinquent_tax_url VARCHAR(500),
    recorder_url VARCHAR(500),
    phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, state)
);

-- Photos
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(id),
    collateral_id INTEGER REFERENCES collateral(id),
    photo_type VARCHAR(50), -- 'Exterior', 'Interior', 'StreetView', 'Document'
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    source VARCHAR(50), -- 'Upload', 'StreetView', 'Import'
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'Analyst', -- 'Admin', 'Manager', 'Analyst', 'Viewer'
    password_hash VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projections (store saved scenarios)
CREATE TABLE projections (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(id),
    scenario_name VARCHAR(100),
    exit_method VARCHAR(50),
    exit_month INTEGER,
    payment_method VARCHAR(50),
    payment_value DECIMAL(12,2),
    rate_method VARCHAR(50),
    rate_value DECIMAL(5,3),
    expenses JSONB, -- Store expense assumptions as JSON
    bid_price DECIMAL(15,2),
    moic DECIMAL(5,2),
    ytm DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_loans_project ON loans(project_id);
CREATE INDEX idx_borrowers_loan ON borrowers(loan_id);
CREATE INDEX idx_collateral_loan ON collateral(loan_id);
CREATE INDEX idx_payment_history_loan ON payment_history(loan_id);
CREATE INDEX idx_comments_loan ON comments(loan_id);
CREATE INDEX idx_photos_loan ON photos(loan_id);
CREATE INDEX idx_counties_state ON counties(state);
```

---

## Technology Stack

### Frontend (Current)
- React 18 + TypeScript
- TailwindCSS
- React Query
- Leaflet (maps)
- Vite (build)

### Backend (To Build)
- Node.js + Express
- PostgreSQL
- Prisma ORM (or raw pg)
- JWT authentication
- Multer (file uploads)
- xlsx (Excel parsing)
- Puppeteer (PDF generation)

### Infrastructure
- Docker containers
- Nginx reverse proxy
- PostgreSQL database
- S3-compatible storage (photos)

---

## End of Year (Dec 31) Deliverables

### Minimum Viable:
1. ✅ Database schema created and running
2. ✅ Basic API endpoints (CRUD for all tables)
3. ✅ Excel import working (basic)
4. ✅ Frontend connected to real database
5. ✅ Single-user authentication

### Stretch Goals:
- Project dashboard UI
- Basic HTML report
- County reference CRUD

---

## Daily Plan: Dec 22-31

### Dec 22-23 (Weekend)
- [ ] Finalize this roadmap
- [ ] Set up PostgreSQL database
- [ ] Create all tables from schema
- [ ] Set up Express backend project

### Dec 24-25 (Holiday)
- [ ] Build basic API routes
- [ ] Test CRUD operations
- [ ] Connect frontend to backend

### Dec 26-27
- [ ] Excel import pipeline
- [ ] Column mapping logic
- [ ] Import validation

### Dec 28-29
- [ ] Authentication (JWT)
- [ ] User management
- [ ] Environment configs

### Dec 30-31
- [ ] Integration testing
- [ ] Bug fixes
- [ ] Documentation
- [ ] Deployment prep

---

## Notes

- User will provide SQL templates to reference
- Priority is getting data flowing from Excel → Database → UI
- Reports and maps can wait for Phase 3-4
- Focus on solid foundation first
