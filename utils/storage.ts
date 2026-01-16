// 數據存儲工具 - 增強錯誤處理和備份功能
import { Contact, Deal, IncomingLead } from '../types';

const STORAGE_KEYS = {
  CONTACTS: 'gf_crm_contacts_v8',
  DEALS: 'gf_crm_deals_v8',
  LEADS: 'gf_crm_leads_v8',
  BACKUP: 'gf_crm_backup_v1'
};

// 存儲錯誤處理
const safeSetItem = (key: string, value: string): { success: boolean; error?: string } => {
  try {
    localStorage.setItem(key, value);
    return { success: true };
  } catch (error: any) {
    // 檢查是否是存儲空間不足
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      return { 
        success: false, 
        error: '存儲空間不足。請清理瀏覽器數據或匯出備份後刪除舊數據。' 
      };
    }
    return { 
      success: false, 
      error: `存儲失敗：${error.message || '未知錯誤'}` 
    };
  }
};

const safeGetItem = (key: string): { success: boolean; data?: string; error?: string } => {
  try {
    const data = localStorage.getItem(key);
    return { success: true, data: data || undefined };
  } catch (error: any) {
    return { 
      success: false, 
      error: `讀取失敗：${error.message || '未知錯誤'}` 
    };
  }
};

// 客戶數據操作
export const saveContacts = (contacts: Contact[]): { success: boolean; error?: string } => {
  try {
    const json = JSON.stringify(contacts);
    const result = safeSetItem(STORAGE_KEYS.CONTACTS, json);
    if (!result.success) {
      console.error('保存客戶數據失敗:', result.error);
      // 嘗試清理舊備份
      try {
        localStorage.removeItem(STORAGE_KEYS.BACKUP);
        return safeSetItem(STORAGE_KEYS.CONTACTS, json);
      } catch {
        return result;
      }
    }
    return result;
  } catch (error: any) {
    return { 
      success: false, 
      error: `序列化失敗：${error.message}` 
    };
  }
};

export const loadContacts = (): { success: boolean; data?: Contact[]; error?: string } => {
  const result = safeGetItem(STORAGE_KEYS.CONTACTS);
  if (!result.success || !result.data) {
    return { success: false, error: result.error };
  }
  
  try {
    const parsed = JSON.parse(result.data);
    return { 
      success: true, 
      data: Array.isArray(parsed) ? parsed : [] 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: `解析失敗：${error.message}` 
    };
  }
};

// 交易數據操作
export const saveDeals = (deals: Deal[]): { success: boolean; error?: string } => {
  try {
    const json = JSON.stringify(deals);
    return safeSetItem(STORAGE_KEYS.DEALS, json);
  } catch (error: any) {
    return { 
      success: false, 
      error: `序列化失敗：${error.message}` 
    };
  }
};

export const loadDeals = (): { success: boolean; data?: Deal[]; error?: string } => {
  const result = safeGetItem(STORAGE_KEYS.DEALS);
  if (!result.success || !result.data) {
    return { success: false, error: result.error };
  }
  
  try {
    const parsed = JSON.parse(result.data);
    return { 
      success: true, 
      data: Array.isArray(parsed) ? parsed : [] 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: `解析失敗：${error.message}` 
    };
  }
};

// 進件數據操作
export const saveLeads = (leads: IncomingLead[]): { success: boolean; error?: string } => {
  try {
    const json = JSON.stringify(leads);
    return safeSetItem(STORAGE_KEYS.LEADS, json);
  } catch (error: any) {
    return { 
      success: false, 
      error: `序列化失敗：${error.message}` 
    };
  }
};

export const loadLeads = (): { success: boolean; data?: IncomingLead[]; error?: string } => {
  const result = safeGetItem(STORAGE_KEYS.LEADS);
  if (!result.success || !result.data) {
    return { success: false, error: result.error };
  }
  
  try {
    const parsed = JSON.parse(result.data);
    return { 
      success: true, 
      data: Array.isArray(parsed) ? parsed : [] 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: `解析失敗：${error.message}` 
    };
  }
};

// 匯出所有數據
export const exportAllData = (contacts: Contact[], deals: Deal[], leads: IncomingLead[]): string => {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    contacts,
    deals,
    leads
  };
  return JSON.stringify(data, null, 2);
};

// 匯入數據
export const importAllData = (json: string): { 
  success: boolean; 
  data?: { contacts: Contact[]; deals: Deal[]; leads: IncomingLead[] }; 
  error?: string 
} => {
  try {
    const parsed = JSON.parse(json);
    
    // 驗證數據格式
    if (!parsed.contacts || !Array.isArray(parsed.contacts)) {
      return { success: false, error: '數據格式錯誤：缺少客戶數據' };
    }
    if (!parsed.deals || !Array.isArray(parsed.deals)) {
      return { success: false, error: '數據格式錯誤：缺少交易數據' };
    }
    if (!parsed.leads || !Array.isArray(parsed.leads)) {
      return { success: false, error: '數據格式錯誤：缺少進件數據' };
    }
    
    return {
      success: true,
      data: {
        contacts: parsed.contacts,
        deals: parsed.deals,
        leads: parsed.leads
      }
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: `解析失敗：${error.message}` 
    };
  }
};

// 檢查客戶重複（根據電話號碼）
export const findDuplicateContacts = (contacts: Contact[]): Contact[][] => {
  const phoneMap = new Map<string, Contact[]>();
  
  contacts.forEach(contact => {
    if (contact.phone) {
      const normalizedPhone = contact.phone.replace(/[-\s]/g, '');
      if (!phoneMap.has(normalizedPhone)) {
        phoneMap.set(normalizedPhone, []);
      }
      phoneMap.get(normalizedPhone)!.push(contact);
    }
  });
  
  // 返回所有重複的客戶組
  return Array.from(phoneMap.values()).filter(group => group.length > 1);
};

// 下載文件
export const downloadFile = (content: string, filename: string, mimeType: string = 'application/json') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 讀取文件
export const readFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('讀取文件失敗'));
      }
    };
    reader.onerror = () => reject(new Error('讀取文件時發生錯誤'));
    reader.readAsText(file);
  });
};
