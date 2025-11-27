// Safe mathematical expression parser - SECURE IMPLEMENTATION
// Uses a safe tokenizer and parser instead of eval/Function
// This is the security-fixed version from the original component

interface Token {
  type: 'number' | 'operator' | 'paren';
  value: number | string;
}

/**
 * Safe tokenizer - breaks expression into numbers and operators
 */
const tokenize = (str: string): Token[] => {
  const tokens: Token[] = [];
  let current = '';
  let i = 0;

  while (i < str.length) {
    const char = str[i];

    if ('0123456789.'.includes(char)) {
      current += char;
    } else if ('+-*/()'.includes(char)) {
      if (current) {
        tokens.push({ type: 'number', value: parseFloat(current) });
        current = '';
      }
      // Handle negative numbers at start or after operator/open paren
      if (char === '-' && (tokens.length === 0 ||
          tokens[tokens.length - 1].type === 'operator' ||
          tokens[tokens.length - 1].value === '(')) {
        current = '-';
      } else {
        tokens.push({
          type: char === '(' || char === ')' ? 'paren' : 'operator',
          value: char
        });
      }
    }
    i++;
  }

  if (current) {
    tokens.push({ type: 'number', value: parseFloat(current) });
  }

  return tokens;
};

/**
 * Safe evaluator using shunting-yard algorithm
 */
const evaluate = (tokens: Token[]): number => {
  const outputQueue: (number | string)[] = [];
  const operatorStack: string[] = [];
  const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

  for (const token of tokens) {
    if (token.type === 'number') {
      outputQueue.push(token.value as number);
    } else if (token.type === 'operator') {
      while (operatorStack.length > 0 &&
             operatorStack[operatorStack.length - 1] !== '(' &&
             precedence[operatorStack[operatorStack.length - 1]] >= precedence[token.value as string]) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token.value as string);
    } else if (token.value === '(') {
      operatorStack.push('(');
    } else if (token.value === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.pop(); // Remove the '('
    }
  }

  while (operatorStack.length > 0) {
    outputQueue.push(operatorStack.pop()!);
  }

  // Evaluate RPN
  const stack: number[] = [];
  for (const item of outputQueue) {
    if (typeof item === 'number') {
      stack.push(item);
    } else {
      const b = stack.pop()!;
      const a = stack.pop()!;
      switch (item) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/': stack.push(b !== 0 ? a / b : 0); break;
      }
    }
  }

  return stack[0];
};

/**
 * Calculate expression in amount field - SECURE IMPLEMENTATION
 * Uses a safe tokenizer and parser instead of eval/Function
 */
export const calculateExpression = (expression: string): string => {
  try {
    // Remove spaces, dollar signs, and commas
    let expr = expression.replace(/[\s$,]/g, '');

    // Return original if empty or just a number
    if (!expr || /^-?\d+\.?\d*$/.test(expr)) {
      return expr ? parseFloat(expr).toFixed(2) : expression;
    }

    // Strict validation - only allow numbers, operators, parentheses, and decimal points
    if (!/^[0-9+\-*/().]+$/.test(expr)) {
      return expression;
    }

    const tokens = tokenize(expr);
    const result = evaluate(tokens);

    return isNaN(result) || !isFinite(result) ? expression : result.toFixed(2);
  } catch (e) {
    return expression;
  }
};
