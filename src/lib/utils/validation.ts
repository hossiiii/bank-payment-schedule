import { z } from 'zod';

/**
 * Input validation utilities
 * 
 * Provides common validation functions for forms and user input
 * beyond the database schema validation.
 */

/**
 * Validates Japanese bank name format
 */
export function validateBankName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('銀行名は必須です');
  } else if (name.trim().length > 50) {
    errors.push('銀行名は50文字以内で入力してください');
  } else if (!/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\w\s\-．・]+$/.test(name.trim())) {
    errors.push('銀行名に使用できない文字が含まれています');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates card name format
 */
export function validateCardName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('カード名は必須です');
  } else if (name.trim().length > 50) {
    errors.push('カード名は50文字以内で入力してください');
  } else if (!/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\w\s\-．・]+$/.test(name.trim())) {
    errors.push('カード名に使用できない文字が含まれています');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates store name format
 */
export function validateStoreName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (name && name.trim().length > 100) {
    errors.push('店舗名は100文字以内で入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates usage description format
 */
export function validateUsage(usage: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (usage && usage.trim().length > 100) {
    errors.push('用途は100文字以内で入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates amount input
 */
export function validateAmount(amount: number | string): {
  isValid: boolean;
  errors: string[];
  parsedAmount?: number;
} {
  const errors: string[] = [];
  let parsedAmount: number;
  
  if (typeof amount === 'string') {
    // Remove common separators and parse
    const cleanAmount = amount.replace(/[,，]/g, '');
    parsedAmount = parseFloat(cleanAmount);
    
    if (isNaN(parsedAmount)) {
      errors.push('有効な金額を入力してください');
      return { isValid: false, errors };
    }
  } else {
    parsedAmount = amount;
  }
  
  if (parsedAmount <= 0) {
    errors.push('金額は0より大きい値を入力してください');
  } else if (parsedAmount > 9999999) {
    errors.push('金額は999万円以下で入力してください');
  } else if (!Number.isInteger(parsedAmount)) {
    errors.push('金額は整数で入力してください（小数点は使用できません）');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    parsedAmount
  };
}

/**
 * Validates date input
 */
export function validateDate(date: string | Date): {
  isValid: boolean;
  errors: string[];
  parsedDate?: Date;
} {
  const errors: string[] = [];
  let parsedDate: Date;
  
  if (typeof date === 'string') {
    parsedDate = new Date(date);
    
    if (isNaN(parsedDate.getTime())) {
      errors.push('有効な日付を入力してください');
      return { isValid: false, errors };
    }
  } else {
    parsedDate = date;
  }
  
  // Check if date is too far in the past or future
  const now = new Date();
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
  const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
  
  if (parsedDate < twoYearsAgo) {
    errors.push('日付が古すぎます（2年以前の日付は使用できません）');
  } else if (parsedDate > twoYearsFromNow) {
    errors.push('日付が未来すぎます（2年後以降の日付は使用できません）');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    parsedDate
  };
}

/**
 * Validates closing/payment day format
 */
export function validateDayOfMonth(day: string, fieldName: string = '日付'): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!day || day.trim().length === 0) {
    errors.push(`${fieldName}は必須です`);
    return { isValid: false, errors };
  }
  
  const trimmedDay = day.trim();
  
  if (trimmedDay === '月末') {
    return { isValid: true, errors: [] };
  }
  
  const dayNumber = parseInt(trimmedDay, 10);
  
  if (isNaN(dayNumber)) {
    errors.push(`${fieldName}は数値または"月末"を入力してください`);
  } else if (dayNumber < 1 || dayNumber > 31) {
    errors.push(`${fieldName}は1〜31の範囲で入力してください`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (!password || password.length === 0) {
    errors.push('パスワードは必須です');
    return { isValid: false, errors, strength };
  }
  
  if (password.length < 8) {
    errors.push('パスワードは8文字以上で入力してください');
  }
  
  if (password.length > 128) {
    errors.push('パスワードは128文字以下で入力してください');
  }
  
  // Check for character variety
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const varietyCount = [hasLower, hasUpper, hasNumbers, hasSymbols].filter(Boolean).length;
  
  if (varietyCount >= 3 && password.length >= 12) {
    strength = 'strong';
  } else if (varietyCount >= 2 && password.length >= 8) {
    strength = 'medium';
  }
  
  if (errors.length === 0 && strength === 'weak') {
    errors.push('パスワードが弱すぎます。大文字、小文字、数字、記号を組み合わせてください');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Validates memo/note input
 */
export function validateMemo(memo: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (memo && memo.trim().length > 200) {
    errors.push('メモは200文字以内で入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Comprehensive form validation utility
 */
export function validateForm<T extends Record<string, unknown>>(
  data: T,
  schema: z.ZodSchema<T>
): {
  isValid: boolean;
  errors: Record<string, string[]>;
  data?: T;
} {
  try {
    const validatedData = schema.parse(data);
    return {
      isValid: true,
      errors: {},
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      
      error.errors.forEach(err => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      
      return {
        isValid: false,
        errors
      };
    }
    
    return {
      isValid: false,
      errors: { general: ['Validation failed'] }
    };
  }
}

/**
 * Sanitizes user input to prevent XSS and other issues
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Formats amount for display
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(amount);
}

/**
 * Parses amount from formatted string
 */
export function parseAmount(amountString: string): number | null {
  const cleaned = amountString.replace(/[￥,，\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}