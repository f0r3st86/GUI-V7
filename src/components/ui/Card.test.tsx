/**
 * Card Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { Card, CardSmall } from './Card';

describe('Card', () => {
  describe('Rendering', () => {
    it('should render children', () => {
      render(<Card>Card Content</Card>);

      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(<Card title="Card Title">Content</Card>);

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render without title when not provided', () => {
      render(<Card>Content Only</Card>);

      expect(screen.getByText('Content Only')).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render complex children', () => {
      render(
        <Card>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
        </Card>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have rounded corners', () => {
      render(<Card><span data-testid="content">Content</span></Card>);

      // Find the card container by going up from the content
      const content = screen.getByTestId('content');
      const card = content.closest('.rounded-lg');
      expect(card).toBeInTheDocument();
    });

    it('should have padding', () => {
      render(<Card><span data-testid="content">Content</span></Card>);

      const content = screen.getByTestId('content');
      const card = content.closest('.p-4');
      expect(card).toBeInTheDocument();
    });

    it('should have border', () => {
      render(<Card><span data-testid="content">Content</span></Card>);

      const content = screen.getByTestId('content');
      const card = content.closest('.border');
      expect(card).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Card className="custom-class"><span data-testid="content">Content</span></Card>);

      const content = screen.getByTestId('content');
      const card = content.closest('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('should apply custom style', () => {
      render(<Card style={{ width: '300px' }}><span data-testid="content">Content</span></Card>);

      const content = screen.getByTestId('content');
      // Find parent with the style
      const card = content.parentElement;
      expect(card).toHaveStyle({ width: '300px' });
    });
  });

  describe('Title Styling', () => {
    it('should style title with font-medium', () => {
      render(<Card title="Test Title">Content</Card>);

      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('font-medium');
    });

    it('should have margin below title', () => {
      render(<Card title="Test Title">Content</Card>);

      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('mb-3');
    });
  });
});

describe('CardSmall', () => {
  describe('Rendering', () => {
    it('should render children', () => {
      render(<CardSmall>Small Card Content</CardSmall>);

      expect(screen.getByText('Small Card Content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(<CardSmall title="Small Title">Content</CardSmall>);

      expect(screen.getByText('Small Title')).toBeInTheDocument();
    });
  });

  describe('Styling Differences from Card', () => {
    it('should have smaller padding than Card', () => {
      render(<CardSmall><span data-testid="content">Content</span></CardSmall>);

      const content = screen.getByTestId('content');
      const card = content.closest('.p-3');
      expect(card).toBeInTheDocument();
    });

    it('should have smaller title font', () => {
      render(<CardSmall title="Small Title">Content</CardSmall>);

      const title = screen.getByText('Small Title');
      expect(title).toHaveClass('text-xs');
    });

    it('should have rounded corners', () => {
      render(<CardSmall><span data-testid="content">Content</span></CardSmall>);

      const content = screen.getByTestId('content');
      const card = content.closest('.rounded-lg');
      expect(card).toBeInTheDocument();
    });

    it('should have border', () => {
      render(<CardSmall><span data-testid="content">Content</span></CardSmall>);

      const content = screen.getByTestId('content');
      const card = content.closest('.border');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(<CardSmall className="my-custom"><span data-testid="content">Content</span></CardSmall>);

      const content = screen.getByTestId('content');
      const card = content.closest('.my-custom');
      expect(card).toBeInTheDocument();
    });

    it('should apply custom style', () => {
      render(<CardSmall style={{ maxWidth: '200px' }}><span data-testid="content">Content</span></CardSmall>);

      const content = screen.getByTestId('content');
      const card = content.parentElement;
      expect(card).toHaveStyle({ maxWidth: '200px' });
    });
  });
});
