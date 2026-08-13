// Mock API Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { mockLoanApi, mockBorrowerApi, resetMockData } from '../mockApi';

describe('Mock API', () => {
  beforeEach(() => {
    resetMockData();
  });

  describe('Loan API', () => {
    it('should get all loans', async () => {
      const loans = await mockLoanApi.getAll();
      expect(loans).toBeDefined();
      expect(loans.length).toBeGreaterThan(0);
      expect(loans[0]).toHaveProperty('mwLoanNo');
      expect(loans[0]).toHaveProperty('principal');
    });

    it('should get loan by ID', async () => {
      const loan = await mockLoanApi.getById('000005100377580');
      expect(loan).toBeDefined();
      expect(loan?.mwLoanNo).toBe('000005100377580');
    });

    it('should create a loan', async () => {
      const allLoansStart = await mockLoanApi.getAll();
      const firstLoan = allLoansStart[0];

      // Create a new loan based on existing structure
      const newLoan = {
        ...firstLoan,
        mwLoanNo: '9999',
        borrowerName: 'Test Borrower',
        principal: 100000,
        interest: 5000
      };

      const created = await mockLoanApi.create(newLoan);
      expect(created.mwLoanNo).toBe('9999');

      const allLoans = await mockLoanApi.getAll();
      expect(allLoans.find(l => l.mwLoanNo === '9999')).toBeDefined();
    });

    it('should update a loan', async () => {
      const updated = await mockLoanApi.update('000005100377580', { principal: 999999 });
      expect(updated.principal).toBe(999999);
      expect(updated.mwLoanNo).toBe('000005100377580');
    });

    it('should delete a loan', async () => {
      await mockLoanApi.delete('000005100377580');
      const loan = await mockLoanApi.getById('000005100377580');
      expect(loan).toBeUndefined();
    });
  });

  describe('Borrower API', () => {
    it('should get all borrowers', async () => {
      const borrowers = await mockBorrowerApi.getAll();
      expect(borrowers).toBeDefined();
      expect(borrowers.length).toBeGreaterThan(0);
      expect(borrowers[0]).toHaveProperty('id');
      expect(borrowers[0]).toHaveProperty('name');
    });

    it('should maintain loan relationships', async () => {
      const borrowers = await mockBorrowerApi.getAll();
      const firstBorrower = borrowers[0];
      expect(firstBorrower.loanRelationships).toBeDefined();
    });
  });

  describe('Network Simulation', () => {
    it('should simulate network delay', async () => {
      const start = Date.now();
      await mockLoanApi.getAll();
      const duration = Date.now() - start;

      // Should take at least 50ms (mock delay)
      expect(duration).toBeGreaterThanOrEqual(50);
      // Should not take more than 300ms
      expect(duration).toBeLessThan(300);
    });
  });
});
