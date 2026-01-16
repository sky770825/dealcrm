// 身份驗證組件
import React, { useState, useEffect } from 'react';
import { hashPassword, verifyPassword, createSession, logSecurityEvent } from '../utils/security';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // 檢查是否已經設置密碼
    const hasPassword = localStorage.getItem('crm_password_hash');
    if (!hasPassword) {
      setIsLogin(false); // 第一次使用需要設置密碼
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin) {
        // 註冊/設置密碼
        if (!password || password.length < 6) {
          setError('密碼長度至少需要 6 個字元');
          setLoading(false);
          return;
        }
        
        if (password !== confirmPassword) {
          setError('兩次輸入的密碼不一致');
          setLoading(false);
          return;
        }

        const hash = await hashPassword(password);
        localStorage.setItem('crm_password_hash', hash);
        
        // 創建會話
        createSession('admin');
        logSecurityEvent('PASSWORD_SET', '密碼設置成功');
        
        onAuthSuccess();
      } else {
        // 登入
        const storedHash = localStorage.getItem('crm_password_hash');
        if (!storedHash) {
          setError('系統尚未設置密碼，請先設置');
          setLoading(false);
          return;
        }

        // 防止暴力破解：5 次失敗後鎖定 15 分鐘
        const lockUntil = localStorage.getItem('crm_lock_until');
        if (lockUntil && parseInt(lockUntil) > Date.now()) {
          const minutes = Math.ceil((parseInt(lockUntil) - Date.now()) / 60000);
          setError(`帳戶已被鎖定，請在 ${minutes} 分鐘後再試`);
          setLoading(false);
          return;
        }

        const isValid = await verifyPassword(password, storedHash);
        
        if (!isValid) {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          
          if (newAttempts >= 5) {
            // 鎖定 15 分鐘
            const lockTime = Date.now() + 15 * 60 * 1000;
            localStorage.setItem('crm_lock_until', lockTime.toString());
            setError('登入失敗次數過多，帳戶已被鎖定 15 分鐘');
            logSecurityEvent('ACCOUNT_LOCKED', `登入失敗 ${newAttempts} 次`);
          } else {
            setError(`密碼錯誤，還有 ${5 - newAttempts} 次機會`);
            logSecurityEvent('LOGIN_FAILED', `剩餘機會：${5 - newAttempts}`);
          }
          setLoading(false);
          return;
        }

        // 登入成功
        createSession('admin');
        setAttempts(0);
        localStorage.removeItem('crm_lock_until');
        logSecurityEvent('LOGIN_SUCCESS', '登入成功');
        
        onAuthSuccess();
      }
    } catch (error: any) {
      setError(error.message || '操作失敗，請重試');
      logSecurityEvent('AUTH_ERROR', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">我超業 CRM</h1>
          <p className="text-slate-600">
            {isLogin ? '請輸入密碼以登入系統' : '請設置您的登入密碼'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder={isLogin ? '請輸入密碼' : '至少 6 個字元'}
              autoFocus
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                確認密碼
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="請再次輸入密碼"
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '處理中...' : isLogin ? '登入' : '設置密碼'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            🔒 您的數據使用 AES-GCM 加密存儲，確保安全性
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
