// 加密存儲工具 - 安全地存儲敏感數據
import { Contact, Deal, IncomingLead } from '../types';
import { encryptData, decryptData, getSession } from './security';

const STORAGE_KEYS = {
  CONTACTS: 'gf_crm_contacts_enc_v1',
  DEALS: 'gf_crm_deals_enc_v1',
  LEADS: 'gf_crm_leads_enc_v1',
  API_KEYS: 'gf_crm_api_keys_enc_v1'
};

// 獲取加密密碼（從會話或生成）
const getEncryptionPassword = async (): Promise<string> => {
  const session = getSession();
  if (!session) {
    throw new Error('會話無效，請重新登入');
  }
  
  // 使用會話 token 作為加密密碼的一部分
  // 實際應用中可以結合用戶密碼的 hash
  const passwordHash = localStorage.getItem('crm_password_hash');
  if (!passwordHash) {
    throw new Error('未找到加密密鑰');
  }
  
  // 結合會話 token 和密碼 hash 生成加密密碼
  return `${passwordHash}_${session.token}`;
};

// 加密存儲數據
export const saveEncryptedContacts = async (contacts: Contact[]): Promise<{ success: boolean; error?: string }> => {
  try {
    const password = await getEncryptionPassword();
    const json = JSON.stringify(contacts);
    const encrypted = await encryptData(json, password);
    localStorage.setItem(STORAGE_KEYS.CONTACTS, encrypted);
    return { success: true };
  } catch (error: any) {
    console.error('加密存儲失敗:', error);
    return { 
      success: false, 
      error: error.message || '加密存儲失敗' 
    };
  }
};

// 解密讀取數據
export const loadEncryptedContacts = async (): Promise<{ success: boolean; data?: Contact[]; error?: string }> => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (!encrypted) {
      return { success: true, data: [] };
    }
    
    const password = await getEncryptionPassword();
    const decrypted = await decryptData(encrypted, password);
    const parsed = JSON.parse(decrypted);
    
    return { 
      success: true, 
      data: Array.isArray(parsed) ? parsed : [] 
    };
  } catch (error: any) {
    // 如果是解密失敗，可能是會話過期，嘗試讀取未加密的舊數據
    try {
      const oldData = localStorage.getItem('gf_crm_contacts_v8');
      if (oldData) {
        const parsed = JSON.parse(oldData);
        if (Array.isArray(parsed)) {
          // 遷移到加密存儲
          await saveEncryptedContacts(parsed);
          return { success: true, data: parsed };
        }
      }
    } catch (e) {
      // 忽略
    }
    
    return { 
      success: false, 
      error: error.message || '解密失敗，請重新登入' 
    };
  }
};

// 交易數據加密存儲
export const saveEncryptedDeals = async (deals: Deal[]): Promise<{ success: boolean; error?: string }> => {
  try {
    const password = await getEncryptionPassword();
    const json = JSON.stringify(deals);
    const encrypted = await encryptData(json, password);
    localStorage.setItem(STORAGE_KEYS.DEALS, encrypted);
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || '加密存儲失敗' 
    };
  }
};

export const loadEncryptedDeals = async (): Promise<{ success: boolean; data?: Deal[]; error?: string }> => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEYS.DEALS);
    if (!encrypted) {
      return { success: true, data: [] };
    }
    
    const password = await getEncryptionPassword();
    const decrypted = await decryptData(encrypted, password);
    const parsed = JSON.parse(decrypted);
    
    return { 
      success: true, 
      data: Array.isArray(parsed) ? parsed : [] 
    };
  } catch (error: any) {
    try {
      const oldData = localStorage.getItem('gf_crm_deals_v8');
      if (oldData) {
        const parsed = JSON.parse(oldData);
        if (Array.isArray(parsed)) {
          await saveEncryptedDeals(parsed);
          return { success: true, data: parsed };
        }
      }
    } catch (e) {
      // 忽略
    }
    
    return { 
      success: false, 
      error: error.message || '解密失敗' 
    };
  }
};

// 進件數據加密存儲
export const saveEncryptedLeads = async (leads: IncomingLead[]): Promise<{ success: boolean; error?: string }> => {
  try {
    const password = await getEncryptionPassword();
    const json = JSON.stringify(leads);
    const encrypted = await encryptData(json, password);
    localStorage.setItem(STORAGE_KEYS.LEADS, encrypted);
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || '加密存儲失敗' 
    };
  }
};

export const loadEncryptedLeads = async (): Promise<{ success: boolean; data?: IncomingLead[]; error?: string }> => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEYS.LEADS);
    if (!encrypted) {
      return { success: true, data: [] };
    }
    
    const password = await getEncryptionPassword();
    const decrypted = await decryptData(encrypted, password);
    const parsed = JSON.parse(decrypted);
    
    return { 
      success: true, 
      data: Array.isArray(parsed) ? parsed : [] 
    };
  } catch (error: any) {
    try {
      const oldData = localStorage.getItem('gf_crm_leads_v8');
      if (oldData) {
        const parsed = JSON.parse(oldData);
        if (Array.isArray(parsed)) {
          await saveEncryptedLeads(parsed);
          return { success: true, data: parsed };
        }
      }
    } catch (e) {
      // 忽略
    }
    
    return { 
      success: false, 
      error: error.message || '解密失敗' 
    };
  }
};

// API Keys 加密存儲
export const saveEncryptedApiKeys = async (keys: Record<string, string>): Promise<{ success: boolean; error?: string }> => {
  try {
    const password = await getEncryptionPassword();
    const json = JSON.stringify(keys);
    const encrypted = await encryptData(json, password);
    localStorage.setItem(STORAGE_KEYS.API_KEYS, encrypted);
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || '加密存儲失敗' 
    };
  }
};

export const loadEncryptedApiKeys = async (): Promise<{ success: boolean; data?: Record<string, string>; error?: string }> => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEYS.API_KEYS);
    if (!encrypted) {
      return { success: true, data: {} };
    }
    
    const password = await getEncryptionPassword();
    const decrypted = await decryptData(encrypted, password);
    const parsed = JSON.parse(decrypted);
    
    return { 
      success: true, 
      data: parsed || {} 
    };
  } catch (error: any) {
    // 嘗試讀取未加密的舊數據
    try {
      const oldData = localStorage.getItem('ai_api_keys');
      if (oldData) {
        const parsed = JSON.parse(oldData);
        if (typeof parsed === 'object') {
          await saveEncryptedApiKeys(parsed);
          return { success: true, data: parsed };
        }
      }
    } catch (e) {
      // 忽略
    }
    
    return { 
      success: false, 
      error: error.message || '解密失敗' 
    };
  }
};
