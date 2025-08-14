import { sortCardsByPaymentSchedule, isNextMonthPaymentCard, getPaymentScheduleDescription } from '@/lib/utils/cardUtils';
import { Card } from '@/types/database';

describe('cardUtils', () => {
  const mockCards: Card[] = [
    {
      id: 'card1',
      name: 'イオンカード',
      bankId: 'bank1',
      closingDay: '10',
      paymentDay: '2',
      paymentMonthShift: 1, // 翌月払い
      adjustWeekend: true,
      createdAt: 1640995200000 // 2022-01-01
    },
    {
      id: 'card2', 
      name: '楽天カード',
      bankId: 'bank2',
      closingDay: '月末',
      paymentDay: '27',
      paymentMonthShift: 0, // 当月払い
      adjustWeekend: true,
      createdAt: 1643587200000 // 2022-01-31
    },
    {
      id: 'card3',
      name: 'JCBカード', 
      bankId: 'bank3',
      closingDay: '15',
      paymentDay: '10',
      paymentMonthShift: 2, // 翌々月払い
      adjustWeekend: true,
      createdAt: 1641081600000 // 2022-01-02
    },
    {
      id: 'card4',
      name: 'VISAカード',
      bankId: 'bank4',
      closingDay: '5',
      paymentDay: '25',
      paymentMonthShift: 1, // 翌月払い
      adjustWeekend: true,
      createdAt: 1641168000000 // 2022-01-03
    }
  ];

  describe('sortCardsByPaymentSchedule', () => {
    it('should place next month payment cards (paymentMonthShift === 1) at the end', () => {
      const sorted = sortCardsByPaymentSchedule(mockCards);
      
      // Check that current month (0) and two months later (2) cards come first
      const firstTwoCards = sorted.slice(0, 2);
      expect(firstTwoCards.every(card => card.paymentMonthShift !== 1)).toBe(true);
      
      // Check that next month (1) cards come last
      const lastTwoCards = sorted.slice(2);
      expect(lastTwoCards.every(card => card.paymentMonthShift === 1)).toBe(true);
    });

    it('should sort by priority: current month (0), two months later (2), then next month (1)', () => {
      const sorted = sortCardsByPaymentSchedule(mockCards);
      
      const priorities = sorted.map(card => {
        switch (card.paymentMonthShift) {
          case 0: return 1;
          case 2: return 2; 
          case 1: return 3;
          default: return 4;
        }
      });

      // Check that priorities are in non-decreasing order
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i - 1]);
      }
    });

    it('should sort cards with same payment shift by name alphabetically', () => {
      const cardsWithSameShift: Card[] = [
        {
          ...mockCards[0],
          name: 'ゼロカード',
          paymentMonthShift: 1
        },
        {
          ...mockCards[1],
          name: 'アカード', 
          paymentMonthShift: 1
        },
        {
          ...mockCards[2],
          name: 'ビカード',
          paymentMonthShift: 1
        }
      ];
      
      const sorted = sortCardsByPaymentSchedule(cardsWithSameShift);
      
      // Verify that they are sorted in Japanese alphabetical order
      const names = sorted.map(card => card.name);
      expect(names).toEqual(['アカード', 'ゼロカード', 'ビカード']);
    });

    it('should sort cards with same name by creation date (oldest first)', () => {
      const cardsWithSameName: Card[] = [
        {
          ...mockCards[0],
          name: '同じ名前カード',
          createdAt: 1643587200000, // 2022-01-31 (newer)
          paymentMonthShift: 1
        },
        {
          ...mockCards[1],
          name: '同じ名前カード',
          createdAt: 1640995200000, // 2022-01-01 (older)
          paymentMonthShift: 1
        }
      ];
      
      const sorted = sortCardsByPaymentSchedule(cardsWithSameName);
      
      expect(sorted[0].createdAt).toBe(1640995200000); // older first
      expect(sorted[1].createdAt).toBe(1643587200000);
    });

    it('should not mutate the original array', () => {
      const original = [...mockCards];
      sortCardsByPaymentSchedule(mockCards);
      
      expect(mockCards).toEqual(original);
    });

    it('should handle empty array', () => {
      const result = sortCardsByPaymentSchedule([]);
      expect(result).toEqual([]);
    });
  });

  describe('isNextMonthPaymentCard', () => {
    it('should return true for cards with paymentMonthShift === 1', () => {
      const nextMonthCard = mockCards.find(card => card.paymentMonthShift === 1)!;
      expect(isNextMonthPaymentCard(nextMonthCard)).toBe(true);
    });

    it('should return false for cards with paymentMonthShift !== 1', () => {
      const currentMonthCard = mockCards.find(card => card.paymentMonthShift === 0)!;
      const twoMonthsLaterCard = mockCards.find(card => card.paymentMonthShift === 2)!;
      
      expect(isNextMonthPaymentCard(currentMonthCard)).toBe(false);
      expect(isNextMonthPaymentCard(twoMonthsLaterCard)).toBe(false);
    });
  });

  describe('getPaymentScheduleDescription', () => {
    it('should return correct descriptions for different payment shifts', () => {
      const currentMonthCard = mockCards.find(card => card.paymentMonthShift === 0)!;
      const nextMonthCard = mockCards.find(card => card.paymentMonthShift === 1)!;
      const twoMonthsLaterCard = mockCards.find(card => card.paymentMonthShift === 2)!;

      expect(getPaymentScheduleDescription(currentMonthCard)).toBe('当月払い');
      expect(getPaymentScheduleDescription(nextMonthCard)).toBe('翌月払い');
      expect(getPaymentScheduleDescription(twoMonthsLaterCard)).toBe('翌々月払い');
    });

    it('should handle unusual payment shifts', () => {
      const unusualCard: Card = {
        ...mockCards[0],
        paymentMonthShift: 5
      };
      
      expect(getPaymentScheduleDescription(unusualCard)).toBe('5ヶ月後払い');
    });
  });
});