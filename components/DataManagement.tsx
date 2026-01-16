// 數據管理組件 - 備份、還原、去重等功能
import React, { useState, useRef } from 'react';
import { Contact, Deal, IncomingLead } from '../types';
import { exportAllData, importAllData, downloadFile, readFile, findDuplicateContacts } from '../utils/storage';

interface DataManagementProps {
  contacts: Contact[];
  deals: Deal[];
  leads: IncomingLead[];
  onImport: (data: { contacts: Contact[]; deals: Deal[]; leads: IncomingLead[] }) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ contacts, deals, leads, onImport }) => {
  const [duplicates, setDuplicates] = useState<Contact[][]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportAllData(contacts, deals, leads);
    const filename = `crm_backup_${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(data, filename, 'application/json');
    alert('數據已成功匯出！');
  };

  const handleImport = async () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await readFile(file);
      const result = importAllData(content);
      
      if (result.success && result.data) {
        if (confirm(`即將匯入 ${result.data.contacts.length} 位客戶、${result.data.deals.length} 筆交易、${result.data.leads.length} 筆進件。\n\n此操作將覆蓋現有數據，確定繼續嗎？`)) {
          onImport(result.data);
          alert('數據匯入成功！');
        }
      } else {
        alert(`匯入失敗：${result.error || '未知錯誤'}`);
      }
    } catch (error: any) {
      alert(`讀取文件失敗：${error.message || '未知錯誤'}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCheckDuplicates = () => {
    const dupes = findDuplicateContacts(contacts);
    setDuplicates(dupes);
    if (dupes.length === 0) {
      alert('✅ 沒有發現重複客戶！');
    }
  };

  const handleMergeContacts = (duplicateGroup: Contact[]) => {
    if (duplicateGroup.length < 2) return;
    
    // 合併邏輯：保留最完整的客戶資料
    const merged = duplicateGroup.reduce((acc, contact) => {
      // 合併所有欄位，優先保留非空值
      Object.keys(contact).forEach(key => {
        const contactKey = key as keyof Contact;
        if (contact[contactKey] && !acc[contactKey]) {
          (acc as any)[contactKey] = contact[contactKey];
        }
      });
      // 合併互動紀錄
      if (contact.interactions) {
        acc.interactions = [...(acc.interactions || []), ...contact.interactions];
      }
      // 合併標籤
      if (contact.tags) {
        acc.tags = [...new Set([...(acc.tags || []), ...contact.tags])];
      }
      return acc;
    }, { ...duplicateGroup[0] } as Contact);
    
    // 移除重複的客戶，只保留合併後的
    if (confirm(`確定要合併這 ${duplicateGroup.length} 位重複客戶嗎？`)) {
      const idsToRemove = duplicateGroup.slice(1).map(c => c.id);
      // 這裡需要調用父組件的更新函數
      alert('合併功能需要從客戶列表頁面操作。請先刪除重複客戶，然後編輯保留的客戶資料。');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">數據管理</h2>
        <p className="text-sm text-slate-600">
          備份、還原數據，檢查重複客戶，確保數據安全。
        </p>
      </div>

      {/* 數據統計 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-medium text-blue-600 mb-1">客戶總數</p>
          <p className="text-2xl font-semibold text-blue-900">{contacts.length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-xs font-medium text-emerald-600 mb-1">交易總數</p>
          <p className="text-2xl font-semibold text-emerald-900">{deals.length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-xs font-medium text-purple-600 mb-1">進件總數</p>
          <p className="text-2xl font-semibold text-purple-900">{leads.length}</p>
        </div>
      </div>

      {/* 備份與還原 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900 text-sm">備份與還原</h3>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            📥 匯出所有數據
          </button>
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? '匯入中...' : '📤 匯入數據'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <p className="text-xs text-slate-500">
          💡 建議定期匯出備份，避免數據丟失。匯入數據將覆蓋現有數據，請謹慎操作。
        </p>
      </div>

      {/* 客戶去重 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">客戶去重</h3>
          <button
            onClick={handleCheckDuplicates}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            🔍 檢查重複
          </button>
        </div>
        
        {duplicates.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-amber-700 font-medium">
              發現 {duplicates.length} 組重複客戶（共 {duplicates.reduce((sum, group) => sum + group.length, 0)} 位）
            </p>
            {duplicates.map((group, idx) => (
              <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-amber-900">
                    電話：{group[0].phone} ({group.length} 位重複)
                  </p>
                  <button
                    onClick={() => handleMergeContacts(group)}
                    className="text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700"
                  >
                    查看詳情
                  </button>
                </div>
                <div className="space-y-1">
                  {group.map(contact => (
                    <div key={contact.id} className="text-xs text-amber-700">
                      • {contact.name} - {contact.preferredArea || '未設定區域'} - {contact.budget || 0} 萬
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 數據清理建議 */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-2 text-sm">數據清理建議</h4>
        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
          <li>定期清理已結案且超過 1 年的交易記錄</li>
          <li>刪除無效或重複的進件記錄</li>
          <li>合併重複的客戶資料</li>
          <li>匯出備份後可清理舊數據以釋放空間</li>
        </ul>
      </div>
    </div>
  );
};

export default DataManagement;
