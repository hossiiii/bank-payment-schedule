# 引落予定ダイアログ設計改善 - 使用例

## 概要

引落予定ダイアログの設計改善により、以下の機能が統一されました：

1. **ScheduleViewModal**: 引落予定表示・編集モーダル（TransactionViewModalと同じデザイン）
2. **ScheduleEditModal**: 引落予定編集専用モーダル
3. **DayTotalModal**: 統合表示モーダル（編集機能付き）

## 実装例

### 1. ScheduleViewModalの使用

```tsx
import { ScheduleViewModal } from '@/components/calendar';

function MyComponent() {
  const [isScheduleViewOpen, setIsScheduleViewOpen] = useState(false);
  const [selectedScheduleItems, setSelectedScheduleItems] = useState<ScheduleItem[]>([]);

  const handleScheduleClick = (scheduleItem: ScheduleItem) => {
    // 引落予定編集モーダルを開く
    setSelectedScheduleItem(scheduleItem);
    setIsScheduleEditOpen(true);
  };

  return (
    <ScheduleViewModal
      isOpen={isScheduleViewOpen}
      onClose={() => setIsScheduleViewOpen(false)}
      onScheduleClick={handleScheduleClick}
      selectedDate={selectedDate}
      scheduleItems={selectedScheduleItems}
      banks={banks}
      cards={cards}
    />
  );
}
```

### 2. ScheduleEditModalの使用

```tsx
import { ScheduleEditModal } from '@/components/calendar';

function MyComponent() {
  const [isScheduleEditOpen, setIsScheduleEditOpen] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduleItem | null>(null);

  const handleScheduleSave = async (scheduleId: string, updates: Partial<ScheduleItem>) => {
    try {
      await updateScheduleItem(scheduleId, updates);
      // 成功時の処理
      setIsScheduleEditOpen(false);
      refreshData();
    } catch (error) {
      console.error('Failed to update schedule item:', error);
    }
  };

  const handleScheduleDelete = async (scheduleId: string) => {
    try {
      await deleteScheduleItem(scheduleId);
      // 成功時の処理
      setIsScheduleEditOpen(false);
      refreshData();
    } catch (error) {
      console.error('Failed to delete schedule item:', error);
    }
  };

  return (
    <>
      {selectedScheduleItem && (
        <ScheduleEditModal
          isOpen={isScheduleEditOpen}
          onClose={() => setIsScheduleEditOpen(false)}
          onSave={handleScheduleSave}
          onDelete={handleScheduleDelete}
          scheduleItem={selectedScheduleItem}
          banks={banks}
          cards={cards}
        />
      )}
    </>
  );
}
```

### 3. DayTotalModalの改修使用

```tsx
import { DayTotalModal } from '@/components/calendar';

function MyComponent() {
  const [isDayTotalOpen, setIsDayTotalOpen] = useState(false);
  const [dayTotalData, setDayTotalData] = useState<DayTotalData | null>(null);

  const handleTransactionClick = (transaction: Transaction) => {
    // 取引編集モーダルを開く
    setSelectedTransaction(transaction);
    setIsTransactionEditOpen(true);
  };

  const handleScheduleClick = (scheduleItem: ScheduleItem) => {
    // 引落予定編集モーダルを開く
    setSelectedScheduleItem(scheduleItem);
    setIsScheduleEditOpen(true);
  };

  return (
    <>
      {dayTotalData && (
        <DayTotalModal
          isOpen={isDayTotalOpen}
          onClose={() => setIsDayTotalOpen(false)}
          onTransactionClick={handleTransactionClick}
          onScheduleClick={handleScheduleClick} // 新機能
          selectedDate={selectedDate}
          dayTotalData={dayTotalData}
          banks={banks}
          cards={cards}
        />
      )}
    </>
  );
}
```

### 4. 統合モーダル管理の例

```tsx
import { useState } from 'react';
import { 
  ScheduleViewModal, 
  ScheduleEditModal, 
  DayTotalModal,
  TransactionViewModal,
  TransactionModal
} from '@/components/calendar';
import { ModalStates, ModalHandlers } from '@/types/calendar';

function CalendarWithModals() {
  // モーダル状態管理
  const [modalStates, setModalStates] = useState<ModalStates>({
    transactionView: false,
    scheduleView: false,
    transactionEdit: false,
    scheduleEdit: false,
    dayTotal: false
  });

  // 選択データ管理
  const [selectedData, setSelectedData] = useState({
    transactions: [] as Transaction[],
    scheduleItems: [] as ScheduleItem[],
    transaction: null as Transaction | null,
    scheduleItem: null as ScheduleItem | null,
    dayTotalData: null as DayTotalData | null,
    selectedDate: new Date()
  });

  // モーダル操作ハンドラ
  const modalHandlers: ModalHandlers = {
    openTransactionView: (transactions: Transaction[]) => {
      setSelectedData(prev => ({ ...prev, transactions }));
      setModalStates(prev => ({ ...prev, transactionView: true }));
    },
    
    openScheduleView: (scheduleItems: ScheduleItem[]) => {
      setSelectedData(prev => ({ ...prev, scheduleItems }));
      setModalStates(prev => ({ ...prev, scheduleView: true }));
    },
    
    openTransactionEdit: (transaction?: Transaction) => {
      setSelectedData(prev => ({ ...prev, transaction }));
      setModalStates(prev => ({ ...prev, transactionEdit: true }));
    },
    
    openScheduleEdit: (scheduleItem: ScheduleItem) => {
      setSelectedData(prev => ({ ...prev, scheduleItem }));
      setModalStates(prev => ({ ...prev, scheduleEdit: true }));
    },
    
    openDayTotal: (dayTotalData: DayTotalData) => {
      setSelectedData(prev => ({ ...prev, dayTotalData }));
      setModalStates(prev => ({ ...prev, dayTotal: true }));
    },
    
    closeAll: () => {
      setModalStates({
        transactionView: false,
        scheduleView: false,
        transactionEdit: false,
        scheduleEdit: false,
        dayTotal: false
      });
    }
  };

  const closeModal = (modalName: keyof ModalStates) => {
    setModalStates(prev => ({ ...prev, [modalName]: false }));
  };

  return (
    <>
      {/* メインコンテンツ */}
      <CalendarView
        onDayClick={(dayTotalData) => modalHandlers.openDayTotal(dayTotalData)}
        onTransactionGroupClick={(transactions) => modalHandlers.openTransactionView(transactions)}
        onScheduleGroupClick={(scheduleItems) => modalHandlers.openScheduleView(scheduleItems)}
      />

      {/* モーダル群 */}
      
      {/* 統合表示モーダル */}
      {modalStates.dayTotal && selectedData.dayTotalData && (
        <DayTotalModal
          isOpen={modalStates.dayTotal}
          onClose={() => closeModal('dayTotal')}
          onTransactionClick={modalHandlers.openTransactionEdit}
          onScheduleClick={modalHandlers.openScheduleEdit}
          selectedDate={selectedData.selectedDate}
          dayTotalData={selectedData.dayTotalData}
          banks={banks}
          cards={cards}
        />
      )}

      {/* 取引表示モーダル */}
      {modalStates.transactionView && (
        <TransactionViewModal
          isOpen={modalStates.transactionView}
          onClose={() => closeModal('transactionView')}
          onTransactionClick={modalHandlers.openTransactionEdit}
          selectedDate={selectedData.selectedDate}
          transactions={selectedData.transactions}
          banks={banks}
          cards={cards}
        />
      )}

      {/* 引落予定表示モーダル */}
      {modalStates.scheduleView && (
        <ScheduleViewModal
          isOpen={modalStates.scheduleView}
          onClose={() => closeModal('scheduleView')}
          onScheduleClick={modalHandlers.openScheduleEdit}
          selectedDate={selectedData.selectedDate}
          scheduleItems={selectedData.scheduleItems}
          banks={banks}
          cards={cards}
        />
      )}

      {/* 取引編集モーダル */}
      {modalStates.transactionEdit && (
        <TransactionModal
          isOpen={modalStates.transactionEdit}
          onClose={() => closeModal('transactionEdit')}
          onSave={handleTransactionSave}
          onDelete={handleTransactionDelete}
          selectedDate={selectedData.selectedDate}
          transaction={selectedData.transaction}
          banks={banks}
          cards={cards}
        />
      )}

      {/* 引落予定編集モーダル */}
      {modalStates.scheduleEdit && selectedData.scheduleItem && (
        <ScheduleEditModal
          isOpen={modalStates.scheduleEdit}
          onClose={() => closeModal('scheduleEdit')}
          onSave={handleScheduleSave}
          onDelete={handleScheduleDelete}
          scheduleItem={selectedData.scheduleItem}
          banks={banks}
          cards={cards}
        />
      )}
    </>
  );
}
```

## 設計のポイント

### 1. UI一貫性
- 全てのモーダルでBaseModalを使用
- TransactionViewModalとScheduleViewModalで同じデザインパターン
- テーマ色による視覚的分離（緑=取引、青=引落予定）

### 2. 機能分離
- 表示専用モーダル（ViewModal）と編集専用モーダル（EditModal）の分離
- DayTotalModalは統合表示のみ、詳細編集は各専用モーダルで実行

### 3. 型安全性
- 全てのイベントハンドラとデータ型を明確に定義
- TypeScriptの型チェックによる安全性確保

### 4. パフォーマンス
- React.memoによるコンポーネント最適化
- useCallbackによるイベントハンドラ最適化
- useMemoによるデータ変換ロジック最適化

### 5. エラーハンドリング
- フォームバリデーション
- API呼び出し時のエラー処理
- ユーザーフレンドリーなエラーメッセージ

この設計により、引落予定ダイアログが取引ダイアログと同様の使いやすさと一貫性を持ち、ユーザーエクスペリエンスが大幅に向上します。