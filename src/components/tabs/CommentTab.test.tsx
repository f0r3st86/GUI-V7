/**
 * CommentTab Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { CommentTab } from './CommentTab';

describe('CommentTab', () => {
  describe('Rendering', () => {
    it('should render Comments header', () => {
      render(<CommentTab />);

      expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    it('should render Add Comment button', () => {
      render(<CommentTab />);

      expect(screen.getByText('+ Add Comment')).toBeInTheDocument();
    });
  });

  describe('Comments Table', () => {
    it('should render table headers', () => {
      render(<CommentTab />);

      expect(screen.getByText('Loan #')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });
  });

  describe('Comment Details Section', () => {
    it('should render Comment Details header', () => {
      render(<CommentTab />);

      expect(screen.getByText('Comment Details')).toBeInTheDocument();
    });

    it('should render Loan Number field', () => {
      render(<CommentTab />);

      expect(screen.getByText('Loan Number:')).toBeInTheDocument();
    });

    it('should render Comment Type field', () => {
      render(<CommentTab />);

      expect(screen.getByText('Comment Type:')).toBeInTheDocument();
    });

    it('should render Date field', () => {
      render(<CommentTab />);

      // Date appears in both table header and detail section
      const dateLabels = screen.getAllByText('Date:');
      expect(dateLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('should render Comment Text field', () => {
      render(<CommentTab />);

      expect(screen.getByText('Comment Text:')).toBeInTheDocument();
    });
  });

  describe('Comment Type Options', () => {
    it('should have comment type options', () => {
      render(<CommentTab />);

      // Note appears multiple times (in table and dropdown)
      expect(screen.getAllByText('Note').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('SQL Connection Info', () => {
    it('should render SQL Connection Points', () => {
      render(<CommentTab />);

      expect(screen.getByText('SQL Connection Points:')).toBeInTheDocument();
    });
  });

  describe('User Instructions', () => {
    it('should show interaction instructions', () => {
      render(<CommentTab />);

      expect(screen.getByText('Click a comment to view/edit')).toBeInTheDocument();
      expect(screen.getByText('Click + Add Comment to create new')).toBeInTheDocument();
      expect(screen.getByText('Click x to delete a comment')).toBeInTheDocument();
    });
  });

  describe('Comment Text Area', () => {
    it('should render textarea for comment text', () => {
      render(<CommentTab />);

      const textarea = screen.getByPlaceholderText(/Enter comment text here/);
      expect(textarea).toBeInTheDocument();
    });

    it('should show character count', () => {
      render(<CommentTab />);

      expect(screen.getByText(/characters/)).toBeInTheDocument();
    });
  });
});
