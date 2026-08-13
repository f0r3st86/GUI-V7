// Initial comments data - exact copy from original component
import type { Comment } from '../types';

// *** SQL CONNECTION POINT ***
// SELECT * FROM comments WHERE loan_id IN (SELECT mwLoanNo FROM loans WHERE relationship = 'Haskell')

export const initialComments: Comment[] = [
  {
    id: 1,
    loanNo: '000005100377580',
    commentType: 'Note',
    date: '11/08/24',
    text: `Borrower contacted regarding payment schedule.\n\nSpoke with Matthew Haskell on 11/08/24 at 2:30pm. Discussed upcoming payment due on 12/01/24. Borrower confirmed ability to make payment on time.\n\nFollow up scheduled for 11/25/24 if payment not received by 11/20/24.`
  },
  {
    id: 2,
    loanNo: '000005100377580',
    commentType: 'Legal',
    date: '10/15/24',
    text: `Title work completed. All liens properly recorded.`
  },
  {
    id: 3,
    loanNo: '000005100324610',
    commentType: 'Underwriting',
    date: '09/20/24',
    text: `Annual review completed. Property value confirmed at $950,000 based on recent appraisal. Borrower financial statements show strong performance with DSCR of 1.45. Recommend continuing current terms.`
  }
];
