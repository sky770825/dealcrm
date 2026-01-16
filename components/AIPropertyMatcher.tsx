
import React, { useState, useMemo, useEffect } from 'react';
import { Contact } from '../types';
// AI 功能已停用

interface MatchItem {
  id: string;
  score: number;
  reason: string;
  breakdown: {
    location: number;
    value: number;
    layout: number;
  };
}

interface AIPropertyMatcherProps {
  contacts: Contact[];
  initialBuyer?: Contact | null;
}

const AIPropertyMatcher: React.FC<AIPropertyMatcherProps> = ({ contacts, initialBuyer }) => {
  const buyers = useMemo(() => contacts.filter(c => c.role === 'buyer'), [contacts]);
  const sellers = useMemo(() => contacts.filter(c => c.role === 'seller'), [contacts]);

  const [selectedBuyer, setSelectedBuyer] = useState<Contact | null>(null);
  const [matchResults, setMatchResults] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentAnalyzing, setCurrentAnalyzing] = useState('');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isWideSearch, setIsWideSearch] = useState(false);

  const startMatching = async (buyer: Contact, forceWide: boolean = false) => {
    // 檢查基本資料
    if (!buyer.budget || !buyer.preferredArea) {
      setErrorMsg('⚠️ 客戶資料不全：請先填寫「預算」與「目標區域」，AI 才能進行精準運算。');
      setSelectedBuyer(buyer);
      setMatchResults([]);
      return;
    }

    setErrorMsg(null);
    setSelectedBuyer(buyer);
    setLoading(true);
    setMatchResults([]);
    setProgress(0);
    setIsWideSearch(forceWide);

    // 1. 智慧預過濾邏輯優化
    let potentialSellers = [];
    
    if (forceWide) {
      // 強制模式：取前 15 筆最新物件，不設限
      potentialSellers = sellers.slice(0, 15);
    } else {
      // 標準模式：縣市模糊比對 + 預算彈性 50%
      const buyerCity = buyer.preferredArea?.substring(0, 2) || ''; // 取前兩字如 "台北"
      
      potentialSellers = sellers.filter(s => {
        if (!s.budget || !s.preferredArea) return false;
        const budgetMatch = s.budget <= (buyer.budget * 1.6) && s.budget >= (buyer.budget * 0.6);
        const areaMatch = !buyerCity || (s.preferredArea && s.preferredArea.includes(buyerCity));
        return budgetMatch && areaMatch;
      }).slice(0, 12);
    }

    if (potentialSellers.length === 0) {
      setLoading(false);
      setMatchResults([]);
      return;
    }

    const results: MatchItem[] = [];
    
    for (let i = 0; i < potentialSellers.length; i++) {
      const seller = potentialSellers[i];
      setCurrentAnalyzing(`${seller.name} (${seller.preferredArea})`);
      setProgress(Math.round(((i) / potentialSellers.length) * 100));
      
      try {
        // 嘗試使用 AI 計算匹配分數
        let res;
        try {
          const { calculateMatchScore } = await import('../services/aiService');
          res = await calculateMatchScore(buyer, seller);
        } catch (aiError) {
          // AI 失敗時降級到簡單邏輯
          console.warn('AI 匹配失敗，使用簡單邏輯:', aiError);
          if (!seller.budget || !buyer.budget) {
            res = {
              score: 30,
              reason: '資料不完整，無法進行精準匹配',
              breakdown: { location: 50, value: 50, layout: 50 }
            };
          } else {
            const budgetMatch = seller.budget <= buyer.budget * 1.2 && seller.budget >= buyer.budget * 0.8;
            const areaMatch = seller.preferredArea === buyer.preferredArea;
            const baseScore = (budgetMatch ? 40 : 20) + (areaMatch ? 40 : 20);
            res = {
              score: baseScore,
              reason: `預算${budgetMatch ? '符合' : '需議價'}，區域${areaMatch ? '完全匹配' : '相近'}`,
              breakdown: {
                location: areaMatch ? 80 : 50,
                value: budgetMatch ? 80 : 50,
                layout: 60
              }
            };
          }
        }
        
        results.push({ 
          id: seller.id, 
          score: res.score, 
          reason: res.reason,
          breakdown: res.breakdown
        });
      } catch (err) {
        console.error(`匹配分析失敗:`, err);
        results.push({
          id: seller.id,
          score: 0,
          reason: '匹配分析發生錯誤',
          breakdown: { location: 0, value: 0, layout: 0 }
        });
      }
    }

    setMatchResults(results.sort((a, b) => b.score - a.score));
    setProgress(100);
    setLoading(false);
  };

  useEffect(() => {
    if (initialBuyer) {
      startMatching(initialBuyer);
    }
  }, [initialBuyer]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
      
      {/* 左側：客戶選擇 */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">點擊買方啟動配案</h4>
           <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{buyers.length} 位客戶庫存</span>
        </div>
        <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm max-h-[75vh] overflow-y-auto scrollbar-hide">
          {buyers.map(b => (
            <button 
              key={b.id}
              onClick={() => startMatching(b)}
              className={`w-full p-6 text-left border-b border-slate-50 transition-all relative group ${selectedBuyer?.id === b.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}
            >
              {selectedBuyer?.id === b.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>}
              <div className="flex justify-between items-start">
                 <div>
                    <p className="font-black text-sm">{b.name}</p>
                    <p className={`text-[10px] font-bold mt-1 ${selectedBuyer?.id === b.id ? 'text-slate-400' : 'text-slate-400'}`}>{b.preferredArea || '區域未填'}</p>
                 </div>
                 <p className={`text-[10px] font-black ${selectedBuyer?.id === b.id ? 'text-blue-400' : 'text-blue-600'}`}>{b.budget ? `${b.budget}萬` : '未設預算'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 右側：AI 分析主區塊 */}
      <div className="lg:col-span-2 space-y-8">
        {!selectedBuyer && !loading && (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-[56px] border-2 border-dashed border-slate-200 p-20 text-center space-y-6">
             <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center text-5xl">🎯</div>
             <div>
                <h4 className="text-xl font-black text-slate-800">尚未選擇匹配對象</h4>
                <p className="text-slate-400 text-sm font-medium mt-2 max-w-xs mx-auto">點擊左側買方名單，AI 將根據預算、區域、格局、方位及捷運距離進行全庫房產掃描。</p>
             </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-white border-2 border-rose-100 p-10 rounded-[48px] shadow-sm animate-in zoom-in-95 space-y-6 text-center">
             <span className="text-5xl block">🧩</span>
             <p className="text-slate-800 font-black text-xl">資料完整度不足</p>
             <p className="text-slate-500 text-sm font-bold max-w-sm mx-auto leading-relaxed">{errorMsg}</p>
             <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs">前往編輯資料</button>
          </div>
        )}

        {loading && (
          <div className="bg-slate-900 rounded-[56px] p-20 flex flex-col items-center justify-center text-white space-y-12 shadow-2xl relative overflow-hidden h-[600px]">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/10 to-transparent"></div>
            <div className="relative">
               <div className="w-32 h-32 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-black text-2xl">{progress}%</span>
               </div>
            </div>
            <div className="text-center space-y-4">
               <h4 className="font-black text-sm uppercase tracking-[0.5em] text-blue-400">智慧匹配分析中</h4>
               <p className="text-slate-400 text-sm font-medium italic">「正在計算：{currentAnalyzing} ...」</p>
            </div>
            <div className="w-full max-w-md bg-white/5 h-2 rounded-full overflow-hidden">
               <div className="bg-blue-600 h-full transition-all duration-500 shadow-[0_0_20px_rgba(37,99,235,0.5)]" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {selectedBuyer && !loading && !errorMsg && matchResults.length > 0 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between px-6">
               <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">為 {selectedBuyer.name} 找到 {matchResults.length} 個匹配物件</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">{isWideSearch ? '✨ 已啟用全庫強力匹配模式' : '✅ 已根據地區與預算進行初步過濾'}</p>
               </div>
               <button onClick={() => startMatching(selectedBuyer, true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">不限條件重新配案</button>
            </div>
            
            <div className="space-y-8">
              {matchResults.map((res, idx) => {
                const seller = sellers.find(s => s.id === res.id);
                if (!seller) return null;
                return (
                  <div key={res.id} className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all group relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-12">
                      {/* 分數顯示區 */}
                      <div className="relative flex-shrink-0 flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-32 h-32">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-50" />
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={`${2 * Math.PI * 58}`} strokeDashoffset={`${2 * Math.PI * 58 * (1 - res.score / 100)}`} className="text-blue-600 transition-all duration-1000" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                             <span className="font-black text-4xl text-slate-900 tracking-tighter">{res.score}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">匹配得分</span>
                      </div>

                      <div className="flex-1 space-y-8">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h5 className="text-3xl font-black text-slate-800">{seller.name} 的委託物件</h5>
                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-4 py-1.5 rounded-full">${seller.budget}萬</span>
                          </div>
                          <p className="text-sm font-bold text-slate-400 mt-2">{seller.preferredArea} • {seller.totalSize}坪 • {seller.propertyType} • {seller.buildingAge || '新'}年屋</p>
                        </div>

                        {/* 三維度詳細評分 */}
                        <div className="grid grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[32px] border border-slate-50">
                           {[
                             { label: '地段環境', value: res.breakdown.location, icon: '📍' },
                             { label: '價格空間', value: res.breakdown.value, icon: '💰' },
                             { label: '規格需求', value: res.breakdown.layout, icon: '🏠' }
                           ].map(d => (
                             <div key={d.label} className="space-y-2">
                               <p className="text-[10px] font-black text-slate-400 uppercase flex items-center space-x-2"><span>{d.icon}</span><span>{d.label}</span></p>
                               <div className="flex items-center space-x-3">
                                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                     <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${d.value}%` }}></div>
                                  </div>
                                  <span className="text-xs font-black text-slate-800">{d.value}%</span>
                               </div>
                             </div>
                           ))}
                        </div>

                        <div className="relative">
                          <span className="absolute -top-3 -left-2 text-4xl text-blue-100 font-serif opacity-50">“</span>
                          <p className="text-lg font-bold text-slate-700 leading-relaxed italic relative z-10 pl-4">{res.reason}</p>
                        </div>

                        <div className="flex space-x-4 pt-4">
                           <button className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-sm hover:bg-black shadow-xl transition-all active:scale-95">生成帶看企劃</button>
                           <button className="bg-white text-slate-400 border border-slate-100 px-8 py-5 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">查看物件詳情</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedBuyer && !loading && !errorMsg && matchResults.length === 0 && (
          <div className="bg-white p-24 rounded-[64px] text-center space-y-8 shadow-sm border border-slate-100 animate-in zoom-in-95">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mx-auto">🔎</div>
             <div className="space-y-4">
                <h4 className="text-2xl font-black text-slate-800">標準過濾條件下無匹配物件</h4>
                <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                  該客戶的預算（{selectedBuyer.budget}萬）與目標區域（{selectedBuyer.preferredArea}）在目前的庫存中找不到接近的對象。
                </p>
             </div>
             <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button onClick={() => startMatching(selectedBuyer, true)} className="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black text-base shadow-2xl shadow-blue-100 hover:scale-105 transition-all">
                  🚀 啟動全庫強力匹配
                </button>
                <button onClick={() => setSelectedBuyer(null)} className="bg-slate-100 text-slate-500 px-12 py-5 rounded-3xl font-black text-base">選擇其他買方</button>
             </div>
             <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-8">💡 強力匹配將無視區域限制，讓 AI 挖掘具備增值潛力的物件</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPropertyMatcher;
