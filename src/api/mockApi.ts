// Mock API - Returns same data as current Context
// This simulates API calls without needing a backend
// When backend is ready, we'll replace this with real API calls

import type {
  Loan,
  Borrower,
  Collateral,
  Comment,
  PaymentRecord,
  CollateralLoanRelationships,
  LoanRelationship
} from '../types';
import {
  initialLoans,
  initialBorrowers,
  initialCollateral,
  initialCollateralLoanRelationships,
  initialComments,
  initialPaymentRecords
} from '../data';

// Simulate network delay (50-200ms like real API)
const mockDelay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));

// In-memory storage (simulates database)
// When you have a real backend, this will be in PostgreSQL
let mockLoans: Loan[] = [...initialLoans];
let mockBorrowers: Borrower[] = [...initialBorrowers];
let mockCollateral: Collateral[] = [...initialCollateral];
let mockComments: Comment[] = [...initialComments];
let mockPayments: PaymentRecord[] = [...initialPaymentRecords];
let mockCollateralRelationships: CollateralLoanRelationships = { ...initialCollateralLoanRelationships };
let mockBorrowerRelationships: Record<number, Record<string, LoanRelationship>> = {};

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

  // Get single collateral
  getById: async (id: number): Promise<Collateral | undefined> => {
    await mockDelay();
    return mockCollateral.find(c => c.id === id);
  },

  // Add collateral
  create: async (collateral: Collateral): Promise<Collateral> => {
    await mockDelay();
    mockCollateral = [...mockCollateral, collateral];
    return collateral;
  },

  // Update collateral
  update: async (id: number, updates: Partial<Collateral>): Promise<Collateral> => {
    await mockDelay();
    mockCollateral = mockCollateral.map(c =>
      c.id === id ? { ...c, ...updates } : c
    );
    const updated = mockCollateral.find(c => c.id === id);
    if (!updated) throw new Error('Collateral not found');
    return updated;
  },

  // Delete collateral
  delete: async (id: number): Promise<void> => {
    await mockDelay();
    mockCollateral = mockCollateral.filter(c => c.id !== id);
    delete mockCollateralRelationships[id];
  },

  // Get relationships
  getRelationships: async (): Promise<CollateralLoanRelationships> => {
    await mockDelay();
    return { ...mockCollateralRelationships };
  },

  // Update relationships
  updateRelationships: async (relationships: CollateralLoanRelationships): Promise<void> => {
    await mockDelay();
    mockCollateralRelationships = { ...relationships };
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

export const mockPaymentApi = {
  // Get all payments
  getAll: async (): Promise<PaymentRecord[]> => {
    await mockDelay();
    return [...mockPayments];
  },

  // Get payments for a loan
  getByLoan: async (mwLoanNo: string): Promise<PaymentRecord[]> => {
    await mockDelay();
    return mockPayments.filter(payment => payment.loanNo === mwLoanNo);
  },

  // Add payment
  create: async (payment: PaymentRecord): Promise<PaymentRecord> => {
    await mockDelay();
    mockPayments = [...mockPayments, payment];
    return payment;
  },

  // Update payment
  update: async (id: number, updates: Partial<PaymentRecord>): Promise<PaymentRecord> => {
    await mockDelay();
    mockPayments = mockPayments.map(payment =>
      payment.id === id ? { ...payment, ...updates } : payment
    );
    const updated = mockPayments.find(p => p.id === id);
    if (!updated) throw new Error('Payment not found');
    return updated;
  },

  // Delete payment
  delete: async (id: number): Promise<void> => {
    await mockDelay();
    mockPayments = mockPayments.filter(payment => payment.id !== id);
  }
};

// ==================== RESET (for testing) ====================

export const resetMockData = () => {
  mockLoans = [...initialLoans];
  mockBorrowers = [...initialBorrowers];
  mockCollateral = [...initialCollateral];
  mockComments = [...initialComments];
  mockPayments = [...initialPaymentRecords];
  mockCollateralRelationships = { ...initialCollateralLoanRelationships };
  mockBorrowerRelationships = {};
  initialBorrowers.forEach(borrower => {
    if (borrower.loanRelationships) {
      mockBorrowerRelationships[borrower.id] = { ...borrower.loanRelationships };
    }
  });
};
