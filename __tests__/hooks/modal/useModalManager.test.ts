import { renderHook, act } from '@testing-library/react';
import { useModalManager } from '../../../src/hooks/modal/useModalManager';

/**
 * useModalManager基本機能テスト
 * フェーズ1リファクタリング後のモーダル管理フック動作確認用
 */
describe('useModalManager - 基本機能テスト', () => {
  describe('基本的なモーダル状態管理', () => {
    it('初期状態では全てのモーダルが閉じていること', () => {
      const { result } = renderHook(() => useModalManager());
      
      expect(result.current.modalStates.dayTotal).toBe(false);
      expect(result.current.modalStates.scheduleView).toBe(false);
      expect(result.current.modalStates.scheduleEdit).toBe(false);
      expect(result.current.modalStates.transactionView).toBe(false);
      expect(result.current.modalStates.transaction).toBe(false);
    });

    it('特定のモーダルを開くことができること', () => {
      const { result } = renderHook(() => useModalManager());
      const mockDate = new Date('2024-02-15');
      const mockDayTotalData = {
        date: '2024-02-15',
        totalAmount: 20000,
        transactionTotal: 15000,
        cardTransactionTotal: 15000,
        bankTransactionTotal: 0,
        scheduleTotal: 5000,
        transactionCount: 1,
        scheduleCount: 1,
        bankGroups: [],
        transactions: [],
        scheduleItems: [],
        hasData: true,
        hasTransactions: true,
        hasCardTransactions: true,
        hasBankTransactions: false,
        hasSchedule: true
      };
      
      act(() => {
        result.current.openDayTotalModal(mockDate, mockDayTotalData);
      });
      
      expect(result.current.modalStates.dayTotal).toBe(true);
      expect(result.current.modalStates.scheduleView).toBe(false);
      expect(result.current.modalStates.scheduleEdit).toBe(false);
      expect(result.current.modalStates.transactionView).toBe(false);
    });

    it('特定のモーダルを閉じることができること', () => {
      const { result } = renderHook(() => useModalManager());
      const mockDate = new Date('2024-02-15');
      const mockScheduleItems = [];
      
      // まずモーダルを開く
      act(() => {
        result.current.openScheduleViewModal(mockDate, mockScheduleItems);
      });
      
      expect(result.current.modalStates.scheduleView).toBe(true);
      
      // モーダルを閉じる
      act(() => {
        result.current.closeScheduleViewModal();
      });
      
      expect(result.current.modalStates.scheduleView).toBe(false);
    });

    it('全てのモーダルを一度に閉じることができること', () => {
      const { result } = renderHook(() => useModalManager());
      const mockDate = new Date('2024-02-15');
      const mockDayTotalData = {
        date: '2024-02-15',
        totalAmount: 20000,
        transactionTotal: 15000,
        cardTransactionTotal: 15000,
        bankTransactionTotal: 0,
        scheduleTotal: 5000,
        transactionCount: 1,
        scheduleCount: 1,
        bankGroups: [],
        transactions: [],
        scheduleItems: [],
        hasData: true,
        hasTransactions: true,
        hasCardTransactions: true,
        hasBankTransactions: false,
        hasSchedule: true
      };
      
      // 複数のモーダルを開く
      act(() => {
        result.current.openDayTotalModal(mockDate, mockDayTotalData);
        result.current.openScheduleViewModal(mockDate, []);
        result.current.openTransactionViewModal(mockDate, []);
      });
      
      expect(result.current.modalStates.dayTotal).toBe(true);
      expect(result.current.modalStates.scheduleView).toBe(true);
      expect(result.current.modalStates.transactionView).toBe(true);
      
      // 全てのモーダルを閉じる
      act(() => {
        result.current.closeAllModals();
      });
      
      expect(result.current.modalStates.dayTotal).toBe(false);
      expect(result.current.modalStates.scheduleView).toBe(false);
      expect(result.current.modalStates.scheduleEdit).toBe(false);
      expect(result.current.modalStates.transactionView).toBe(false);
    });
  });

  describe('複数モーダルの管理', () => {
    it('closeAllModalsが正しく動作すること', () => {
      const { result } = renderHook(() => useModalManager());
      
      // 全てのモーダルを閉じる（初期状態から）
      act(() => {
        result.current.closeAllModals();
      });
      
      expect(result.current.modalStates.dayTotal).toBe(false);
      expect(result.current.modalStates.scheduleEdit).toBe(false);
      expect(result.current.modalStates.scheduleView).toBe(false);
      expect(result.current.modalStates.transactionView).toBe(false);
      expect(result.current.modalStates.transaction).toBe(false);
    });
  });

  describe('データ管理', () => {
    it('selectedDataが正しく初期化されること', () => {
      const { result } = renderHook(() => useModalManager());
      
      expect(result.current.selectedData.date).toBeNull();
      expect(result.current.selectedData.transaction).toBeNull();
      expect(result.current.selectedData.transactions).toEqual([]);
      expect(result.current.selectedData.scheduleItems).toEqual([]);
      expect(result.current.selectedData.scheduleItem).toBeNull();
      expect(result.current.selectedData.dayTotalData).toBeNull();
    });
    
    it('モーダルを開くときに適切なデータが設定されること', () => {
      const { result } = renderHook(() => useModalManager());
      const mockDate = new Date('2024-02-15');
      const mockTransactions = [];
      
      act(() => {
        result.current.openTransactionViewModal(mockDate, mockTransactions);
      });
      
      expect(result.current.selectedData.date).toEqual(mockDate);
      expect(result.current.selectedData.transactions).toEqual(mockTransactions);
      expect(result.current.modalStates.transactionView).toBe(true);
    });
  });
});