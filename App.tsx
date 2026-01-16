
import React, { useState, useEffect } from 'react';
import { ViewType, Contact, Deal, IncomingLead } from './types';
import { INITIAL_CONTACTS, INITIAL_DEALS, TAIWAN_DATA, SOURCE_OPTIONS } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ContactList from './components/ContactList';
import AIStrategy from './components/AIStrategy';
import AISettings from './components/AISettings';
import ContactDetails from './components/ContactDetails';
import LeadInbox from './components/LeadInbox';
import AgentTools from './components/AgentTools';
import ShortVideoScript from './components/ShortVideoScript';
import DealKanban from './components/DealKanban';
import AIPropertyMatcher from './components/AIPropertyMatcher';
import MarketingStudio from './components/MarketingStudio';
import DataManagement from './components/DataManagement';
import Auth from './components/Auth';
import { saveEncryptedContacts, saveEncryptedDeals, saveEncryptedLeads, loadEncryptedContacts, loadEncryptedDeals, loadEncryptedLeads } from './utils/encryptedStorage';
import { isSessionValid, updateSessionActivity, destroySession, logSecurityEvent } from './utils/security';
import { sanitizeInput, validatePhone, validateEmail } from './utils/security';
// AI 功能已停用

const STORAGE_KEY_CONTACTS = 'gf_crm_contacts_v8';
const STORAGE_KEY_DEALS = 'gf_crm_deals_v8';
const STORAGE_KEY_LEADS = 'gf_crm_leads_v8';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [incomingLeads, setIncomingLeads] = useState<IncomingLead[]>([]);

  // 檢查身份驗證並載入數據
  useEffect(() => {
    const checkAuth = async () => {
      if (isSessionValid()) {
        setIsAuthenticated(true);
        await loadData();
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // 載入加密數據
  const loadData = async () => {
    try {
      const [contactsResult, dealsResult, leadsResult] = await Promise.all([
        loadEncryptedContacts(),
        loadEncryptedDeals(),
        loadEncryptedLeads()
      ]);
      
      if (contactsResult.success && contactsResult.data) {
        setContacts(contactsResult.data);
      } else if (contactsResult.error) {
        console.error('載入客戶資料失敗:', contactsResult.error);
        setContacts(INITIAL_CONTACTS);
      } else {
        setContacts(INITIAL_CONTACTS);
      }
      
      if (dealsResult.success && dealsResult.data) {
        setDeals(dealsResult.data);
      } else if (dealsResult.error) {
        console.error('載入交易資料失敗:', dealsResult.error);
        setDeals(INITIAL_DEALS);
      } else {
        setDeals(INITIAL_DEALS);
      }
      
      if (leadsResult.success && leadsResult.data) {
        setIncomingLeads(leadsResult.data);
      } else if (leadsResult.error) {
        console.error('載入進件資料失敗:', leadsResult.error);
      }
    } catch (error) {
      console.error('載入數據失敗:', error);
    }
  };

  // 監聽活動，更新會話
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const updateActivity = () => {
      updateSessionActivity();
    };
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // 每 5 分鐘檢查一次會話
    const interval = setInterval(() => {
      if (!isSessionValid()) {
        handleLogout();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    await loadData();
    logSecurityEvent('SESSION_STARTED', '會話開始');
  };

  const handleLogout = () => {
    destroySession();
    setIsAuthenticated(false);
    setContacts([]);
    setDeals([]);
    setIncomingLeads([]);
    logSecurityEvent('SESSION_ENDED', '會話結束');
  };

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [matcherInitialContact, setMatcherInitialContact] = useState<Contact | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [parsing, setParsing] = useState(false);
  const [magicText, setMagicText] = useState('');

  const [form, setForm] = useState({
    name: '', phone: '', role: 'buyer' as 'buyer' | 'seller', budget: 2000,
    city: '台北市', district: '大安區', propertyType: '電梯大樓', rooms: '3房',
    hasParking: '坡平', urgency: 'B (一般)' as any, source: '591',
    requirement: '', purpose: '自住' as any, features: [] as string[],
    downPayment: 400, agePref: '10年內' as any, floorPref: '不限' as any,
    orientation: '不限' as any, balconyPref: '不限' as any,
    entrustType: '尚未委託' as any, keyStatus: '屋主開門' as any, totalSize: 0, buildingAge: 0, 
    addressDetail: '', targetCommunity: '', 
    contactPerson: '', ownerName: '', ownerPhone: '', mrtStation: '', nearbySchool: '', propertyCondition: '',
    // 新增聯繫資訊欄位
    email: '', gmail: '', lineId: '', lineName: '', officialAccount: '', birthday: '',
    // 新增買方偏好欄位
    buildingType: '不限' as '透天' | '公寓' | '華廈' | '店面' | '不限', transportConvenience: '', nearbyFacilities: ''
  });

  // 自動保存加密數據
  useEffect(() => {
    if (!isAuthenticated || (contacts.length === 0 && deals.length === 0 && incomingLeads.length === 0)) return;
    
    const saveData = async () => {
      const contactsResult = await saveEncryptedContacts(contacts);
      if (!contactsResult.success && contactsResult.error) {
        console.error('儲存客戶資料失敗:', contactsResult.error);
        if (contactsResult.error.includes('會話無效')) {
          handleLogout();
          return;
        }
        if (contactsResult.error.includes('存儲空間不足')) {
          alert('⚠️ 存儲空間不足！請前往「數據管理」頁面匯出備份並清理數據。');
        }
      }
      
      const dealsResult = await saveEncryptedDeals(deals);
      if (!dealsResult.success && dealsResult.error) {
        console.error('儲存交易資料失敗:', dealsResult.error);
      }
      
      const leadsResult = await saveEncryptedLeads(incomingLeads);
      if (!leadsResult.success && leadsResult.error) {
        console.error('儲存進件資料失敗:', leadsResult.error);
      }
    };
    
    saveData();
  }, [contacts, deals, incomingLeads, isAuthenticated]);

  const handleMagicFill = async () => {
    if (!magicText.trim()) return;
    setParsing(true);
    // AI 功能已停用，請手動填寫表單
    alert('AI 智慧填寫功能已停用，請手動填寫表單。');
    setParsing(false);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基本驗證
    if (!form.name.trim()) {
      alert('請輸入客戶姓名');
      return;
    }
    if (!form.phone.trim()) {
      alert('請輸入聯絡電話');
      return;
    }
    
    // 安全驗證：清理輸入
    const sanitizedName = sanitizeInput(form.name.trim());
    const sanitizedPhone = form.phone.trim();
    
    // 驗證電話號碼格式
    if (!validatePhone(sanitizedPhone)) {
      alert('電話號碼格式不正確，請輸入正確的手機號碼（例如：0912-345-678）');
      return;
    }
    
    // 驗證 email（如果提供）
    if (form.email && !validateEmail(form.email)) {
      alert('Email 格式不正確');
      return;
    }
    
    // 驗證 Gmail（如果提供）
    if (form.gmail && !validateEmail(form.gmail)) {
      alert('Gmail 格式不正確');
      return;
    }
    
    if (!form.budget || form.budget <= 0) {
      alert('請輸入有效的預算金額');
      return;
    }
    
    // 檢查電話號碼重複
    const normalizedPhone = sanitizedPhone.replace(/[-\s]/g, '');
    const duplicate = contacts.find(c => {
      const existingPhone = c.phone?.replace(/[-\s]/g, '');
      return existingPhone === normalizedPhone;
    });
    
    if (duplicate) {
      if (!confirm(`發現重複電話號碼：${duplicate.name}\n\n是否仍要新增此客戶？`)) {
        return;
      }
    }
    
    // 清理所有輸入
    const newContact: Contact = {
      id: Date.now().toString(),
      ...form,
      name: sanitizedName,
      phone: sanitizedPhone,
      email: form.email ? sanitizeInput(form.email) : '',
      gmail: form.gmail ? sanitizeInput(form.gmail) : '',
      lineId: form.lineId ? sanitizeInput(form.lineId.trim()) : '',
      lineName: form.lineName ? sanitizeInput(form.lineName.trim()) : '',
      officialAccount: form.officialAccount ? sanitizeInput(form.officialAccount.trim()) : '',
      birthday: form.birthday || '',
      transportConvenience: form.transportConvenience ? sanitizeInput(form.transportConvenience.trim()) : '',
      nearbyFacilities: form.nearbyFacilities ? sanitizeInput(form.nearbyFacilities.trim()) : '',
      preferredArea: `${form.city}${form.district}`,
      requirement: sanitizeInput(form.requirement || ''),
      status: form.role === 'seller' ? '開發中 (屋主)' : '潛在買方',
      lastContacted: new Date().toISOString().split('T')[0],
      tags: ['手動錄入', form.urgency, ...form.features].filter(Boolean).map(t => sanitizeInput(t)),
      interactions: [{ id: `int-${Date.now()}`, type: '備註', content: '新客戶建檔完成。', date: new Date().toISOString().split('T')[0] }]
    };
    
    setContacts([newContact, ...contacts]);
    setShowAddContact(false);
    resetForm();
    logSecurityEvent('CONTACT_CREATED', `新增客戶：${sanitizedName}`);
  };

  const resetForm = () => {
    setForm({
      name: '', phone: '', role: 'buyer', budget: 2000, city: '台北市', district: '大安區',
      propertyType: '電梯大樓', rooms: '3房', hasParking: '坡平', urgency: 'B (一般)',
      source: '591', requirement: '', purpose: '自住', features: [], downPayment: 400,
      agePref: '10年內', floorPref: '不限', orientation: '不限', balconyPref: '不限',
      entrustType: '尚未委託', keyStatus: '屋主開門', totalSize: 0, buildingAge: 0,
      addressDetail: '', targetCommunity: '',
      contactPerson: '', ownerName: '', ownerPhone: '', mrtStation: '', nearbySchool: '', propertyCondition: '',
      email: '', gmail: '', lineId: '', lineName: '', officialAccount: '', birthday: '',
      buildingType: '不限', transportConvenience: '', nearbyFacilities: ''
    });
    setWizardStep(1);
  };

  // 顯示身份驗證頁面
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <Layout 
      activeView={activeView} 
      setActiveView={setActiveView} 
      onAddClick={() => setShowAddContact(true)} 
      pendingLeadsCount={incomingLeads.length} 
      contacts={contacts}
      onLogout={handleLogout}
    >
      {activeView === 'dashboard' && <Dashboard contacts={contacts} deals={deals} setActiveView={setActiveView} />}
      {activeView === 'contacts' && <ContactList contacts={contacts} onSelect={setSelectedContact} onAddClick={() => setShowAddContact(true)} onDelete={(id) => {
        const contact = contacts.find(c => c.id === id);
        if (confirm('確定要刪除此客戶嗎？此操作無法復原。')) {
          setContacts(prev => prev.filter(c => c.id !== id));
          if (selectedContact?.id === id) {
            setSelectedContact(null);
          }
          if (contact) {
            logSecurityEvent('CONTACT_DELETED', `刪除客戶：${contact.name}`);
          }
        }
      }} />}
      {activeView === 'property-matcher' && <AIPropertyMatcher contacts={contacts} initialBuyer={matcherInitialContact} />}
      {activeView === 'marketing-studio' && <MarketingStudio />}
      {activeView === 'lead-inbox' && <LeadInbox leads={incomingLeads} onAccept={l => setContacts([{id: Date.now().toString(), ...l, email: '', requirement: l.rawContent, status: '潛在買方', lastContacted: new Date().toISOString().split('T')[0], tags: [], interactions: []} as any, ...contacts])} onReject={id => setIncomingLeads(prev => prev.filter(l => l.id !== id))} onAddLeads={newLeads => setIncomingLeads([...newLeads, ...incomingLeads])} />}
      {activeView === 'short-video' && <ShortVideoScript />}
      {activeView === 'agent-tools' && <AgentTools />}
      {activeView === 'deals' && <DealKanban deals={deals} contacts={contacts} onUpdateDeal={d => setDeals(prev => prev.map(old => old.id === d.id ? d : old))} onAddDeal={() => {
        const buyerContacts = contacts.filter(c => c.role === 'buyer');
        if (buyerContacts.length === 0) {
          alert('請先新增買方客戶才能建立交易');
          return;
        }
        const contact = buyerContacts[0];
        const newDeal: Deal = {
          id: `deal-${Date.now()}`,
          title: `${contact.name} - ${contact.preferredArea}`,
          contactId: contact.id,
          value: contact.budget || 0,
          stage: '初次洽談',
          probability: 20,
          expectedClose: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        setDeals([...deals, newDeal]);
        alert('交易已新增！');
      }} />}
      {activeView === 'ai-insights' && <AIStrategy contacts={contacts} deals={deals} />}
      {activeView === 'ai-settings' && (
        <div className="max-w-4xl mx-auto">
          <AISettings />
        </div>
      )}
      {activeView === 'data-management' && (
        <div className="max-w-4xl mx-auto">
          <DataManagement 
            contacts={contacts}
            deals={deals}
            leads={incomingLeads}
            onImport={(data) => {
              setContacts(data.contacts);
              setDeals(data.deals);
              setIncomingLeads(data.leads);
            }}
          />
        </div>
      )}
      
      {selectedContact && (
        <ContactDetails 
          contact={selectedContact} 
          allContacts={contacts} 
          deals={deals} 
          onClose={() => setSelectedContact(null)} 
          onUpdate={u => setContacts(prev => prev.map(c => c.id === u.id ? u : c))} 
          setActiveView={setActiveView}
          setMatcherInitialContact={setMatcherInitialContact}
        />
      )}

      {showAddContact && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 overflow-hidden">
          <div className="bg-white w-full max-w-5xl rounded-lg shadow-xl flex flex-col h-[90vh] animate-in zoom-in-95 duration-500">
             
             <header className="px-4 lg:px-6 py-3 border-b border-slate-200 flex justify-between items-center bg-white">
                <div>
                   <h3 className="text-lg lg:text-xl font-semibold text-slate-900">智慧客戶錄入</h3>
                   <div className="flex items-center gap-1.5 mt-1.5">
                      {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`h-1 w-6 lg:w-8 rounded-full transition-all ${wizardStep >= s ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                      ))}
                      <span className="text-xs font-medium text-slate-500 ml-2">Step {wizardStep} of 4</span>
                   </div>
                </div>
                <button onClick={() => setShowAddContact(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500 text-lg font-medium hover:bg-slate-200 transition-colors">&times;</button>
             </header>

             <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-5">
                
                {wizardStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
                    <section className="bg-blue-50/30 p-4 rounded-lg border border-blue-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">👤</span>
                        <h4 className="font-semibold text-blue-900 uppercase text-xs">核心身分資訊</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600">客戶姓名</label>
                            <input className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="例如：林先生" />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600">聯絡電話</label>
                            <input className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="09xx-xxx-xxx" />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600">客戶角色</label>
                            <div className="flex bg-white p-0.5 rounded-lg border border-slate-200">
                               {['buyer', 'seller'].map(r => (
                                 <button key={r} onClick={() => setForm({...form, role: r as any})} className={`flex-1 py-2 rounded font-medium text-xs transition-all ${form.role === r ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                                    {r === 'buyer' ? '🎯 買方' : '🏠 賣方'}
                                 </button>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600">實際聯絡人 (若不同)</label>
                            <input className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} placeholder="如：林太太、秘書" />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600">Email</label>
                            <input type="email" className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="例如：example@email.com" />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600">Gmail</label>
                            <input type="email" className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.gmail} onChange={e => setForm({...form, gmail: e.target.value})} placeholder="例如：example@gmail.com" />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600">Line ID</label>
                            <input className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.lineId} onChange={e => setForm({...form, lineId: e.target.value})} placeholder="例如：@line123" />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600">Line 名稱</label>
                            <input className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.lineName} onChange={e => setForm({...form, lineName: e.target.value})} placeholder="例如：林先生" />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600">官方帳號</label>
                            <input className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.officialAccount} onChange={e => setForm({...form, officialAccount: e.target.value})} placeholder="例如：@official_account" />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600">生日</label>
                            <input type="date" className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.birthday} onChange={e => setForm({...form, birthday: e.target.value})} />
                         </div>
                      </div>
                    </section>
                  </div>
                )}

                {wizardStep === 2 && (
                   <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
                      <section className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                         <div className="flex items-center gap-2">
                            <span className="text-base">📍</span>
                            <h4 className="font-semibold text-slate-900 uppercase text-xs">區域與地段環境</h4>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                               <label className="text-xs font-medium text-slate-600">目標區域</label>
                               <div className="grid grid-cols-2 gap-2">
                                  <select className="bg-white p-2 rounded-lg font-medium text-sm border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={form.city} onChange={e => {
                                    const newCity = e.target.value;
                                    const districts = TAIWAN_DATA[newCity] || [];
                                    setForm({...form, city: newCity, district: districts[0] || ''});
                                  }}>
                                     {Object.keys(TAIWAN_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                  <select className="bg-white p-2 rounded-lg font-medium text-sm border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={form.district} onChange={e => setForm({...form, district: e.target.value})} disabled={!TAIWAN_DATA[form.city] || TAIWAN_DATA[form.city].length === 0}>
                                     {(TAIWAN_DATA[form.city] || []).map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                               </div>
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-xs font-medium text-slate-600">鄰近捷運站</label>
                               <input className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.mrtStation} onChange={e => setForm({...form, mrtStation: e.target.value})} placeholder="如：台北101站、大安站" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-xs font-medium text-slate-600">明星學區需求</label>
                               <input className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.nearbySchool} onChange={e => setForm({...form, nearbySchool: e.target.value})} placeholder="如：建國中學、師大附中" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-xs font-medium text-slate-600">物件類型</label>
                               <select className="w-full bg-white p-2.5 rounded-lg font-medium text-sm border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={form.propertyType} onChange={e => setForm({...form, propertyType: e.target.value})}>
                                  {['電梯大樓', '透天別墅', '公寓', '華廈', '店面', '土地'].map(t => <option key={t} value={t}>{t}</option>)}
                               </select>
                            </div>
                         </div>
                      </section>
                   </div>
                )}

                {wizardStep === 3 && (
                   <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
                      <section className="bg-emerald-50/30 p-4 rounded-lg border border-emerald-200 space-y-3">
                         <div className="flex items-center gap-2">
                            <span className="text-base">💰</span>
                            <h4 className="font-semibold text-emerald-900 uppercase text-xs">財務與動機</h4>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                               <label className="text-xs font-medium text-slate-600">{form.role === 'buyer' ? '購屋總預算 (萬)' : '期望售價 (萬)'}</label>
                               <input type="number" className="w-full bg-white p-2.5 rounded-lg font-semibold text-lg text-emerald-600 outline-none border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" value={form.budget} onChange={e => setForm({...form, budget: Number(e.target.value)})} />
                            </div>
                            {form.role === 'buyer' && (
                               <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-slate-600">自備款預算 (萬)</label>
                                  <input type="number" className="w-full bg-white p-2.5 rounded-lg font-semibold text-lg text-blue-600 outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={form.downPayment} onChange={e => setForm({...form, downPayment: Number(e.target.value)})} />
                               </div>
                            )}
                            <div className="space-y-1.5">
                               <label className="text-xs font-medium text-slate-600">開發來源</label>
                               <select className="w-full bg-white p-2.5 rounded-lg font-medium text-sm border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                                  {SOURCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                               </select>
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-xs font-medium text-slate-600">急迫度</label>
                               <select className="w-full bg-white p-2.5 rounded-lg font-medium text-sm border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value as any})}>
                                  {['S (極急)', 'A (積極)', 'B (一般)', 'C (觀察)'].map(u => <option key={u} value={u}>{u}</option>)}
                               </select>
                            </div>
                         </div>
                      </section>
                   </div>
                )}

                {wizardStep === 4 && (
                   <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
                      {form.role === 'buyer' ? (
                        <section className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                           <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                              <span className="text-base">✨</span>
                              <h4 className="font-semibold text-slate-900 uppercase text-xs">買方深度需求</h4>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                 <label className="text-xs font-medium text-slate-600">房數偏好</label>
                                 <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                                    {['1房', '2房', '3房', '4房+'].map(r => (
                                      <button key={r} onClick={() => setForm({...form, rooms: r})} className={`flex-1 py-2 rounded font-medium text-xs transition-all ${form.rooms === r ? 'bg-white shadow-sm text-blue-600 border border-blue-200' : 'text-slate-600'}`}>
                                         {r}
                                      </button>
                                    ))}
                                 </div>
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-xs font-medium text-slate-600">建築類型</label>
                                 <select className="w-full bg-white p-2.5 rounded-lg font-medium text-sm border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={form.buildingType} onChange={e => setForm({...form, buildingType: e.target.value as any})}>
                                    {['透天', '公寓', '華廈', '店面', '不限'].map(t => <option key={t} value={t}>{t}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-xs font-medium text-slate-600">車位偏好</label>
                                 <select className="w-full bg-white p-2.5 rounded-lg font-medium text-sm border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value={form.hasParking} onChange={e => setForm({...form, hasParking: e.target.value})}>
                                    {['坡平', '機械', '不限', '不需要'].map(p => <option key={p} value={p}>{p}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-xs font-medium text-slate-600">交通便利性</label>
                                 <input className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.transportConvenience} onChange={e => setForm({...form, transportConvenience: e.target.value})} placeholder="例如：靠近火車站、交流道" />
                              </div>
                              <div className="space-y-1.5 md:col-span-2">
                                 <label className="text-xs font-medium text-slate-600">周邊機能需求</label>
                                 <input className="w-full bg-white p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm" value={form.nearbyFacilities} onChange={e => setForm({...form, nearbyFacilities: e.target.value})} placeholder="例如：公園、學區、超市、醫院等" />
                              </div>
                           </div>
                        </section>
                      ) : (
                        <section className="bg-indigo-50/30 p-4 rounded-lg border border-indigo-200 space-y-3">
                           <div className="flex items-center gap-2 border-b border-indigo-200 pb-2">
                              <span className="text-base">🏛️</span>
                              <h4 className="font-semibold text-indigo-900 uppercase text-xs">屋主/物件詳情</h4>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                 <label className="text-xs font-medium text-slate-600">完整地址 (含門牌樓層)</label>
                                 <input className="w-full bg-white p-2.5 rounded-lg font-medium text-sm border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={form.addressDetail} onChange={e => setForm({...form, addressDetail: e.target.value})} placeholder="xx路xx號xx樓" />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-xs font-medium text-slate-600">委託類型</label>
                                 <select className="w-full bg-white p-2.5 rounded-lg font-medium text-sm border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={form.entrustType} onChange={e => setForm({...form, entrustType: e.target.value as any})}>
                                    {['專任委託', '一般委託', '尚未委託'].map(t => <option key={t} value={t}>{t}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-xs font-medium text-slate-600">屋況簡述 (漏水、修繕現況)</label>
                                 <input className="w-full bg-white p-2.5 rounded-lg font-medium text-sm border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={form.propertyCondition} onChange={e => setForm({...form, propertyCondition: e.target.value})} placeholder="如：現況漏水、剛翻新過" />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-xs font-medium text-slate-600">屋主姓名 (若與客戶名不同)</label>
                                 <input className="w-full bg-white p-2.5 rounded-lg font-medium text-sm border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} placeholder="登記名義人" />
                              </div>
                           </div>
                        </section>
                      )}
                      <div className="space-y-1.5">
                         <label className="text-xs font-medium text-slate-600">重要備註 / 核心抗拒點</label>
                         <textarea className="w-full bg-white p-3 rounded-lg font-medium text-sm min-h-[100px] outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={form.requirement} onChange={e => setForm({...form, requirement: e.target.value})} placeholder="例如：個性急躁、在意風水、預算有彈性..." />
                      </div>
                   </div>
                )}
             </div>

             <footer className="px-4 py-3 bg-white border-t border-slate-200 flex justify-between items-center gap-3">
                <button onClick={() => setWizardStep(prev => Math.max(prev-1, 1))} disabled={wizardStep === 1} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${wizardStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'}`}>← 上一步</button>
                {wizardStep < 4 ? (
                  <button onClick={() => setWizardStep(prev => Math.min(prev+1, 4))} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm shadow-sm hover:bg-blue-700 transition-all">下一步</button>
                ) : (
                  <button onClick={handleManualAdd} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm shadow-sm hover:bg-slate-800 transition-all">🚀 完成錄入</button>
                )}
             </footer>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
