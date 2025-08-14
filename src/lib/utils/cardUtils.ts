import { Card } from '@/types/database';

/**
 * Card utility functions
 * 
 * Provides utilities for card management, including sorting functions
 * that implement the business requirement for card ordering.
 */

/**
 * Sorts cards by payment schedule priority.
 * 
 * Implements the business requirement that cards with "支払日" (payment date) 
 * set to "翌月" (next month, paymentMonthShift === 1) should be placed 
 * after other cards in the registration order.
 * 
 * Sorting priority:
 * 1. Current month payment cards (paymentMonthShift === 0) - first
 * 2. Two months later payment cards (paymentMonthShift === 2) - second  
 * 3. Next month payment cards (paymentMonthShift === 1) - last
 * 
 * Within each group, cards are sorted by:
 * 1. Card name (alphabetically)
 * 2. Creation date (oldest first) if names are the same
 * 
 * @param cards - Array of cards to sort
 * @returns Sorted array with next month payment cards at the end
 */
export function sortCardsByPaymentSchedule(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    // Primary sort: Payment month shift priority
    const priorityA = getPaymentPriority(a.paymentMonthShift);
    const priorityB = getPaymentPriority(b.paymentMonthShift);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Secondary sort: Card name (alphabetically in Japanese)
    const nameComparison = a.name.localeCompare(b.name, 'ja');
    if (nameComparison !== 0) {
      return nameComparison;
    }
    
    // Tertiary sort: Creation date (oldest first)
    return a.createdAt - b.createdAt;
  });
}

/**
 * Gets the priority value for payment schedule ordering.
 * Lower numbers = higher priority (displayed first).
 * 
 * @param paymentMonthShift - The payment month shift value
 * @returns Priority number for sorting
 */
function getPaymentPriority(paymentMonthShift: number): number {
  switch (paymentMonthShift) {
    case 0: return 1; // 当月払い - highest priority (first)
    case 2: return 2; // 翌々月払い - medium priority (second) 
    case 1: return 3; // 翌月払い - lowest priority (last)
    default: return 4; // Unknown values - lowest priority
  }
}

/**
 * Checks if a card uses next month payment schedule.
 * 
 * @param card - The card to check
 * @returns true if the card uses next month payment (paymentMonthShift === 1)
 */
export function isNextMonthPaymentCard(card: Card): boolean {
  return card.paymentMonthShift === 1;
}

/**
 * Gets a human-readable description of the payment schedule for a card.
 * 
 * @param card - The card to describe
 * @returns Japanese description of the payment schedule
 */
export function getPaymentScheduleDescription(card: Card): string {
  switch (card.paymentMonthShift) {
    case 0: return '当月払い';
    case 1: return '翌月払い'; 
    case 2: return '翌々月払い';
    default: return `${card.paymentMonthShift}ヶ月後払い`;
  }
}