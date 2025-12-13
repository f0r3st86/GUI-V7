# Database Schema Design

## Overview
This schema supports 30+ concurrent users managing 2000+ loans with full audit trails and multi-user collaboration.

## Database: PostgreSQL 14+

### Core Tables

#### 1. users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user', -- 'admin', 'user', 'readonly'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### 2. loans
```sql
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  mw_loan_no VARCHAR(50) UNIQUE NOT NULL,
  officer VARCHAR(100),
  branch VARCHAR(100),
  principal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  rate DECIMAL(5, 4),
  maturity_date DATE,
  grade VARCHAR(10),

  -- Audit fields
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1 -- For optimistic locking
);

-- Performance indexes for 2000+ loans
CREATE INDEX idx_loans_mw_loan_no ON loans(mw_loan_no);
CREATE INDEX idx_loans_officer ON loans(officer);
CREATE INDEX idx_loans_branch ON loans(branch);
CREATE INDEX idx_loans_maturity_date ON loans(maturity_date);
CREATE INDEX idx_loans_grade ON loans(grade);
CREATE INDEX idx_loans_created_at ON loans(created_at);

-- Composite index for common queries
CREATE INDEX idx_loans_officer_branch ON loans(officer, branch);
```

#### 3. borrowers
```sql
CREATE TABLE borrowers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- 'individual', 'corporate', etc.
  tax_id VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);

CREATE INDEX idx_borrowers_name ON borrowers(name);
CREATE INDEX idx_borrowers_tax_id ON borrowers(tax_id);
```

#### 4. borrower_loan_relationships
```sql
CREATE TABLE borrower_loan_relationships (
  id SERIAL PRIMARY KEY,
  borrower_id INTEGER NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  selected BOOLEAN DEFAULT false,
  relationship_type VARCHAR(50), -- 'primary', 'co-borrower', 'guarantor'

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(borrower_id, loan_id)
);

CREATE INDEX idx_borrower_loan_borrower ON borrower_loan_relationships(borrower_id);
CREATE INDEX idx_borrower_loan_loan ON borrower_loan_relationships(loan_id);
CREATE INDEX idx_borrower_loan_selected ON borrower_loan_relationships(selected);
```

#### 5. collateral
```sql
CREATE TABLE collateral (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  type VARCHAR(100), -- 'real_estate', 'equipment', 'accounts_receivable', etc.
  appraised_value DECIMAL(15, 2),
  appraisal_date DATE,
  lien_position INTEGER,

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);

CREATE INDEX idx_collateral_type ON collateral(type);
CREATE INDEX idx_collateral_appraisal_date ON collateral(appraisal_date);
```

#### 6. collateral_loan_relationships
```sql
CREATE TABLE collateral_loan_relationships (
  id SERIAL PRIMARY KEY,
  collateral_id INTEGER NOT NULL REFERENCES collateral(id) ON DELETE CASCADE,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  secured_amount DECIMAL(15, 2),

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(collateral_id, loan_id)
);

CREATE INDEX idx_collateral_loan_collateral ON collateral_loan_relationships(collateral_id);
CREATE INDEX idx_collateral_loan_loan ON collateral_loan_relationships(loan_id);
```

#### 7. payment_history
```sql
CREATE TABLE payment_history (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  principal_portion DECIMAL(15, 2),
  interest_portion DECIMAL(15, 2),
  late_fee DECIMAL(15, 2) DEFAULT 0,
  payment_type VARCHAR(50), -- 'regular', 'prepayment', 'late', etc.
  notes TEXT,

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_history_loan ON payment_history(loan_id);
CREATE INDEX idx_payment_history_date ON payment_history(payment_date);

-- Composite index for loan + date queries
CREATE INDEX idx_payment_history_loan_date ON payment_history(loan_id, payment_date);
```

#### 8. comments
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  comment_type VARCHAR(50), -- 'general', 'covenant', 'exception', etc.
  is_alert BOOLEAN DEFAULT false,

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_loan ON comments(loan_id);
CREATE INDEX idx_comments_type ON comments(comment_type);
CREATE INDEX idx_comments_is_alert ON comments(is_alert);
CREATE INDEX idx_comments_created_at ON comments(created_at);
```

#### 9. projections
```sql
CREATE TABLE projections (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'income', 'expenses', 'net_cash_flow'
  subcategory VARCHAR(100) NOT NULL,
  value DECIMAL(15, 2) NOT NULL,

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(loan_id, year, category, subcategory)
);

CREATE INDEX idx_projections_loan ON projections(loan_id);
CREATE INDEX idx_projections_year ON projections(year);
CREATE INDEX idx_projections_category ON projections(category);

-- Composite index for common queries
CREATE INDEX idx_projections_loan_year ON projections(loan_id, year);
```

#### 10. exit_strategies
```sql
CREATE TABLE exit_strategies (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  strategy_type VARCHAR(100) NOT NULL,
  description TEXT,
  probability DECIMAL(5, 2), -- 0.00 to 100.00
  expected_date DATE,
  estimated_value DECIMAL(15, 2),

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exit_strategies_loan ON exit_strategies(loan_id);
CREATE INDEX idx_exit_strategies_type ON exit_strategies(strategy_type);
```

#### 11. audit_log
```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_record ON audit_log(record_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Composite index for table + record queries
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
```

#### 12. sessions
```sql
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

---

## Performance Considerations

### Indexes Strategy
- All foreign keys indexed
- Compound indexes for common query patterns
- Date fields indexed for range queries
- Text fields (names, descriptions) indexed for search

### Estimated Storage (2000 loans)
- loans: ~500KB
- borrowers: ~300KB
- payment_history (10 years avg): ~10MB
- projections: ~5MB
- comments: ~2MB
- audit_log (1 year): ~20MB
- **Total**: ~40MB (easily scales to 10,000+ loans)

### Query Performance Targets
- Loan list (100 rows): <50ms
- Single loan details: <10ms
- Payment history (1 loan): <20ms
- Search across 2000 loans: <100ms

### Optimistic Locking
The `version` field in core tables supports optimistic locking:
```sql
UPDATE loans
SET principal = 100000, version = version + 1, updated_at = CURRENT_TIMESTAMP
WHERE id = 123 AND version = 5;
-- Returns 0 rows if version mismatch (concurrent update)
```

### Triggers for Updated_At
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Repeat for all tables with updated_at
```

---

## Migration Strategy

### Phase 1: Setup
1. Create database and tables
2. Create indexes
3. Create triggers
4. Seed initial admin user

### Phase 2: Data Import
1. Import existing loan data from current state
2. Create default borrower/collateral relationships
3. Verify data integrity

### Phase 3: Testing
1. Test with 2000+ loan dataset
2. Benchmark query performance
3. Load test with 30 concurrent users

---

## Backup Strategy
- Daily full backups
- Point-in-time recovery enabled
- Transaction log backups every 15 minutes
- Retention: 30 days
