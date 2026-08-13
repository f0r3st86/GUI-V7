// Mock API - Returns same data as current Context
// This simulates API calls without needing a backend
// When backend is ready, we'll replace this with real API calls

import type {
  Loan,
  Borrower,
  Collateral,
  Comment,
  PaymentRecord,
  LoanRelationship,
  ProjectionSettings,
  ExitSettings,
  Relationship
} from '../types';
import {
  initialLoans,
  initialBorrowers,
  initialCollateral,
  initialComments,
  initialPaymentRecords,
  initialRelationships
} from '../data';
import { MOCK_DELAY_MIN, MOCK_DELAY_MAX } from '../data/constants';

// Simulate network delay (50-200ms like real API)
const mockDelay = () => new Promise(resolve =>
  setTimeout(resolve, Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN) + MOCK_DELAY_MIN)
);

// Fast/no delay for frequently-updated data (payments during typing)
const noDelay = () => Promise.resolve();

// In-memory storage (simulates database)
// When you have a real backend, this will be in PostgreSQL
let mockLoans: Loan[] = [...initialLoans];
let mockRelationships: Relationship[] = [...initialRelationships];
let mockBorrowers: Borrower[] = [...initialBorrowers];
let mockCollateral: Collateral[] = [...initialCollateral];
let mockComments: Comment[] = [...initialComments];
let mockPayments: PaymentRecord[] = [...initialPaymentRecords];
let mockBorrowerRelationships: Record<number, Record<string, LoanRelationship>> = {};

// Projection and Exit settings storage (per loan)
let mockProjectionSettings: Record<string, ProjectionSettings> = {};
let mockExitSettings: Record<string, ExitSettings> = {};

// Default settings (matching context defaults)
const defaultProjectionSettings: ProjectionSettings = {
  paymentMethod: 'Contractual',
  rateMethod: 'Contractual',
  userPayment: '',
  userRate: '',
  amortMonths: '360',
  trailPeriod: '12',
  trailPercentage: '100',
  initialLegal: '',
  initialLegalStartMonth: '1',
  holdingCosts: '',
  holdingCostsEndMonth: '12',
  addBackPercentage: '0',
  addBackBasis: 'Initial Only'
};

const defaultExitSettings: ExitSettings = {
  method: 'Pay in Full',
  startMonth: '1',
  endMonth: '24',
  dpoPercentage: '95',
  valueCapPercentage: '90',
  userEnterAmount: '',
  ytmDesired: '12',
  liquidationMonths: '12',
  liquidationAddInterest: false
};

// Initialize borrower relationships from initial data
initialBorrowers.forEach(borrower => {
  if (borrower.loanRelationships) {
    mockBorrowerRelationships[borrower.id] = { ...borrower.loanRelationships };
  }
});

// ==================== LOAN API ====================

export const mockLoanApi = {
  // Get all loans
  getAll: async (): Promise<Loan[]> => {
    await mockDelay();
    return [...mockLoans];
  },

  // Get single loan
  getById: async (mwLoanNo: string): Promise<Loan | undefined> => {
    await mockDelay();
    return mockLoans.find(loan => loan.mwLoanNo === mwLoanNo);
  },

  // Add loan
  create: async (loan: Loan): Promise<Loan> => {
    await mockDelay();
    mockLoans = [...mockLoans, loan];
    return loan;
  },

  // Update loan
  update: async (mwLoanNo: string, updates: Partial<Loan>): Promise<Loan> => {
    await mockDelay();
    mockLoans = mockLoans.map(loan =>
      loan.mwLoanNo === mwLoanNo ? { ...loan, ...updates } : loan
    );
    const updatedLoan = mockLoans.find(loan => loan.mwLoanNo === mwLoanNo);
    if (!updatedLoan) throw new Error('Loan not found');
    return updatedLoan;
  },

  // Delete loan
  delete: async (mwLoanNo: string): Promise<void> => {
    await mockDelay();
    mockLoans = mockLoans.filter(loan => loan.mwLoanNo !== mwLoanNo);
  }
};

// ==================== RELATIONSHIP API ====================
// Mirrors production tblRelationships. Keyed by relatedLoans (natural PK).
// sortNo and rowguid are server-owned: update() strips them from writes.

export const mockRelationshipApi = {
  getAll: async (): Promise<Relationship[]> => {
    await mockDelay();
    return [...mockRelationships];
  },

  getByKey: async (relatedLoans: string): Promise<Relationship | undefined> => {
    await mockDelay();
    return mockRelationships.find(r => r.relatedLoans === relatedLoans);
  },

  update: async (relatedLoans: string, updates: Partial<Relationship>): Promise<Relationship> => {
    await mockDelay();
    // Server-owned fields: silently strip (a real API would 400 or ignore)
    const { sortNo: _sortNo, rowguid: _rowguid, relatedLoans: _key, ...writable } = updates;
    mockRelationships = mockRelationships.map(r =>
      r.relatedLoans === relatedLoans ? { ...r, ...writable } : r
    );
    const updated = mockRelationships.find(r => r.relatedLoans === relatedLoans);
    if (!updated) throw new Error('Relationship not found');
    return updated;
  },

  // Program action: recompute sortNo per project by aggregate principal
  // UPB rank, largest = 1 (author-confirmed rule, see UI-DATA-BINDINGS.md)
  recomputeSortOrder: async (): Promise<Relationship[]> => {
    await mockDelay();
    const upbByRel = new Map<string, number>();
    mockLoans.forEach(l => {
      upbByRel.set(l.relatedLoans, (upbByRel.get(l.relatedLoans) || 0) + (l.principal || 0));
    });
    const byProject = new Map<string, Relationship[]>();
    mockRelationships.forEach(r => {
      if (!byProject.has(r.projectName)) byProject.set(r.projectName, []);
      byProject.get(r.projectName)!.push(r);
    });
    const newSort = new Map<string, number>();
    byProject.forEach(rels => {
      [...rels]
        .sort((a, b) => (upbByRel.get(b.relatedLoans) || 0) - (upbByRel.get(a.relatedLoans) || 0))
        .forEach((r, i) => newSort.set(r.relatedLoans, i + 1));
    });
    mockRelationships = mockRelationships.map(r => ({
      ...r,
      sortNo: newSort.get(r.relatedLoans) ?? r.sortNo
    }));
    return [...mockRelationships];
  }
};

// ==================== BORROWER API ====================

export const mockBorrowerApi = {
  // Get all borrowers
  getAll: async (): Promise<Borrower[]> => {
    await mockDelay();
    return mockBorrowers.map(borrower => ({
      ...borrower,
      loanRelationships: mockBorrowerRelationships[borrower.id] || {}
    }));
  },

  // Get single borrower
  getById: async (id: number): Promise<Borrower | undefined> => {
    await mockDelay();
    const borrower = mockBorrowers.find(b => b.id === id);
    if (!borrower) return undefined;
    return {
      ...borrower,
      loanRelationships: mockBorrowerRelationships[borrower.id] || {}
    };
  },

  // Add borrower
  create: async (borrower: Borrower): Promise<Borrower> => {
    await mockDelay();
    mockBorrowers = [...mockBorrowers, borrower];
    mockBorrowerRelationships[borrower.id] = borrower.loanRelationships || {};
    return borrower;
  },

  // Update borrower
  update: async (id: number, updates: Partial<Borrower>): Promise<Borrower> => {
    await mockDelay();
    mockBorrowers = mockBorrowers.map(borrower =>
      borrower.id === id ? { ...borrower, ...updates } : borrower
    );
    if (updates.loanRelationships) {
      mockBorrowerRelationships[id] = updates.loanRelationships;
    }
    const updated = mockBorrowers.find(b => b.id === id);
    if (!updated) throw new Error('Borrower not found');
    return {
      ...updated,
      loanRelationships: mockBorrowerRelationships[id] || {}
    };
  },

  // Delete borrower
  delete: async (id: number): Promise<void> => {
    await mockDelay();
    mockBorrowers = mockBorrowers.filter(borrower => borrower.id !== id);
    delete mockBorrowerRelationships[id];
  },

  // Update loan relationships
  updateRelationships: async (id: number, relationships: Record<string, LoanRelationship>): Promise<void> => {
    await mockDelay();
    mockBorrowerRelationships[id] = relationships;
  }
};

// ==================== COLLATERAL API ====================

export const mockCollateralApi = {
  // Get all collateral
  getAll: async (): Promise<Collateral[]> => {
    await mockDelay();
    return [...mockCollateral];
  },

  // Get single collateral by production key
  getById: async (mwPropertyNo: number): Promise<Collateral | undefined> => {
    await mockDelay();
    return mockCollateral.find(c => c.mwPropertyNo === mwPropertyNo);
  },

  // Add collateral — server assigns mwPropertyNo (mock mints next int)
  create: async (collateral: Omit<Collateral, 'mwPropertyNo'> & { mwPropertyNo?: number }): Promise<Collateral> => {
    await mockDelay();
    const nextKey = collateral.mwPropertyNo ??
      Math.max(400000, ...mockCollateral.map(c => c.mwPropertyNo)) + 1;
    const created: Collateral = { ...collateral, mwPropertyNo: nextKey };
    mockCollateral = [...mockCollateral, created];
    return created;
  },

  // Update collateral (key is server-owned: strip from writes)
  update: async (mwPropertyNo: number, updates: Partial<Collateral>): Promise<Collateral> => {
    await mockDelay();
    const { mwPropertyNo: _key, ...writable } = updates;
    mockCollateral = mockCollateral.map(c =>
      c.mwPropertyNo === mwPropertyNo ? { ...c, ...writable } : c
    );
    const updated = mockCollateral.find(c => c.mwPropertyNo === mwPropertyNo);
    if (!updated) throw new Error('Collateral not found');
    return updated;
  },

  // Delete collateral
  delete: async (mwPropertyNo: number): Promise<void> => {
    await mockDelay();
    mockCollateral = mockCollateral.filter(c => c.mwPropertyNo !== mwPropertyNo);
  }
};

// ==================== COMMENT API ====================

export const mockCommentApi = {
  // Get all comments
  getAll: async (): Promise<Comment[]> => {
    await mockDelay();
    return [...mockComments];
  },

  // Get comments for a loan
  getByLoan: async (mwLoanNo: string): Promise<Comment[]> => {
    await mockDelay();
    return mockComments.filter(comment => comment.loanNo === mwLoanNo);
  },

  // Add comment
  create: async (comment: Comment): Promise<Comment> => {
    await mockDelay();
    mockComments = [...mockComments, comment];
    return comment;
  },

  // Update comment
  update: async (id: number, updates: Partial<Comment>): Promise<Comment> => {
    await mockDelay();
    mockComments = mockComments.map(comment =>
      comment.id === id ? { ...comment, ...updates } : comment
    );
    const updated = mockComments.find(c => c.id === id);
    if (!updated) throw new Error('Comment not found');
    return updated;
  },

  // Delete comment
  delete: async (id: number): Promise<void> => {
    await mockDelay();
    mockComments = mockComments.filter(comment => comment.id !== id);
  }
};

// ==================== PAYMENT API ====================
// Uses noDelay for instant UI updates during data entry

export const mockPaymentApi = {
  // Get all payments
  getAll: async (): Promise<PaymentRecord[]> => {
    await noDelay();
    return [...mockPayments];
  },

  // Get payments for a loan
  getByLoan: async (mwLoanNo: string): Promise<PaymentRecord[]> => {
    await noDelay();
    return mockPayments.filter(payment => payment.loanNo === mwLoanNo);
  },

  // Add payment
  create: async (payment: PaymentRecord): Promise<PaymentRecord> => {
    await noDelay();
    mockPayments = [...mockPayments, payment];
    return payment;
  },

  // Update payment
  update: async (id: number, updates: Partial<PaymentRecord>): Promise<PaymentRecord> => {
    await noDelay();
    mockPayments = mockPayments.map(payment =>
      payment.id === id ? { ...payment, ...updates } : payment
    );
    const updated = mockPayments.find(p => p.id === id);
    if (!updated) throw new Error('Payment not found');
    return updated;
  },

  // Delete payment
  delete: async (id: number): Promise<void> => {
    await noDelay();
    mockPayments = mockPayments.filter(payment => payment.id !== id);
  }
};

// ==================== PROJECTION SETTINGS API ====================

export const mockProjectionSettingsApi = {
  // Get projection settings for a loan (returns defaults if none saved)
  getByLoan: async (mwLoanNo: string): Promise<ProjectionSettings> => {
    await mockDelay();
    return mockProjectionSettings[mwLoanNo] || { ...defaultProjectionSettings };
  },

  // Save projection settings for a loan
  save: async (mwLoanNo: string, settings: ProjectionSettings): Promise<ProjectionSettings> => {
    await mockDelay();
    mockProjectionSettings[mwLoanNo] = { ...settings };
    return mockProjectionSettings[mwLoanNo];
  },

  // Update a single setting for a loan
  updateSetting: async <K extends keyof ProjectionSettings>(
    mwLoanNo: string,
    key: K,
    value: ProjectionSettings[K]
  ): Promise<ProjectionSettings> => {
    await mockDelay();
    if (!mockProjectionSettings[mwLoanNo]) {
      mockProjectionSettings[mwLoanNo] = { ...defaultProjectionSettings };
    }
    mockProjectionSettings[mwLoanNo] = {
      ...mockProjectionSettings[mwLoanNo],
      [key]: value
    };
    return mockProjectionSettings[mwLoanNo];
  },

  // Reset settings for a loan to defaults
  reset: async (mwLoanNo: string): Promise<ProjectionSettings> => {
    await mockDelay();
    mockProjectionSettings[mwLoanNo] = { ...defaultProjectionSettings };
    return mockProjectionSettings[mwLoanNo];
  }
};

// ==================== EXIT SETTINGS API ====================

export const mockExitSettingsApi = {
  // Get exit settings for a loan (returns defaults if none saved)
  getByLoan: async (mwLoanNo: string): Promise<ExitSettings> => {
    await mockDelay();
    return mockExitSettings[mwLoanNo] || { ...defaultExitSettings };
  },

  // Save exit settings for a loan
  save: async (mwLoanNo: string, settings: ExitSettings): Promise<ExitSettings> => {
    await mockDelay();
    mockExitSettings[mwLoanNo] = { ...settings };
    return mockExitSettings[mwLoanNo];
  },

  // Update a single setting for a loan
  updateSetting: async <K extends keyof ExitSettings>(
    mwLoanNo: string,
    key: K,
    value: ExitSettings[K]
  ): Promise<ExitSettings> => {
    await mockDelay();
    if (!mockExitSettings[mwLoanNo]) {
      mockExitSettings[mwLoanNo] = { ...defaultExitSettings };
    }
    mockExitSettings[mwLoanNo] = {
      ...mockExitSettings[mwLoanNo],
      [key]: value
    };
    return mockExitSettings[mwLoanNo];
  },

  // Reset settings for a loan to defaults
  reset: async (mwLoanNo: string): Promise<ExitSettings> => {
    await mockDelay();
    mockExitSettings[mwLoanNo] = { ...defaultExitSettings };
    return mockExitSettings[mwLoanNo];
  }
};

// ==================== RESET (for testing) ====================

export const resetMockData = () => {
  mockLoans = [...initialLoans];
  mockRelationships = [...initialRelationships];
  mockBorrowers = [...initialBorrowers];
  mockCollateral = [...initialCollateral];
  mockComments = [...initialComments];
  mockPayments = [...initialPaymentRecords];
  mockBorrowerRelationships = {};
  mockProjectionSettings = {};
  mockExitSettings = {};
  initialBorrowers.forEach(borrower => {
    if (borrower.loanRelationships) {
      mockBorrowerRelationships[borrower.id] = { ...borrower.loanRelationships };
    }
  });
};
