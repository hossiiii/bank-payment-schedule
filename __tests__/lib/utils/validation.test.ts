import {
  validateBankName,
  validateCardName,
  validateStoreName,
  validateUsage,
  validateAmount,
  validateDate,
  validateDayOfMonth,
  validatePassword,
  validateMemo,
  validateForm,
  sanitizeInput,
  formatAmount,
  parseAmount
} from '@/lib/utils/validation';
import { z } from 'zod';

describe('validation', () => {
  describe('validateBankName', () => {
    it('should validate correct bank names', () => {
      const result = validateBankName('みずほ銀行');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept English bank names', () => {
      const result = validateBankName('MUFG Bank');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty names', () => {
      const result = validateBankName('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('必須');
    });

    it('should reject names that are too long', () => {
      const longName = 'A'.repeat(51);
      const result = validateBankName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('50文字以内');
    });

    it('should reject names with invalid characters', () => {
      const result = validateBankName('銀行<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('使用できない文字');
    });

    it('should trim whitespace', () => {
      const result = validateBankName('  みずほ銀行  ');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCardName', () => {
    it('should validate correct card names', () => {
      const result = validateCardName('楽天カード');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept English card names', () => {
      const result = validateCardName('VISA Card');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty names', () => {
      const result = validateCardName('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('必須');
    });

    it('should reject names that are too long', () => {
      const longName = 'A'.repeat(51);
      const result = validateCardName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('50文字以内');
    });
  });

  describe('validateStoreName', () => {
    it('should validate correct store names', () => {
      const result = validateStoreName('セブンイレブン');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept empty store names (optional)', () => {
      const result = validateStoreName('');
      expect(result.isValid).toBe(true);
    });

    it('should reject names that are too long', () => {
      const longName = 'A'.repeat(101);
      const result = validateStoreName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('100文字以内');
    });
  });

  describe('validateUsage', () => {
    it('should validate correct usage descriptions', () => {
      const result = validateUsage('食費');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept empty usage (optional)', () => {
      const result = validateUsage('');
      expect(result.isValid).toBe(true);
    });

    it('should reject usage that is too long', () => {
      const longUsage = 'A'.repeat(101);
      const result = validateUsage(longUsage);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('100文字以内');
    });
  });

  describe('validateAmount', () => {
    it('should validate positive numbers', () => {
      const result = validateAmount(1000);
      expect(result.isValid).toBe(true);
      expect(result.parsedAmount).toBe(1000);
    });

    it('should validate string amounts', () => {
      const result = validateAmount('1500');
      expect(result.isValid).toBe(true);
      expect(result.parsedAmount).toBe(1500);
    });

    it('should handle amounts with commas', () => {
      const result = validateAmount('1,500');
      expect(result.isValid).toBe(true);
      expect(result.parsedAmount).toBe(1500);
    });

    it('should handle amounts with Japanese commas', () => {
      const result = validateAmount('1，500');
      expect(result.isValid).toBe(true);
      expect(result.parsedAmount).toBe(1500);
    });

    it('should reject zero amounts', () => {
      const result = validateAmount(0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('0より大きい');
    });

    it('should reject negative amounts', () => {
      const result = validateAmount(-100);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('0より大きい');
    });

    it('should reject amounts that are too large', () => {
      const result = validateAmount(10000000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('999万円以下');
    });

    it('should reject decimal amounts', () => {
      const result = validateAmount(100.5);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('整数');
    });

    it('should reject invalid string amounts', () => {
      const result = validateAmount('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('有効な金額');
    });
  });

  describe('validateDate', () => {
    it('should validate valid dates', () => {
      const result = validateDate(new Date('2024-01-15'));
      expect(result.isValid).toBe(true);
      expect(result.parsedDate).toBeInstanceOf(Date);
    });

    it('should validate string dates', () => {
      const result = validateDate('2024-01-15');
      expect(result.isValid).toBe(true);
      expect(result.parsedDate).toBeInstanceOf(Date);
    });

    it('should reject invalid date strings', () => {
      const result = validateDate('invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('有効な日付');
    });

    it('should reject dates too far in the past', () => {
      const oldDate = new Date('2020-01-01');
      const result = validateDate(oldDate);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('古すぎます');
    });

    it('should reject dates too far in the future', () => {
      const futureDate = new Date('2030-01-01');
      const result = validateDate(futureDate);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('未来すぎます');
    });
  });

  describe('validateDayOfMonth', () => {
    it('should validate numeric days', () => {
      const result = validateDayOfMonth('15');
      expect(result.isValid).toBe(true);
    });

    it('should validate month-end', () => {
      const result = validateDayOfMonth('月末');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty input', () => {
      const result = validateDayOfMonth('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('必須');
    });

    it('should reject invalid numbers', () => {
      const result = validateDayOfMonth('32');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('1〜31');
    });

    it('should reject zero', () => {
      const result = validateDayOfMonth('0');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('1〜31');
    });

    it('should reject non-numeric strings', () => {
      const result = validateDayOfMonth('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('数値');
    });

    it('should use custom field name in errors', () => {
      const result = validateDayOfMonth('', '支払日');
      expect(result.errors[0]).toContain('支払日は必須');
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongP@ssw0rd123');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should validate medium passwords', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('medium');
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors[0]).toContain('弱すぎます');
    });

    it('should reject short passwords', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('8文字以上');
    });

    it('should reject long passwords', () => {
      const longPassword = 'A'.repeat(129) + '1!';
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('128文字以下');
    });

    it('should reject empty passwords', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('必須');
    });
  });

  describe('validateMemo', () => {
    it('should validate short memos', () => {
      const result = validateMemo('短いメモ');
      expect(result.isValid).toBe(true);
    });

    it('should accept empty memos', () => {
      const result = validateMemo('');
      expect(result.isValid).toBe(true);
    });

    it('should reject long memos', () => {
      const longMemo = 'A'.repeat(201);
      const result = validateMemo(longMemo);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('200文字以内');
    });
  });

  describe('validateForm', () => {
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      age: z.number().min(0, 'Age must be positive')
    });

    it('should validate correct form data', () => {
      const data = { name: 'John', age: 25 };
      const result = validateForm(data, schema);
      
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.errors).toEqual({});
    });

    it('should return validation errors', () => {
      const data = { name: '', age: -5 };
      const result = validateForm(data, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('Name is required');
      expect(result.errors.age).toContain('Age must be positive');
    });

    it('should handle nested validation errors', () => {
      const nestedSchema = z.object({
        user: z.object({
          email: z.string().email('Invalid email')
        })
      });
      
      const data = { user: { email: 'invalid' } };
      const result = validateForm(data, nestedSchema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors['user.email']).toBeDefined();
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle empty input', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    it('should handle null input', () => {
      const result = sanitizeInput(null as any);
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const result = sanitizeInput('  test  ');
      expect(result).toBe('test');
    });

    it('should escape quotes and slashes', () => {
      const input = `"Hello's world"/test`;
      const result = sanitizeInput(input);
      expect(result).toBe('&quot;Hello&#x27;s world&quot;&#x2F;test');
    });
  });

  describe('formatAmount', () => {
    it('should format amounts in Japanese currency', () => {
      const result = formatAmount(1000);
      expect(result).toBe('￥1,000');
    });

    it('should handle zero amounts', () => {
      const result = formatAmount(0);
      expect(result).toBe('￥0');
    });

    it('should handle large amounts', () => {
      const result = formatAmount(1234567);
      expect(result).toBe('￥1,234,567');
    });

    it('should not show decimal places', () => {
      const result = formatAmount(1000.99);
      expect(result).toBe('￥1,001'); // Rounded to integer
    });
  });

  describe('parseAmount', () => {
    it('should parse formatted amounts', () => {
      const result = parseAmount('￥1,000');
      expect(result).toBe(1000);
    });

    it('should parse amounts with Japanese commas', () => {
      const result = parseAmount('1，500');
      expect(result).toBe(1500);
    });

    it('should handle amounts without formatting', () => {
      const result = parseAmount('2500');
      expect(result).toBe(2500);
    });

    it('should handle amounts with spaces', () => {
      const result = parseAmount(' ￥ 1,500 ');
      expect(result).toBe(1500);
    });

    it('should return null for invalid amounts', () => {
      const result = parseAmount('invalid');
      expect(result).toBe(null);
    });

    it('should return null for empty strings', () => {
      const result = parseAmount('');
      expect(result).toBe(null);
    });
  });
});