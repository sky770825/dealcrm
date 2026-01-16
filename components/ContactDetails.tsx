
import React, { useState, useEffect } from 'react';
import { Contact, Deal, ViewType, Interaction } from '../types';
// AI 功能已停用
import { TAIWAN_DATA } from '../constants';
import { sanitizeInput, validatePhone, validateEmail, logSecurityEvent } from '../utils/security';

interface ContactDetailsProps {
  contact: Contact;
  allContacts: Contact[];
  deals: Deal[];
  onClose: () => void;
  onUpdate: (contact: Contact) => void;
  setActiveView: (view: ViewType) => void;
  setMatcherInitialContact: (contact: Contact | null) => void;
}

const ContactDetails: React.FC<ContactDetailsProps> = ({ 
  contact, 
  onClose, 
  onUpdate, 
  setActiveView,
  setMatcherInitialContact 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Contact>({ ...contact });
  const [aiAnalysis, setAiAnalysis] = useState<{persona: string, resistance: string, tactics: string} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({ type: '備註' as Interaction['type'], content: '', date: new Date().toISOString().split('T')[0] });
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'interactions'>('overview');
  
  const isSeller = editForm.role === 'seller';

  // 鍵盤快捷鍵支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 關閉彈窗
      if (e.key === 'Escape' && !isEditing) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, onClose]);

  // 解析地區 - 安全處理
  const parseArea = (area?: string) => {
    if (!area || area.length < 3) return { city: '台北市', district: '' };
    // 嘗試匹配縣市（通常是前2-3個字）
    const cities = Object.keys(TAIWAN_DATA);
    for (const c of cities) {
      if (area.startsWith(c)) {
        return { city: c, district: area.substring(c.length) };
      }
    }
    // 如果無法匹配，使用前3字作為城市
    return { city: area.substring(0, 3), district: area.substring(3) };
  };

  const [city, setCity] = useState(() => {
    const parsed = parseArea(editForm.preferredArea);
    return parsed.city;
  });
  const [district, setDistrict] = useState(() => {
    const parsed = parseArea(editForm.preferredArea);
    return parsed.district;
  });

  useEffect(() => {
    setEditForm({ ...contact });
    const parsed = parseArea(contact.preferredArea);
    setCity(parsed.city);
    setDistrict(parsed.district);
    setAiAnalysis(null);
  }, [contact]);

  const handleAiTactics = async () => {
    setIsAnalyzing(true);
    try {
      const { getClosingTactics } = await import('../services/aiService');
      const analysis = await getClosingTactics(editForm);
      setAiAnalysis(analysis);
    } catch (error: any) {
      alert(`AI 分析失敗：${error.message || '請檢查 AI 模型設定'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    // 基本驗證
    if (!editForm.name.trim()) {
      alert('請輸入客戶姓名');
      return;
    }
    if (!editForm.phone.trim()) {
      alert('請輸入聯絡電話');
      return;
    }
    
    // 安全驗證和清理
    const sanitizedName = sanitizeInput(editForm.name.trim());
    const sanitizedPhone = editForm.phone.trim();
    
    if (!validatePhone(sanitizedPhone)) {
      alert('電話號碼格式不正確，請輸入正確的手機號碼（例如：0912-345-678）');
      return;
    }
    
    if (editForm.email && !validateEmail(editForm.email)) {
      alert('Email 格式不正確');
      return;
    }
    
    if (editForm.gmail && !validateEmail(editForm.gmail)) {
      alert('Gmail 格式不正確');
      return;
    }
    
    if (!editForm.budget || editForm.budget <= 0) {
      alert('請輸入有效的預算金額');
      return;
    }
    
    // 清理所有輸入
    const updatedContact = {
      ...editForm,
      name: sanitizedName,
      phone: sanitizedPhone,
      email: editForm.email ? sanitizeInput(editForm.email) : '',
      gmail: editForm.gmail ? sanitizeInput(editForm.gmail) : '',
      lineId: editForm.lineId ? sanitizeInput(editForm.lineId.trim()) : '',
      lineName: editForm.lineName ? sanitizeInput(editForm.lineName.trim()) : '',
      officialAccount: editForm.officialAccount ? sanitizeInput(editForm.officialAccount.trim()) : '',
      birthday: editForm.birthday || '',
      transportConvenience: editForm.transportConvenience ? sanitizeInput(editForm.transportConvenience.trim()) : '',
      nearbyFacilities: editForm.nearbyFacilities ? sanitizeInput(editForm.nearbyFacilities.trim()) : '',
      preferredArea: `${city}${district}`.trim() || '台北市大安區',
      requirement: sanitizeInput(editForm.requirement || ''),
      tags: (editForm.tags || []).map(t => sanitizeInput(t))
    };
    
    onUpdate(updatedContact);
    setIsEditing(false);
    setActiveTab('overview'); // 保存後回到總覽頁
    
    // 記錄操作
    logSecurityEvent('CONTACT_UPDATED', `更新客戶：${sanitizedName}`);
  };

  // 鍵盤快捷鍵支持（在 handleSave 定義之後）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 關閉彈窗
      if (e.key === 'Escape' && !isEditing) {
        onClose();
      }
      // Ctrl/Cmd + S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isEditing) {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, onClose]);

  const handleFooterAction = () => {
    if (isSeller) {
      setActiveView('marketing-studio');
    } else {
      setMatcherInitialContact(contact);
      setActiveView('property-matcher');
    }
    onClose();
  };

  const handleAddInteraction = () => {
    if (!newInteraction.content.trim()) {
      alert('請輸入互動內容');
      return;
    }
    // 清理互動內容
    const cleanedContent = sanitizeInput(newInteraction.content.trim());
    const interaction: Interaction = {
      id: `int-${Date.now()}`,
      ...newInteraction,
      content: cleanedContent
    };
    const updatedContact = {
      ...editForm,
      interactions: [interaction, ...editForm.interactions],
      lastContacted: newInteraction.date
    };
    onUpdate(updatedContact);
    setEditForm(updatedContact);
    setNewInteraction({ type: '備註', content: '', date: new Date().toISOString().split('T')[0] });
    setShowAddInteraction(false);
    logSecurityEvent('INTERACTION_ADDED', `新增互動：${interaction.type}`);
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex justify-end z-[100] animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isEditing) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-6xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
        
        {/* Header */}
        <header className={`px-4 lg:px-6 py-4 lg:py-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm ${
          isSeller ? 'bg-gradient-to-r from-indigo-50/95 to-purple-50/95' : 'bg-gradient-to-r from-blue-50/95 to-cyan-50/95'
        }`}>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className={`w-12 h-12 rounded-lg text-white flex items-center justify-center text-xl font-semibold shadow-sm ${
              isSeller ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-cyan-600'
            }`}>
              {isSeller ? '🏠' : '🎯'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                 {isEditing ? (
                   <input className="text-lg font-semibold text-slate-900 bg-white px-3 py-1.5 rounded-lg outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                 ) : (
                   <h3 className="text-xl font-semibold text-slate-900">{editForm.name}</h3>
                 )}
                 <span className={`px-2.5 py-1 rounded text-sm font-medium uppercase border whitespace-nowrap ${
                   isSeller ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                 }`}>
                   {isSeller ? '賣方' : '買方'}
                 </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <p className="text-sm font-medium text-slate-600 whitespace-nowrap">{editForm.phone}</p>
                {editForm.lastContacted && (
                  <>
                    <span className="text-slate-300">•</span>
                    <p className="text-sm font-medium text-slate-500 whitespace-nowrap">最後聯絡：{editForm.lastContacted}</p>
                  </>
                )}
                {editForm.interactions && editForm.interactions.length > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <p className="text-sm font-medium text-slate-500 whitespace-nowrap">{editForm.interactions.length} 筆互動</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 if (editForm.phone) {
                   window.location.href = `tel:${editForm.phone}`;
                 }
               }}
               className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
               title="撥打電話"
             >
               <span>📞</span>
               <span className="hidden sm:inline">撥打</span>
             </button>
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 if (editForm.phone) {
                   window.open(`https://line.me/ti/p/~${editForm.phone}`, '_blank');
                 }
               }}
               className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
               title="開啟 LINE"
             >
               <span>💬</span>
               <span className="hidden sm:inline">LINE</span>
             </button>
             <button onClick={handleAiTactics} disabled={isAnalyzing || isEditing} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-30 shadow-sm whitespace-nowrap">
                {isAnalyzing ? '分析中...' : '✨ AI'}
             </button>
             <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm whitespace-nowrap ${isEditing ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`} title={isEditing ? '儲存 (Ctrl+S)' : '編輯'}>
                {isEditing ? '💾 儲存' : '✏️ 編輯'}
             </button>
             <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500 text-lg font-medium hover:bg-slate-200 transition-colors flex-shrink-0">&times;</button>
          </div>
        </header>

        {/* 標籤頁導航 */}
        {!isEditing && (
          <div className="border-b border-slate-200 bg-white px-4 lg:px-6">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 總覽
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                  activeTab === 'details'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                📝 詳細資料
              </button>
              <button
                onClick={() => setActiveTab('interactions')}
                className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                  activeTab === 'interactions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                💬 互動紀錄 ({editForm.interactions?.length || 0})
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-5 pb-20 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
           
           {/* AI 成交攻略區塊 - 只在總覽頁顯示 */}
           {aiAnalysis && !isEditing && activeTab === 'overview' && (
             <section className="bg-slate-900 rounded-2xl p-6 lg:p-8 text-white shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full"></div>
                <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">✨</span>
                      <h3 className="text-lg font-bold">AI 成交攻略</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                         <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">性格畫像</p>
                         <p className="text-base font-semibold">{aiAnalysis.persona}</p>
                      </div>
                      <div className="space-y-2">
                         <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">核心抗拒點</p>
                         <p className="text-base font-semibold">{aiAnalysis.resistance}</p>
                      </div>
                      <div className="md:col-span-3 pt-4 border-t border-white/20">
                         <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">建議攻防戰術</p>
                         <p className="text-sm font-medium text-slate-300 leading-relaxed">「{aiAnalysis.tactics}」</p>
                      </div>
                   </div>
                </div>
             </section>
           )}

           {/* 總覽頁內容 - 顯示核心資訊摘要 */}
           {(!isEditing && activeTab === 'overview') && (
             <>
               {/* 核心資訊卡片 */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className={`rounded-xl p-4 border-2 shadow-sm ${
                   isSeller ? 'bg-indigo-50 border-indigo-200' : 'bg-blue-50 border-blue-200'
                 }`}>
                   <p className="text-xs font-medium text-slate-600 mb-1">{isSeller ? '開價' : '預算'}</p>
                   <p className={`text-2xl font-bold ${isSeller ? 'text-indigo-600' : 'text-blue-600'}`}>
                     {editForm.budget?.toLocaleString()} 萬
                   </p>
                 </div>
                 <div className="rounded-xl p-4 bg-white border-2 border-slate-200 shadow-sm">
                   <p className="text-xs font-medium text-slate-600 mb-1">目標區域</p>
                   <p className="text-lg font-semibold text-slate-900">{editForm.preferredArea || '未設定'}</p>
                 </div>
                 <div className="rounded-xl p-4 bg-white border-2 border-slate-200 shadow-sm">
                   <p className="text-xs font-medium text-slate-600 mb-1">狀態</p>
                   <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                     editForm.status.includes('已結案') ? 'bg-emerald-100 text-emerald-700' :
                     editForm.status.includes('委託') ? 'bg-indigo-100 text-indigo-700' :
                     editForm.status.includes('潛在') ? 'bg-blue-100 text-blue-700' :
                     'bg-slate-100 text-slate-700'
                   }`}>
                     {editForm.status}
                   </span>
                 </div>
               </div>
             </>
           )}

           {/* 詳細資料頁或編輯模式 - 顯示完整表單 */}
           {((!isEditing && activeTab === 'details') || isEditing) && (
             <>
           {/* 第一區塊：核心條件 (預算、地區、電話) */}
           <section className={`rounded-xl p-4 lg:p-5 border border-slate-200 shadow-sm space-y-4 ${
             isSeller 
               ? 'bg-indigo-50/30 border-indigo-200' 
               : 'bg-blue-50/30 border-blue-200'
           }`}>
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                 <span className="text-lg">{isSeller ? '🏠' : '🎯'}</span>
                 <h4 className={`font-semibold uppercase text-sm tracking-wide whitespace-nowrap ${
                   isSeller ? 'text-indigo-700' : 'text-blue-700'
                 }`}>
                   {isSeller ? '賣方核心資訊' : '買方核心需求'}
                 </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">
                      {isSeller ? '開價 (萬)' : '預算 (萬)'}
                    </label>
                    {isEditing ? (
                      <input type="number" className={`text-xl font-semibold bg-white w-full rounded-lg p-3 outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        isSeller ? 'text-indigo-600' : 'text-blue-600'
                      }`} value={editForm.budget} onChange={e => setEditForm({...editForm, budget: Number(e.target.value)})} />
                    ) : (
                      <p className={`text-xl font-semibold whitespace-nowrap ${isSeller ? 'text-indigo-600' : 'text-blue-600'}`}>
                        {editForm.budget?.toLocaleString()} 萬
                      </p>
                    )}
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">目標區域 (縣市/行政區)</label>
                    {isEditing ? (
                       <div className="grid grid-cols-2 gap-2">
                          <select className="bg-white p-2.5 rounded-lg font-medium text-sm outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={city} onChange={e => { 
                            const newCity = e.target.value;
                            setCity(newCity);
                            const districts = TAIWAN_DATA[newCity] || [];
                            setDistrict(districts[0] || '');
                          }}>
                             {Object.keys(TAIWAN_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select className="bg-white p-2.5 rounded-lg font-medium text-sm outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={district} onChange={e => setDistrict(e.target.value)} disabled={!TAIWAN_DATA[city] || TAIWAN_DATA[city].length === 0}>
                             {TAIWAN_DATA[city]?.map(d => <option key={d} value={d}>{d}</option>) || <option>請先選擇縣市</option>}
                          </select>
                       </div>
                    ) : (
                      <p className="text-lg font-semibold text-slate-900 whitespace-nowrap">{editForm.preferredArea || '未設定'}</p>
                    )}
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">聯絡電話</label>
                    {isEditing ? (
                      <input className="text-base font-medium text-slate-700 bg-white w-full rounded-lg p-2.5 outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                    ) : (
                      <p className="text-lg font-semibold text-slate-900 whitespace-nowrap">{editForm.phone}</p>
                    )}
                 </div>
              </div>
              {/* 聯繫資訊區塊 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Email</label>
                    {isEditing ? (
                      <input type="email" className="text-sm font-medium text-slate-700 bg-white w-full rounded-lg p-2.5 outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                    ) : (
                      <p className="text-sm font-medium text-slate-700">{editForm.email || '--'}</p>
                    )}
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Gmail</label>
                    {isEditing ? (
                      <input type="email" className="text-sm font-medium text-slate-700 bg-white w-full rounded-lg p-2.5 outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.gmail || ''} onChange={e => setEditForm({...editForm, gmail: e.target.value})} />
                    ) : (
                      <p className="text-sm font-medium text-slate-700">{editForm.gmail || '--'}</p>
                    )}
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Line ID</label>
                    {isEditing ? (
                      <input className="text-sm font-medium text-slate-700 bg-white w-full rounded-lg p-2.5 outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.lineId || ''} onChange={e => setEditForm({...editForm, lineId: e.target.value})} />
                    ) : (
                      <p className="text-sm font-medium text-slate-700">{editForm.lineId || '--'}</p>
                    )}
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Line 名稱</label>
                    {isEditing ? (
                      <input className="text-sm font-medium text-slate-700 bg-white w-full rounded-lg p-2.5 outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.lineName || ''} onChange={e => setEditForm({...editForm, lineName: e.target.value})} />
                    ) : (
                      <p className="text-sm font-medium text-slate-700">{editForm.lineName || '--'}</p>
                    )}
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">官方帳號</label>
                    {isEditing ? (
                      <input className="text-sm font-medium text-slate-700 bg-white w-full rounded-lg p-2.5 outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.officialAccount || ''} onChange={e => setEditForm({...editForm, officialAccount: e.target.value})} />
                    ) : (
                      <p className="text-sm font-medium text-slate-700">{editForm.officialAccount || '--'}</p>
                    )}
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">生日</label>
                    {isEditing ? (
                      <input type="date" className="text-sm font-medium text-slate-700 bg-white w-full rounded-lg p-2.5 outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.birthday || ''} onChange={e => setEditForm({...editForm, birthday: e.target.value})} />
                    ) : (
                      <p className="text-sm font-medium text-slate-700">{editForm.birthday || '--'}</p>
                    )}
                 </div>
              </div>
           </section>

           {/* 第二區塊：空間規格需求 (AI 配案核心) */}
           <section className="bg-white rounded-lg p-4 lg:p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                 <span className="text-lg">{isSeller ? '🏛️' : '🏠'}</span>
                 <h4 className="font-semibold text-slate-900 uppercase text-sm tracking-wide whitespace-nowrap">
                   {isSeller ? '物件詳細規格' : '空間與規格需求'}
                 </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-black uppercase">房數需求</p>
                    {isEditing ? (
                       <select className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none" value={editForm.rooms} onChange={e => setEditForm({...editForm, rooms: e.target.value})}>
                          {['1房', '2房', '3房', '4房', '5房+'].map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    ) : (
                       <p className="text-lg font-black text-slate-800">{editForm.rooms || '--'}</p>
                    )}
                 </div>
                 {!isSeller && (
                   <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 font-black uppercase">建築類型</p>
                      {isEditing ? (
                         <select className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none" value={editForm.buildingType} onChange={e => setEditForm({...editForm, buildingType: e.target.value as any})}>
                            {['透天', '公寓', '華廈', '店面', '不限'].map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                      ) : (
                         <p className="text-lg font-black text-slate-800">{editForm.buildingType || '不限'}</p>
                      )}
                   </div>
                 )}
                 <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-black uppercase">建物坪數 (坪)</p>
                    {isEditing ? (
                       <input type="number" className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none" value={editForm.totalSize || 0} onChange={e => setEditForm({...editForm, totalSize: Number(e.target.value)})} />
                    ) : (
                       <p className="text-lg font-black text-slate-800">{editForm.totalSize ? `${editForm.totalSize} 坪` : '--'}</p>
                    )}
                 </div>
                 <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-black uppercase">車位需求</p>
                    {isEditing ? (
                       <select className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none" value={editForm.parkingPref} onChange={e => setEditForm({...editForm, parkingPref: e.target.value as any})}>
                          {['不需要', '坡平', '機械', '不限'].map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                    ) : (
                       <p className="text-lg font-black text-blue-600">{editForm.parkingPref || '尚未註記'}</p>
                    )}
                 </div>
                 <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-black uppercase">樓層偏好</p>
                    {isEditing ? (
                       <select className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none" value={editForm.floorPref} onChange={e => setEditForm({...editForm, floorPref: e.target.value as any})}>
                          {['高樓層', '中樓層', '低樓層', '不限'].map(f => <option key={f} value={f}>{f}</option>)}
                       </select>
                    ) : (
                       <p className="text-lg font-black text-slate-800">{editForm.floorPref || '不限'}</p>
                    )}
                 </div>

                 {/* 更多 AI 細節欄位 */}
                 <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-black uppercase">屋齡限制</p>
                    {isEditing ? (
                       <select className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none" value={editForm.agePref} onChange={e => setEditForm({...editForm, agePref: e.target.value as any})}>
                          {['5年內', '10年內', '20年內', '30年內', '不限'].map(a => <option key={a} value={a}>{a}</option>)}
                       </select>
                    ) : (
                       <p className="text-lg font-black text-slate-800">{editForm.agePref || '不限'}</p>
                    )}
                 </div>
                 <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-black uppercase">方位偏好</p>
                    {isEditing ? (
                       <select className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none" value={editForm.orientation} onChange={e => setEditForm({...editForm, orientation: e.target.value as any})}>
                          {['座北朝南', '座南朝北', '座西朝東', '座東朝西', '不限'].map(o => <option key={o} value={o}>{o}</option>)}
                       </select>
                    ) : (
                       <p className="text-lg font-black text-slate-800">{editForm.orientation || '不限'}</p>
                    )}
                 </div>
                 <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-black uppercase">捷運距離偏好</p>
                    {isEditing ? (
                       <select className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none" value={editForm.mrtDistance} onChange={e => setEditForm({...editForm, mrtDistance: e.target.value as any})}>
                          {['500m內', '1km內', '不限'].map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    ) : (
                       <p className="text-lg font-black text-emerald-600">{editForm.mrtDistance || '不限'}</p>
                    )}
                 </div>
                 <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-black uppercase">陽台需求</p>
                    {isEditing ? (
                       <select className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none" value={editForm.balconyPref} onChange={e => setEditForm({...editForm, balconyPref: e.target.value as any})}>
                          {['必須有陽台', '不限'].map(b => <option key={b} value={b}>{b}</option>)}
                       </select>
                    ) : (
                       <p className="text-lg font-black text-slate-800">{editForm.balconyPref || '不限'}</p>
                    )}
                 </div>
              </div>
              {/* 買方額外偏好 */}
              {!isSeller && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                   <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 whitespace-nowrap">交通便利性</label>
                      {isEditing ? (
                        <input className="w-full bg-white p-2.5 rounded-lg font-medium text-sm outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.transportConvenience || ''} onChange={e => setEditForm({...editForm, transportConvenience: e.target.value})} placeholder="例如：靠近火車站、交流道" />
                      ) : (
                        <p className="text-sm font-medium text-slate-700">{editForm.transportConvenience || '尚未註記'}</p>
                      )}
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 whitespace-nowrap">周邊機能需求</label>
                      {isEditing ? (
                        <input className="w-full bg-white p-2.5 rounded-lg font-medium text-sm outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.nearbyFacilities || ''} onChange={e => setEditForm({...editForm, nearbyFacilities: e.target.value})} placeholder="例如：公園、學區、超市、醫院等" />
                      ) : (
                        <p className="text-sm font-medium text-slate-700">{editForm.nearbyFacilities || '尚未註記'}</p>
                      )}
                   </div>
                </div>
              )}
           </section>

           {/* 第三區塊：開發與備註 (文字描述) */}
           <section className="bg-white rounded-lg p-4 lg:p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                 <span className="text-lg">📝</span>
                 <h4 className="font-semibold text-slate-900 uppercase text-sm tracking-wide whitespace-nowrap">開發詳情與備註</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">核心需求描述 / 抗拒點</label>
                    {isEditing ? (
                      <textarea className="w-full bg-white p-3 rounded-lg font-medium text-sm min-h-[100px] outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={editForm.requirement} onChange={e => setEditForm({...editForm, requirement: e.target.value})} placeholder="例如：在意風水、預算極限、需與長輩同住..." />
                    ) : (
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{editForm.requirement || '無'}</p>
                    )}
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">屋況現況 (僅屋主/案源)</label>
                    {isEditing ? (
                      <textarea className="w-full bg-white p-3 rounded-lg font-medium text-sm min-h-[100px] outline-none border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" value={editForm.propertyCondition || ''} onChange={e => setEditForm({...editForm, propertyCondition: e.target.value})} placeholder="例如：漏水修繕中、空屋隨時可看、目前出租中..." />
                    ) : (
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{editForm.propertyCondition || '尚未註記屋況細節。'}</p>
                    )}
                 </div>
              </div>
           </section>

             </>
           )}

           {/* 互動紀錄頁 */}
           {(!isEditing && activeTab === 'interactions') && (
             <section className="space-y-3">
                <div className="flex items-center justify-between">
                   <h4 className="text-sm font-semibold text-slate-700 whitespace-nowrap">最近互動歷程</h4>
                   <button 
                     onClick={() => setShowAddInteraction(!showAddInteraction)}
                     className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap"
                   >
                     {showAddInteraction ? '取消' : '+ 新增'}
                   </button>
                </div>
                
                {/* 新增互動表單 */}
                {showAddInteraction && (
                  <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 space-y-2.5 animate-in fade-in slide-in-from-top-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                           <label className="text-sm font-medium text-slate-600 mb-1.5 block whitespace-nowrap">互動類型</label>
                           <select 
                              className="w-full bg-white p-2.5 rounded-lg font-medium text-sm outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              value={newInteraction.type}
                              onChange={e => setNewInteraction({...newInteraction, type: e.target.value as Interaction['type']})}
                           >
                              {['電話', 'LINE', '面談', '帶看', '備註'].map(t => <option key={t} value={t}>{t}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-sm font-medium text-slate-600 mb-1.5 block whitespace-nowrap">日期</label>
                           <input 
                              type="date"
                              className="w-full bg-white p-2.5 rounded-lg font-medium text-sm outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              value={newInteraction.date}
                              onChange={e => setNewInteraction({...newInteraction, date: e.target.value})}
                           />
                        </div>
                     </div>
                     <div>
                        <label className="text-sm font-medium text-slate-600 mb-1.5 block whitespace-nowrap">互動內容</label>
                        <textarea 
                           className="w-full bg-white p-3 rounded-lg font-medium text-sm min-h-[100px] outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                           placeholder="記錄本次互動的詳細內容..."
                           value={newInteraction.content}
                           onChange={e => setNewInteraction({...newInteraction, content: e.target.value})}
                        />
                     </div>
                     <div className="flex justify-end gap-2">
                        <button 
                           onClick={() => {
                              setShowAddInteraction(false);
                              setNewInteraction({ type: '備註', content: '', date: new Date().toISOString().split('T')[0] });
                           }}
                           className="px-4 py-2 bg-white text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all border border-slate-200 whitespace-nowrap"
                        >
                           取消
                        </button>
                        <button 
                           onClick={handleAddInteraction}
                           className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap"
                        >
                           儲存
                        </button>
                     </div>
                  </div>
                )}
                
                <div className="space-y-2">
                   {editForm.interactions.length > 0 ? editForm.interactions.map((int, i) => (
                      <div key={int.id || i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-start gap-3">
                         <div className="bg-slate-50 p-2.5 rounded-lg text-lg flex-shrink-0 border border-slate-200">{int.type === '電話' ? '📞' : int.type === '面談' ? '🤝' : int.type === '帶看' ? '👀' : '💬'}</div>
                         <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-600 whitespace-nowrap">{int.date} • {int.type}</p>
                            <p className="text-sm font-medium text-slate-700 mt-1">{int.content}</p>
                         </div>
                      </div>
                   )) : (
                     <div className="text-center py-6 opacity-20 italic font-medium text-sm whitespace-nowrap">暫無互動紀錄</div>
                   )}
                </div>
             </section>
           )}

        </div>

        {/* Footer Actions */}
        <footer className={`p-3 lg:p-4 border-t border-slate-200 flex sticky bottom-0 z-30 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] ${
          isSeller ? 'bg-indigo-50/50' : 'bg-blue-50/50'
        }`}>
          <button 
            disabled={isEditing}
            onClick={handleFooterAction}
            className={`flex-1 text-white py-3 rounded-lg font-semibold text-base transition-all active:scale-95 disabled:opacity-20 shadow-sm whitespace-nowrap ${
              isSeller 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' 
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
            }`}
          >
            {isSeller ? '🚀 生成物件推廣文案' : '🎯 執行智慧配案'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ContactDetails;
