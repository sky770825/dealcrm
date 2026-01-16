// 安全設定組件 - 管理密碼、查看日誌等
import React, { useState } from 'react';
import { hashPassword, verifyPassword, getSecurityLogs, logSecurityEvent } from '../utils/security';

const SecuritySettings: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logs] = useState(getSecurityLogs());

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setChanging(true);

    try {
      // 驗證當前密碼
      const storedHash = localStorage.getItem('crm_password_hash');
      if (!storedHash) {
        setError('系統錯誤：未找到密碼記錄');
        setChanging(false);
        return;
      }

      const isValid = await verifyPassword(currentPassword, storedHash);
      if (!isValid) {
        setError('當前密碼錯誤');
        setChanging(false);
        return;
      }

      // 驗證新密碼
      if (newPassword.length < 6) {
        setError('新密碼長度至少需要 6 個字元');
        setChanging(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('兩次輸入的新密碼不一致');
        setChanging(false);
        return;
      }

      // 更新密碼
      const newHash = await hashPassword(newPassword);
      localStorage.setItem('crm_password_hash', newHash);
      
      setSuccess('密碼已成功更新！');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      logSecurityEvent('PASSWORD_CHANGED', '密碼已更改');
      
      // 3 秒後清除成功訊息
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || '更改密碼失敗');
      logSecurityEvent('PASSWORD_CHANGE_FAILED', error.message);
    } finally {
      setChanging(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-TW');
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">安全設定</h2>
        <p className="text-sm text-slate-600">
          管理登入密碼、查看安全日誌，確保系統安全。
        </p>
      </div>

      {/* 更改密碼 */}
      <div className="border border-slate-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-slate-900 text-base">更改登入密碼</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              當前密碼
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              新密碼（至少 6 個字元）
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              確認新密碼
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              minLength={6}
            />
          </div>
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}
          
          <button
            type="submit"
            disabled={changing}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changing ? '處理中...' : '更新密碼'}
          </button>
        </form>
      </div>

      {/* 安全日誌 */}
      <div className="border border-slate-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-slate-900 text-base">安全日誌</h3>
        <p className="text-xs text-slate-500">
          記錄最近 {logs.length} 次安全相關操作（最多保留 100 筆）
        </p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">尚無日誌記錄</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-900">{log.action}</span>
                  <span className="text-slate-500 text-xs">{formatDate(log.timestamp)}</span>
                </div>
                {log.details && (
                  <p className="text-slate-600 text-xs mt-1">{log.details}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 安全提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 text-sm">安全建議</h4>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>使用強密碼（至少 8 個字元，包含字母和數字）</li>
          <li>定期更改密碼</li>
          <li>不要在公共電腦上登入</li>
          <li>登出後清除瀏覽器數據（如果需要）</li>
          <li>定期匯出數據備份</li>
          <li>不要在瀏覽器控制台輸入敏感資訊</li>
        </ul>
      </div>
    </div>
  );
};

export default SecuritySettings;
