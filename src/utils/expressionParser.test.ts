/**
 * Expression Parser Tests
 * Tests for the secure mathematical expression parser
 */

import { describe, it, expect } from 'vitest';
import { calculateExpression } from './expressionParser';

describe('calculateExpression', () => {
  describe('Basic Operations', () => {
    it('should evaluate simple addition', () => {
      expect(calculateExpression('5+3')).toBe('8.00');
    });

    it('should evaluate simple subtraction', () => {
      expect(calculateExpression('10-4')).toBe('6.00');
    });

    it('should evaluate simple multiplication', () => {
      expect(calculateExpression('6*7')).toBe('42.00');
    });

    it('should evaluate simple division', () => {
      expect(calculateExpression('20/4')).toBe('5.00');
    });

    it('should handle decimal numbers', () => {
      expect(calculateExpression('3.5+2.5')).toBe('6.00');
    });

    it('should handle decimal division result', () => {
      expect(calculateExpression('10/3')).toBe('3.33');
    });
  });

  describe('Operator Precedence', () => {
    it('should respect multiplication over addition', () => {
      expect(calculateExpression('2+3*4')).toBe('14.00');
    });

    it('should respect division over subtraction', () => {
      expect(calculateExpression('10-6/2')).toBe('7.00');
    });

    it('should handle mixed precedence correctly', () => {
      expect(calculateExpression('2+3*4-5/5')).toBe('13.00');
    });

    it('should evaluate left-to-right for same precedence', () => {
      expect(calculateExpression('10/2*5')).toBe('25.00');
    });

    it('should evaluate addition/subtraction left-to-right', () => {
      expect(calculateExpression('10-3+2')).toBe('9.00');
    });
  });

  describe('Parentheses', () => {
    it('should handle parentheses overriding precedence', () => {
      expect(calculateExpression('(2+3)*4')).toBe('20.00');
    });

    it('should handle nested parentheses', () => {
      expect(calculateExpression('((2+3)*4)')).toBe('20.00');
    });

    it('should handle multiple groups', () => {
      expect(calculateExpression('(2+3)*(4+1)')).toBe('25.00');
    });

    it('should handle complex nested parentheses', () => {
      expect(calculateExpression('((10+5)/3)*(2+4)')).toBe('30.00');
    });

    it('should handle parentheses with division', () => {
      expect(calculateExpression('10/(2+3)')).toBe('2.00');
    });
  });

  describe('Negative Numbers', () => {
    it('should handle negative number at start', () => {
      expect(calculateExpression('-5+10')).toBe('5.00');
    });

    it('should handle negative number in expression', () => {
      expect(calculateExpression('10+-5')).toBe('5.00');
    });

    it('should handle negative after parenthesis', () => {
      expect(calculateExpression('(-5)*2')).toBe('-10.00');
    });

    it('should handle subtraction of negative', () => {
      expect(calculateExpression('10--5')).toBe('15.00');
    });

    it('should handle negative result', () => {
      expect(calculateExpression('5-10')).toBe('-5.00');
    });
  });

  describe('Edge Cases', () => {
    it('should return original for empty string', () => {
      expect(calculateExpression('')).toBe('');
    });

    it('should return formatted single number', () => {
      expect(calculateExpression('42')).toBe('42.00');
    });

    it('should handle single negative number', () => {
      expect(calculateExpression('-42')).toBe('-42.00');
    });

    it('should return 0 for division by zero', () => {
      expect(calculateExpression('10/0')).toBe('0.00');
    });

    it('should handle large numbers', () => {
      expect(calculateExpression('1000000+500000')).toBe('1500000.00');
    });

    it('should handle very small decimals', () => {
      expect(calculateExpression('0.01+0.02')).toBe('0.03');
    });

    it('should handle single decimal point number', () => {
      expect(calculateExpression('3.14159')).toBe('3.14');
    });
  });

  describe('Input Sanitization', () => {
    it('should remove spaces', () => {
      expect(calculateExpression('5 + 3')).toBe('8.00');
    });

    it('should remove dollar signs', () => {
      expect(calculateExpression('$100+$50')).toBe('150.00');
    });

    it('should remove commas', () => {
      expect(calculateExpression('1,000+500')).toBe('1500.00');
    });

    it('should handle mixed formatting', () => {
      expect(calculateExpression('$1,000 + $500')).toBe('1500.00');
    });
  });

  describe('Security - Invalid Input Handling', () => {
    it('should reject alphabetic characters', () => {
      expect(calculateExpression('abc')).toBe('abc');
    });

    it('should reject mixed alphanumeric', () => {
      expect(calculateExpression('5+abc')).toBe('5+abc');
    });

    it('should reject special characters', () => {
      expect(calculateExpression('5;drop table')).toBe('5;drop table');
    });

    it('should reject function-like syntax', () => {
      expect(calculateExpression('Math.pow(2,3)')).toBe('Math.pow(2,3)');
    });

    it('should reject eval-like attempts', () => {
      expect(calculateExpression('eval("alert(1)")')).toBe('eval("alert(1)")');
    });

    it('should reject object property access', () => {
      expect(calculateExpression('this.constructor')).toBe('this.constructor');
    });

    it('should reject brackets', () => {
      expect(calculateExpression('[1,2,3]')).toBe('[1,2,3]');
    });

    it('should reject curly braces', () => {
      expect(calculateExpression('{a:1}')).toBe('{a:1}');
    });
  });

  describe('Complex Real-World Expressions', () => {
    it('should calculate loan payment scenario', () => {
      // Example: $500 + $250 = $750
      expect(calculateExpression('500+250')).toBe('750.00');
    });

    it('should calculate percentage increase', () => {
      // 1000 * 1.1 = 1100 (10% increase)
      expect(calculateExpression('1000*1.1')).toBe('1100.00');
    });

    it('should calculate split payment', () => {
      // (500*2)+250 = 1250
      expect(calculateExpression('(500*2)+250')).toBe('1250.00');
    });

    it('should calculate average', () => {
      // (100+200+300)/3 = 200
      expect(calculateExpression('(100+200+300)/3')).toBe('200.00');
    });

    it('should handle complex financial calculation', () => {
      // 10000 * (8.5/100/12) = monthly interest
      expect(calculateExpression('10000*(8.5/100/12)')).toBe('70.83');
    });
  });

  describe('Chained Operations', () => {
    it('should handle multiple additions', () => {
      expect(calculateExpression('1+2+3+4+5')).toBe('15.00');
    });

    it('should handle multiple multiplications', () => {
      expect(calculateExpression('2*3*4')).toBe('24.00');
    });

    it('should handle alternating operations', () => {
      expect(calculateExpression('10+5-3+2-1')).toBe('13.00');
    });

    it('should handle long expression', () => {
      // 1 + (2*3) - (4/2) + (5*6) - 7 = 1 + 6 - 2 + 30 - 7 = 28
      expect(calculateExpression('1+2*3-4/2+5*6-7')).toBe('28.00');
    });
  });

  describe('Decimal Precision', () => {
    it('should round to 2 decimal places', () => {
      expect(calculateExpression('1/3')).toBe('0.33');
    });

    it('should handle repeating decimals', () => {
      expect(calculateExpression('2/3')).toBe('0.67');
    });

    it('should preserve significant decimals', () => {
      expect(calculateExpression('1.99+0.01')).toBe('2.00');
    });

    it('should handle floating point precision', () => {
      expect(calculateExpression('0.1+0.2')).toBe('0.30');
    });
  });
});
