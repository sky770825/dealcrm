
export interface Interaction {
  id: string;
  type: '電話' | 'LINE' | '面談' | '帶看' | '備註';
  content: string;
  date: string;
}

export interface IncomingLead {
  id: string;
  source: string;
  name: string;
  phone: string;
  rawContent: string;
  receivedAt: string;
  status: 'pending' | 'processed';
  
  role: 'buyer' | 'seller';
  budget: number;
  preferredArea: string;
  city?: string;
  district?: string;
  purpose?: '自住' | '投資' | '置產' | '換屋';
  urgency?: 'S (極急)' | 'A (積極)' | 'B (一般)' | 'C (觀察)';
  propertyType?: string; 
  layout?: string; 
  
  aiMatchScore?: number;
  potentialMatches?: number;
}

export interface Contact extends Omit<IncomingLead, 'rawContent' | 'receivedAt' | 'aiMatchScore' | 'potentialMatches' | 'status'> {
  email: string;
  requirement: string; 
  status: '潛在買方' | '帶看中' | '議價中' | '開發中 (屋主)' | '委託中' | '已結案' | '無意願';
  lastContacted: string;
  closedDate?: string;
  tags: string[];
  interactions: Interaction[];
  
  // 聯繫資訊擴展
  gmail?: string;              // Gmail 信箱
  lineId?: string;             // Line ID
  lineName?: string;           // Line 名稱
  officialAccount?: string;    // 官方帳號
  birthday?: string;           // 生日 (YYYY-MM-DD)
  
  // 擴展欄位
  contactPerson?: string;     // 聯絡人
  ownerName?: string;         // 屋主姓名
  ownerPhone?: string;        // 屋主聯絡電話
  mrtStation?: string;        // 鄰近捷運站
  nearbySchool?: string;      // 鄰近學區
  propertyCondition?: string; // 屋況描述
  
  rooms?: string; 
  hasParking?: string; 
  parkingPref?: '坡平' | '機械' | '不限' | '不需要';
  floorPref?: '高樓層' | '中樓層' | '低樓層' | '不限';
  agePref?: '5年內' | '10年內' | '20年內' | '30年內' | '不限';
  propertyStatus?: '空屋' | '出租中' | '自住';
  targetCommunity?: string;
  downPayment?: number;
  features?: string[];

  orientation?: '座北朝南' | '座南朝北' | '座西朝東' | '座東朝西' | '不限';
  balconyPref?: '必須有陽台' | '不限';
  mrtDistance?: '500m內' | '1km內' | '不限';

  // 買方建築類型偏好
  buildingType?: '透天' | '公寓' | '華廈' | '店面' | '不限';
  
  // 交通便利性偏好
  transportConvenience?: string;  // 交通便利性需求，如：靠近火車站、交流道等
  
  // 周邊機能偏好
  nearbyFacilities?: string;      // 周邊機能需求，如：公園、學區等

  entrustType?: '專任委託' | '一般委託' | '尚未委託';
  keyStatus?: '有鑰匙' | '管理室' | '需預約' | '屋主開門';
  buildingAge?: number;
  totalSize?: number;
  addressDetail?: string;
}

export interface Deal {
  id: string;
  title: string;
  contactId: string;
  value: number;
  stage: '初次洽談' | '現場帶看' | '要約議價' | '成交簽約' | '結案';
  probability: number;
  expectedClose: string;
}

export type ViewType = 'dashboard' | 'contacts' | 'deals' | 'ai-insights' | 'ai-settings' | 'lead-inbox' | 'agent-tools' | 'short-video' | 'property-matcher' | 'marketing-studio' | 'ai-matcher' | 'data-management' | 'security';
