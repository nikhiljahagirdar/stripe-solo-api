/**
 * Utility functions for handling decimal conversions
 */

/**
 * Converts a decimal string to a number
 * @param value - The decimal string value from database
 * @returns The numeric value or 0 if null/undefined
 */
export const decimalToNumber = (value: string | null | undefined): number => {
  if (!value) {return 0;}
  return parseFloat(value);
};

/**
 * Converts a number to decimal string for database insertion
 * @param value - The numeric value
 * @returns The decimal string value
 */
export const numberToDecimal = (value: number | null | undefined): string => {
  if (!value) {return '0.00';}
  return value.toString();
};

/**
 * Converts a decimal string to cents (for Stripe compatibility)
 * @param value - The decimal string value from database
 * @returns The value in cents as a number
 */
export const decimalToCents = (value: string | null | undefined): number => {
  if (!value) {return 0;}
  return Math.round(parseFloat(value) * 100);
};

/**
 * Converts cents to decimal
 * @param cents - The value in cents
 * @returns The decimal value
 */
export const centsToDecimal = (cents: number): number => {
  return cents / 100;
};

/**
 * Formats a decimal string for display
 * @param value - The decimal string value from database
 * @param currency - The currency code (optional)
 * @returns Formatted string
 */
export const formatDecimal = (value: string | null | undefined, currency?: string): string => {
  const num = decimalToNumber(value);
  if (currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(num);
  }
  return num.toFixed(2);
};