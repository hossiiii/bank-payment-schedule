'use client';

import React, { useState } from 'react';
import { Modal, ModalBody, ModalFooter, Button } from '@/components/ui';
import { 
  MigrationErrorAction, 
  type DatabaseMigrationError,
  type MigrationErrorRecoveryOptions 
} from '@/lib/database/errors';
import { exportDatabase } from '@/lib/database/operations';
import { VersionManager } from '@/lib/database/versionManager';

export interface MigrationErrorDialogProps {
  isOpen: boolean;
  error: DatabaseMigrationError;
  recoveryOptions?: MigrationErrorRecoveryOptions;
  onAction: (action: MigrationErrorAction) => void;
}

/**
 * Dialog for handling database migration errors
 */
export function MigrationErrorDialog({
  isOpen,
  error,
  recoveryOptions = {
    allowBackup: true,
    allowReset: true,
    allowExport: true
  },
  onAction
}: MigrationErrorDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [selectedAction, setSelectedAction] = useState<MigrationErrorAction | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-schedule-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      VersionManager.recordBackup();
      setExportSuccess(true);
    } catch (err) {
      console.error('Export failed:', err);
      alert('データのエクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAction = (action: MigrationErrorAction) => {
    setSelectedAction(action);
    onAction(action);
  };

  const migrationHistory = VersionManager.getMigrationHistory();
  const recentFailures = migrationHistory.filter(m => !m.success).slice(-3);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => handleAction(MigrationErrorAction.CANCEL)}
      title="データベースの更新エラー"
      size="md"
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <ModalBody>
        <div className="space-y-4">
          {/* Error message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-700 mb-1">
              エラーが発生しました
            </p>
            <p className="text-sm text-red-600">
              {recoveryOptions.customMessage || error.getUserMessage()}
            </p>
            {error.originalError && (
              <details className="mt-2">
                <summary className="text-xs text-red-500 cursor-pointer">
                  詳細情報
                </summary>
                <pre className="mt-1 text-xs text-red-500 overflow-auto">
                  {error.originalError.message}
                </pre>
              </details>
            )}
          </div>

          {/* Version info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              バージョン情報:
            </p>
            <div className="mt-1 text-xs text-gray-500">
              <p>現在: v{error.fromVersion}</p>
              <p>更新先: v{error.toVersion}</p>
            </div>
          </div>

          {/* Recent failures if any */}
          {recentFailures.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-yellow-700 mb-1">
                最近の更新履歴
              </p>
              <div className="space-y-1">
                {recentFailures.map((failure, index) => (
                  <p key={index} className="text-xs text-yellow-600">
                    {new Date(failure.timestamp).toLocaleString('ja-JP')}: 
                    v{failure.from} → v{failure.to} (失敗)
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Recovery options */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              対処方法を選択してください:
            </p>
            
            <div className="space-y-2">
              {recoveryOptions.allowExport && (
                <div className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        データをエクスポート
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        現在のデータをファイルに保存します
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={exportSuccess ? "outline" : "secondary"}
                      onClick={handleExport}
                      isLoading={isExporting}
                      disabled={exportSuccess}
                    >
                      {exportSuccess ? '✓ 完了' : 'エクスポート'}
                    </Button>
                  </div>
                </div>
              )}

              {recoveryOptions.allowBackup && (
                <div className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        バックアップして再試行
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        データをバックアップしてから更新を再試行します
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAction(MigrationErrorAction.BACKUP_AND_RETRY)}
                      disabled={selectedAction !== null}
                    >
                      再試行
                    </Button>
                  </div>
                </div>
              )}

              {recoveryOptions.allowReset && (
                <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-700">
                        データベースをリセット
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ すべてのデータが削除されます
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('本当にすべてのデータを削除してもよろしいですか？この操作は取り消せません。')) {
                          handleAction(MigrationErrorAction.RESET_DATABASE);
                        }
                      }}
                      disabled={selectedAction !== null || !exportSuccess}
                    >
                      リセット
                    </Button>
                  </div>
                  {!exportSuccess && (
                    <p className="text-xs text-red-500 mt-2">
                      ※ リセット前にデータのエクスポートを推奨します
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Help text */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              💡 ヒント: エクスポートしたデータは後で設定画面からインポートできます
            </p>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => handleAction(MigrationErrorAction.CANCEL)}
          disabled={selectedAction !== null && selectedAction !== MigrationErrorAction.CANCEL}
        >
          キャンセル
        </Button>
      </ModalFooter>
    </Modal>
  );
}