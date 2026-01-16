
import React, { useState, useEffect } from 'react';
// AI 功能已停用
import { PropertyFile, GroundingSource } from '../services/geminiService';

type ToolTab = 'prompts' | 'calc' | 'pk' | 'outreach' | 'ai';

const SCENARIO_PRESETS: Record<string, string[]> = {
  '陌生開發 (空屋/屋主)': [
    '物件空置逾三個月，屋主持有稅負擔大',
    '區域實登創高，提醒屋主獲利了結',
    '專任委託即將到期，屋主對前經紀人不滿',
    '屋主為繼承取得，有稅務與流程諮詢需求',
    '鄰居高價成交，詢問是否有售屋意願'
  ],
  '帶看後溫度追蹤 (買方)': [
    '買方對格局滿意，但擔心房貸成數',
    '開價與實登落差 10%，買方還在觀望',
    '買方猶豫中，主因是長輩對風水有微詞',
    '第三次複看，動心但需臨門一腳的理由',
    '買方在意管理費，需強調社區營運優勢'
  ],
  '議價僵持戰術建議': [
    '買賣雙方差距剩 3%，都在等對方先讓',
    '買方自備款極限，屋主惜售不願讓利',
    '物件有小瑕疵，買方以此要求大幅降價',
    '屋主急換屋要現金，但買方慢條斯理比價'
  ],
  '社區開發 (鄰居拜訪)': [
    '社區有新高價成交，詢問對房價看法',
    '討論管委會大型修繕，藉機建立信賴',
    '該社區指名度高，手中已有現成買方',
    '提供社區年度成交行情分析報表'
  ],
  '舊客戶回訪 (祝賀/追蹤)': [
    '慶祝買房三週年，提供最新增值估價',
    '分享近期低利轉貸資訊，協助節省利息',
    '介紹成交案件鄰居，擴大在地服務圈'
  ]
};

const AgentTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolTab>('prompts');

  // --- 1. 提詞工廠狀態 ---
  const [promptTab, setPromptTab] = useState<'renovation' | 'video'>('renovation');
  const [uploadedImage, setUploadedImage] = useState<PropertyFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [aiPromptResult, setAiPromptResult] = useState('');
  const [targetStyle, setTargetStyle] = useState('現代奢華風');

  // --- 2. 成交試算狀態 ---
  const [totalPrice, setTotalPrice] = useState<number>(2500);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(2.185);
  const [loanYears, setLoanYears] = useState<number>(30);
  const [gracePeriod, setGracePeriod] = useState<number>(0); // 寬限期 (年)
  const [isNewYouth, setIsNewYouth] = useState(false); // 新青安模式

  // --- 3. 物件 PK 狀態 ---
  const [pk1, setPk1] = useState('');
  const [pk2, setPk2] = useState('');
  const [pkResult, setPkResult] = useState('');
  const [isComparing, setIsComparing] = useState(false);

  // --- 4. 開發助手狀態 ---
  const [scenario, setScenario] = useState('陌生開發 (空屋/屋主)');
  const [targetInfo, setTargetInfo] = useState('');
  const [outreachResult, setOutreachResult] = useState('');
  const [isOutreaching, setIsOutreaching] = useState(false);

  // --- 5. 房市智庫狀態 ---
  const [marketNews, setMarketNews] = useState('');
  const [newsSources, setNewsSources] = useState<GroundingSource[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // --- 計算邏輯 ---
  const handleToggleNewYouth = () => {
    if (!isNewYouth) {
      setIsNewYouth(true);
      setInterestRate(1.775); // 新青安補貼後利率參考值
      setLoanYears(40);
      setGracePeriod(5);
    } else {
      setIsNewYouth(false);
      setInterestRate(2.185);
      setLoanYears(30);
      setGracePeriod(0);
    }
  };

  const loanAmountTotal = totalPrice * (1 - downPaymentPct / 100);
  const monthlyRate = interestRate / 100 / 12;
  
  // 1. 寬限期支付金額 (純利息)
  const graceMonthlyPayment = Math.round(loanAmountTotal * 10000 * monthlyRate);
  
  // 2. 寬限期後支付金額 (本息平均攤還)
  const remainingMonths = (loanYears - gracePeriod) * 12;
  const afterGraceMonthlyPayment = remainingMonths > 0 
    ? Math.round((loanAmountTotal * 10000 * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / (Math.pow(1 + monthlyRate, remainingMonths) - 1))
    : 0;

  const agentFee = Math.round(totalPrice * 0.02);
  const taxesAndMisc = Math.round(totalPrice * 0.008);

  const handleRunAnalysis = async () => {
    if (!uploadedImage) return;
    setIsAnalyzing(true);
    setAnalysisResult('');
    setAiPromptResult('');
    // AI 功能已停用
    alert('AI 圖片分析功能已停用。');
    setIsAnalyzing(false);
  };

  const handleGeneratePrompt = async () => {
    if (!analysisResult) return;
    setIsGenerating(true);
    // AI 功能已停用
    alert('AI 提詞生成功能已停用。');
    setIsGenerating(false);
  };

  const handleRunPK = async () => {
    if (!pk1.trim() || !pk2.trim()) {
      alert('請輸入兩個物件的詳細資訊');
      return;
    }
    setIsComparing(true);
    try {
      const { compareProperties } = await import('../services/aiService');
      const result = await compareProperties(pk1, pk2);
      setPkResult(result.text);
    } catch (error: any) {
      alert(`AI 比對失敗：${error.message || '請檢查 AI 模型設定'}`);
    } finally {
      setIsComparing(false);
    }
  };

  const handleRunOutreach = async () => {
    if (!scenario.trim() || !targetInfo.trim()) {
      alert('請填寫開發情境和目標對象資訊');
      return;
    }
    setIsOutreaching(true);
    try {
      const { generateOutreachMessage } = await import('../services/aiService');
      const message = await generateOutreachMessage(scenario, targetInfo);
      setOutreachResult(message);
    } catch (error: any) {
      alert(`AI 生成失敗：${error.message || '請檢查 AI 模型設定'}`);
    } finally {
      setIsOutreaching(false);
    }
  };

  const handleRunNews = async () => {
    setIsLoadingNews(true);
    // AI 功能已停用
    alert('AI 房市新聞功能已停用，請自行查閱房市資訊。');
    setIsLoadingNews(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-12 animate-in fade-in duration-700">
      
      {/* 導覽分頁 */}
      <div className="flex bg-slate-900/5 backdrop-blur-xl p-1.5 rounded-[32px] w-fit mx-auto border border-slate-100 shadow-sm overflow-x-auto scrollbar-hide">
        {[
          { id: 'prompts', label: '💡 提詞工廠' },
          { id: 'calc', label: '📊 成交試算' },
          { id: 'pk', label: '🆚 物件 PK' },
          { id: 'outreach', label: '📢 開發助手' },
          { id: 'ai', label: '✨ 房市智庫' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as ToolTab)} 
            className={`px-10 py-4 rounded-[26px] font-black text-xs transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- 1：提詞工廠 --- */}
      {activeTab === 'prompts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">AI 視覺提詞助手</h3>
            <div className="flex bg-slate-50 p-1 rounded-2xl">
               <button onClick={() => { setPromptTab('renovation'); setAnalysisResult(''); setAiPromptResult(''); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${promptTab === 'renovation' ? 'bg-white shadow text-amber-600' : 'text-slate-400'}`}>🏠 虛擬裝修</button>
               <button onClick={() => { setPromptTab('video'); setAnalysisResult(''); setAiPromptResult(''); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${promptTab === 'video' ? 'bg-white shadow text-rose-600' : 'text-slate-400'}`}>🎬 影音導播</button>
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">第一階段：空間現況分析</label>
                {uploadedImage ? (
                  <div className="relative aspect-video rounded-3xl overflow-hidden shadow-md group border border-slate-100">
                     <img src={uploadedImage.data} className="w-full h-full object-cover" />
                     <button onClick={() => { setUploadedImage(null); setAnalysisResult(''); setAiPromptResult(''); }} className="absolute top-4 right-4 bg-black/50 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                  </div>
                ) : (
                  <label className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                     <span className="text-4xl mb-4">📸</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase">點擊上傳物件照片</span>
                     <input type="file" className="hidden" onChange={e => {
                       const file = e.target.files?.[0];
                       if(file) {
                         const reader = new FileReader();
                         reader.onloadend = () => setUploadedImage({ data: reader.result as string, mimeType: file.type, name: file.name });
                         reader.readAsDataURL(file);
                       }
                     }} />
                  </label>
                )}
                <button 
                  onClick={handleRunAnalysis} 
                  disabled={isAnalyzing || !uploadedImage || !!analysisResult} 
                  className={`w-full py-5 rounded-2xl font-black text-xs shadow-md transition-all ${analysisResult ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-900 text-white hover:bg-black disabled:opacity-30'}`}
                >
                  {isAnalyzing ? 'AI 正在分析空間...' : analysisResult ? '✅ 格局分析完成' : '🔍 啟動 AI 視覺分析'}
                </button>
              </div>
              {analysisResult && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-500 pt-4 border-t border-slate-50">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">第二階段：選擇目標風格與生成</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['現代奢華風', '侘寂簡約風', '日系原木風', '美式鄉村風', '奶油溫馨風', '工業loft風'].map(s => (
                         <button 
                           key={s} 
                           onClick={() => setTargetStyle(s)} 
                           className={`py-3 rounded-xl text-[10px] font-black border transition-all ${targetStyle === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}
                         >
                           {s.replace('風', '')}
                         </button>
                       ))}
                    </div>
                  </div>
                  <button 
                    onClick={handleGeneratePrompt} 
                    disabled={isGenerating} 
                    className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all"
                  >
                    {isGenerating ? '正在精煉影像提詞...' : '✨ 生成客製化提詞'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-slate-900 rounded-[48px] p-12 text-white shadow-2xl min-h-[500px] flex flex-col relative overflow-hidden">
             <div className="relative z-10 flex flex-col h-full space-y-10">
                <div className={`transition-all duration-700 ${analysisResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                   <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">AI Vision Analysis</h4>
                   <div className="bg-white/5 border border-white/10 p-6 rounded-[28px]">
                      <p className="text-slate-300 text-sm leading-relaxed italic font-medium">{analysisResult || '等待分析...'}</p>
                   </div>
                </div>
                {aiPromptResult && (
                   <div className="animate-in zoom-in-95 duration-500 space-y-6">
                      <div className="flex justify-between items-center">
                         <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Final Image Prompt (MJ/GenAI)</h5>
                         <button onClick={() => { navigator.clipboard.writeText(aiPromptResult); alert('已複製'); }} className="text-[9px] bg-blue-600 px-3 py-1.5 rounded-lg font-black hover:bg-blue-700">複製提詞</button>
                      </div>
                      <div className="bg-white/10 border-2 border-dashed border-white/10 p-8 rounded-[32px]">
                         <p className="text-xl font-black leading-snug tracking-tight text-white italic">"{aiPromptResult}"</p>
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* --- 2：成交試算 (新青安 + 寬限期) --- */}
      {activeTab === 'calc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">貸款試算參數</h3>
              <button 
                onClick={handleToggleNewYouth}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${isNewYouth ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                {isNewYouth ? '✨ 新青安模式已啟用' : '🏢 切換新青安快選'}
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">房產總價 (萬)</label>
                <input type="number" value={totalPrice} onChange={e => setTotalPrice(Number(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-blue-600 outline-none border-2 border-transparent focus:border-blue-500 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">貸款成數 (%)</label>
                  <input type="number" value={100-downPaymentPct} onChange={e => setDownPaymentPct(100-Number(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-slate-700 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">年利率 (%)</label>
                  <input type="number" step="0.001" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-emerald-600 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">貸款期限 (年)</label>
                  <select value={loanYears} onChange={e => setLoanYears(Number(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-slate-700 outline-none">
                     {[20, 30, 40].map(y => <option key={y} value={y}>{y} 年</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">寬限期 (年)</label>
                  <select value={gracePeriod} onChange={e => setGracePeriod(Number(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-rose-600 outline-none">
                     {[0, 1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} 年</option>)}
                  </select>
                </div>
              </div>

              {isNewYouth && loanAmountTotal > 1000 && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <p className="text-[9px] font-black text-amber-600 uppercase">新青安提醒</p>
                  <p className="text-[10px] text-amber-700 font-bold">新青安貸款上限為 1,000 萬，剩餘部分應改以一般房貸利率試算。</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 rounded-[56px] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full"></div>
            
            <div className="relative z-10 space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className={`p-8 rounded-[40px] border transition-all ${gracePeriod > 0 ? 'bg-white/5 border-white/10' : 'bg-blue-600 border-blue-500 shadow-2xl shadow-blue-600/20'}`}>
                     <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-3">
                       {gracePeriod > 0 ? `第 1-${gracePeriod} 年 (寬限期)` : '每月本息攤還'}
                     </p>
                     <div className="flex items-baseline space-x-2">
                        <span className="text-6xl font-black">{graceMonthlyPayment.toLocaleString()}</span>
                        <span className="text-sm font-bold text-slate-400">元 / 月</span>
                     </div>
                     {gracePeriod > 0 && <p className="text-[10px] text-slate-400 mt-4 font-medium italic">此期間僅支付利息，減輕初期負擔。</p>}
                  </div>

                  {gracePeriod > 0 && (
                    <div className="p-8 rounded-[40px] bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-600/20 animate-in zoom-in-95 duration-500">
                      <p className="text-blue-200 font-black text-[10px] uppercase tracking-widest mb-3">第 {gracePeriod + 1} 年起 (寬限期後)</p>
                      <div className="flex items-baseline space-x-2">
                          <span className="text-6xl font-black">{afterGraceMonthlyPayment.toLocaleString()}</span>
                          <span className="text-sm font-bold text-blue-200">元 / 月</span>
                      </div>
                      <p className="text-[10px] text-blue-100/60 mt-4 font-medium italic">本息平均攤還，建議以此評估收支平衡。</p>
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-4 gap-6 pt-10 border-t border-white/10">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">貸款總額</p>
                    <p className="text-xl font-black text-blue-400">{Math.round(loanAmountTotal).toLocaleString()} 萬</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">首付款</p>
                    <p className="text-xl font-black text-white">{Math.round(totalPrice - loanAmountTotal).toLocaleString()} 萬</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">仲介費 (2%)</p>
                    <p className="text-xl font-black text-emerald-500">{agentFee.toLocaleString()} 萬</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">稅費預估</p>
                    <p className="text-xl font-black text-slate-400">{taxesAndMisc.toLocaleString()} 萬</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 3：物件 PK --- */}
      {activeTab === 'pk' && (
        <div className="space-y-10">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <textarea value={pk1} onChange={e => setPk1(e.target.value)} placeholder="物件 A 詳情..." className="w-full bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm min-h-[200px] outline-none focus:ring-4 focus:ring-blue-100 font-bold" />
              <textarea value={pk2} onChange={e => setPk2(e.target.value)} placeholder="物件 B 詳情..." className="w-full bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm min-h-[200px] outline-none focus:ring-4 focus:ring-blue-100 font-bold" />
           </div>
           <button onClick={handleRunPK} disabled={isComparing || !pk1 || !pk2} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:bg-black transition-all">
              {isComparing ? '正在產出分析報告...' : '🆚 啟動 AI 物件對比'}
           </button>
           {pkResult && (
             <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm animate-in slide-in-from-bottom-8">
                <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed text-lg">{pkResult}</div>
             </div>
           )}
        </div>
      )}

      {/* --- 4：開發助手 --- */}
      {activeTab === 'outreach' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-10">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. 選擇開發情境</label>
                    <select value={scenario} onChange={e => { setScenario(e.target.value); setTargetInfo(''); }} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-slate-700 outline-none border-2 border-transparent focus:border-blue-600 transition-all">
                       {Object.keys(SCENARIO_PRESETS).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                       <span>🔥</span>
                       <span>常見痛點描述 (點擊帶入)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                       {(SCENARIO_PRESETS[scenario] || []).map((preset, idx) => (
                         <button 
                           key={idx} 
                           onClick={() => setTargetInfo(prev => prev ? prev + '，' + preset : preset)}
                           className="text-left bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 p-3 rounded-xl text-[11px] font-bold text-slate-500 transition-all active:scale-95 leading-snug"
                         >
                           {preset}
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. 客戶現況備註</label>
                    <textarea value={targetInfo} onChange={e => setTargetInfo(e.target.value)} placeholder="或手動輸入詳細需求..." className="w-full bg-slate-50 p-6 rounded-[28px] min-h-[120px] outline-none font-bold text-slate-700 border-2 border-transparent focus:border-blue-600" />
                 </div>
                 <button onClick={handleRunOutreach} disabled={isOutreaching || !targetInfo} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-sm shadow-xl hover:bg-blue-700 transition-all">
                    {isOutreaching ? 'AI 正在分析大數據...' : '📢 產出高勝率開發話術'}
                 </button>
              </div>
           </div>
           <div className="bg-slate-900 rounded-[48px] p-12 text-white shadow-2xl overflow-y-auto max-h-[600px] relative">
              {outreachResult ? (
                <div className="relative z-10 space-y-8 animate-in fade-in">
                   <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">AI 建議話術</span>
                      <button onClick={() => { navigator.clipboard.writeText(outreachResult); alert('已複製'); }} className="text-[9px] bg-white/10 px-3 py-1 rounded-lg">複製全文</button>
                   </div>
                   <div className="whitespace-pre-wrap font-bold text-slate-300 leading-relaxed text-sm">{outreachResult}</div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                   <span className="text-6xl">📣</span>
                   <p className="font-black text-xs uppercase tracking-widest">等待文案生成</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* --- 5：房市智庫 --- */}
      {activeTab === 'ai' && (
        <div className="space-y-10">
           <div className="bg-slate-900 rounded-[56px] p-16 text-white text-center space-y-8 shadow-2xl">
              <h2 className="text-5xl font-black italic">房市即時 <span className="text-blue-500">AI 智庫</span></h2>
              <button onClick={handleRunNews} disabled={isLoadingNews} className="bg-white text-slate-900 px-12 py-5 rounded-[28px] font-black text-base shadow-2xl hover:scale-105 transition-all">
                 {isLoadingNews ? '正在掃描聯網數據...' : '✨ 獲取今日房市摘要'}
              </button>
           </div>
           {marketNews && (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-8">
                <div className="lg:col-span-8 bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm">
                   <div className="whitespace-pre-wrap font-medium text-slate-600 leading-relaxed text-lg">{marketNews}</div>
                </div>
                <div className="lg:col-span-4 space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">參考來源</h4>
                   <div className="space-y-4">
                      {newsSources.map((source, idx) => (
                        <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="block bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-600 transition-all">
                           <p className="font-black text-slate-800 text-sm line-clamp-2">{source.title}</p>
                           <p className="text-[10px] text-slate-400 mt-2 truncate">{source.uri}</p>
                        </a>
                      ))}
                   </div>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default AgentTools;
