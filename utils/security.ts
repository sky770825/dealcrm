// 安全工具 - 加密、驗證、防護

// 簡單的加密函數（使用 Web Crypto API）
const getEncryptionKey = async (password: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return await crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

// 生成隨機 IV（初始化向量）
const generateIV = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(12));
};

// 加密數據
export const encryptData = async (data: string, password: string): Promise<string> => {
  try {
    const key = await getEncryptionKey(password);
    const iv = generateIV();
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    
    // 將 IV 和加密數據組合：IV (12 bytes) + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // 轉換為 base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('加密失敗:', error);
    throw new Error('數據加密失敗');
  }
};

// 解密數據
export const decryptData = async (encryptedData: string, password: string): Promise<string> => {
  try {
    const key = await getEncryptionKey(password);
    
    // 從 base64 解碼
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // 提取 IV 和加密數據
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('解密失敗:', error);
    throw new Error('數據解密失敗，密碼可能錯誤');
  }
};

// 生成密碼雜湊（用於驗證）
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// 驗證密碼
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

// 清理輸入，防止 XSS
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // 移除危險的 HTML 標籤和腳本
  const div = document.createElement('div');
  div.textContent = input;
  let cleaned = div.innerHTML;
  
  // 移除可能的腳本標籤
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=/gi, '');
  
  return cleaned;
};

// 驗證電話號碼格式
export const validatePhone = (phone: string): boolean => {
  // 台灣手機號碼格式：09xx-xxx-xxx 或 09xxxxxxxx
  const phoneRegex = /^09\d{2}[\s-]?\d{3}[\s-]?\d{3}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
};

// 驗證 email 格式
export const validateEmail = (email: string): boolean => {
  if (!email) return true; // 可選欄位
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 生成安全的隨機字串（用於 token）
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// 節流函數（防止暴力破解）
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// 會話管理
interface SessionData {
  userId: string;
  loginTime: number;
  lastActivity: number;
  token: string;
}

const SESSION_KEY = 'crm_session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 分鐘

export const createSession = (userId: string): SessionData => {
  const session: SessionData = {
    userId,
    loginTime: Date.now(),
    lastActivity: Date.now(),
    token: generateSecureToken()
  };
  
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('會話創建失敗:', error);
  }
  
  return session;
};

export const getSession = (): SessionData | null => {
  try {
    const data = sessionStorage.getItem(SESSION_KEY);
    if (!data) return null;
    
    const session: SessionData = JSON.parse(data);
    
    // 檢查會話是否過期
    if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
      destroySession();
      return null;
    }
    
    // 更新活動時間
    session.lastActivity = Date.now();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    return session;
  } catch (error) {
    console.error('會話讀取失敗:', error);
    return null;
  }
};

export const updateSessionActivity = (): void => {
  const session = getSession();
  if (session) {
    session.lastActivity = Date.now();
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('會話更新失敗:', error);
    }
  }
};

export const destroySession = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('會話銷毀失敗:', error);
  }
};

// 檢查是否有活動會話
export const isSessionValid = (): boolean => {
  return getSession() !== null;
};

// 操作日誌
interface SecurityLog {
  action: string;
  timestamp: number;
  userId: string;
  details?: string;
}

const MAX_LOGS = 100;

export const logSecurityEvent = (action: string, details?: string): void => {
  try {
    const session = getSession();
    const log: SecurityLog = {
      action,
      timestamp: Date.now(),
      userId: session?.userId || 'unknown',
      details
    };
    
    const logs = getSecurityLogs();
    logs.unshift(log);
    
    // 只保留最近的日誌
    if (logs.length > MAX_LOGS) {
      logs.splice(MAX_LOGS);
    }
    
    localStorage.setItem('crm_security_logs', JSON.stringify(logs));
  } catch (error) {
    console.error('安全日誌記錄失敗:', error);
  }
};

export const getSecurityLogs = (): SecurityLog[] => {
  try {
    const data = localStorage.getItem('crm_security_logs');
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('安全日誌讀取失敗:', error);
    return [];
  }
};
