
import React, { useState } from 'react';
import { IncomingLead } from '../types';
import { sanitizeInput, logSecurityEvent } from '../utils/security';
// AI 功能已停用

interface LeadInboxProps {
  leads: IncomingLead[];
  onAccept: (lead: IncomingLead) => void;
  onReject: (id: string) => void;
  onAddLeads: (leads: IncomingLead[]) => void;
}

const LeadInbox: React.FC<LeadInboxProps> = ({ leads, onAccept, onReject, onAddLeads }) => {
  const [magicText, setMagicText] = useState('');
  const [parsing, setParsing] = useState(false);

  const handleMagicPaste = async () => {
    if (!magicText.trim()) return;
    setParsing(true);
    try {
      // 清理輸入
      const cleanedText = sanitizeInput(magicText.trim());
      const { parseRawLead } = await import('../services/aiService');
      const lead = await parseRawLead(cleanedText);
      if (lead) {
        // 清理解析後的資料
        const cleanedLead = {
          ...lead,
          name: sanitizeInput(lead.name || ''),
          phone: sanitizeInput(lead.phone || ''),
          preferredArea: sanitizeInput(lead.preferredArea || ''),
          source: sanitizeInput(lead.source || ''),
          rawContent: cleanedText
        };
        onAccept(cleanedLead);
        setMagicText('');
        alert('AI 解析成功！客戶資料已加入收件匣。');
        
        // 記錄操作
        logSecurityEvent('LEAD_CREATED', `新增進件：${cleanedLead.name}`);
      } else {
        alert('AI 無法解析內容，請檢查格式或手動建立客戶資料。');
      }
    } catch (error: any) {
      const safeError = sanitizeInput(error.message || '請檢查 AI 模型設定');
      alert(`AI 解析失敗：${safeError}`);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* AI 萬能剪貼簿區區 */}
      <section className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl">🪄</div>
          <div>
            <h4 className="font-black text-slate-800">AI 萬能剪貼簿</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Magic Paste Messenger Parser</p>
          </div>
        </div>
        <div className="relative">
          <textarea 
            placeholder="在此貼上 LINE 或其他通訊軟體的對話內容，AI 將自動結構化為潛在客戶資料..."
            className="w-full bg-slate-50 px-8 py-6 rounded-[32px] border-2 border-transparent focus:border-purple-600 outline-none font-bold min-h-[120px] text-sm leading-relaxed transition-all"
            value={magicText}
            onChange={e => setMagicText(e.target.value)}
          />
          <button 
            onClick={handleMagicPaste}
            disabled={parsing}
            className="absolute bottom-4 right-4 bg-purple-600 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-xl hover:bg-purple-700 transition-all flex items-center space-x-2"
          >
            {parsing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>立即解析</span>}
          </button>
        </div>
      </section>

      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[56px] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <h2 className="text-4xl font-black mb-2">待處理進件 ({leads.length})</h2>
            <p className="text-indigo-100 text-sm font-medium opacity-80">入庫前請核對 AI 解析的預算與區域條件是否正確。</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {leads.length > 0 ? leads.map(lead => (
          <div key={lead.id} className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col lg:flex-row gap-10 items-start group">
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${lead.role === 'buyer' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                       {lead.role === 'buyer' ? '🎯' : '🏠'}
                    </div>
                    <div>
                       <div className="flex items-center space-x-2">
                          <h4 className="text-xl font-black text-slate-800">{lead.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${lead.role === 'buyer' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                             {lead.role === 'buyer' ? '買方' : '賣方'}
                          </span>
                       </div>
                       <p className="text-xs text-slate-400 font-bold">{lead.phone} • {lead.source}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-bold text-slate-400">{lead.receivedAt}</p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-2">
                 <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center space-x-2 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400">預算</span>
                    <span className="text-sm font-black text-slate-800">{(lead.budget || 0).toLocaleString()} 萬</span>
                 </div>
                 <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center space-x-2 border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400">區域</span>
                    <span className="text-sm font-black text-slate-800">{lead.preferredArea || '未設定'}</span>
                 </div>
              </div>
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-50 italic text-sm text-slate-500 font-medium">
                 「{lead.rawContent}」
              </div>
            </div>
            <div className="lg:w-64 w-full flex flex-col gap-4">
               <button onClick={() => onAccept(lead)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">核准入庫</button>
               <button onClick={() => onReject(lead.id)} className="w-full bg-white text-slate-300 py-3 rounded-2xl font-black text-xs hover:text-rose-600 hover:bg-rose-50 transition-all">暫時忽略</button>
            </div>
          </div>
        )) : (
          <div className="bg-slate-50 rounded-[56px] py-40 text-center border-2 border-dashed border-slate-200">
             <p className="text-slate-400 font-black uppercase tracking-widest text-sm">目前收件匣是空的</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadInbox;
