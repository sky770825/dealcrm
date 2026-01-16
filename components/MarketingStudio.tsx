
import React, { useState } from 'react';
// AI 功能已停用
import { PropertyFile } from '../services/geminiService';

type StudioMode = 'staging' | 'poster' | 'video';

const MarketingStudio: React.FC = () => {
  const [mode, setMode] = useState<StudioMode>('staging');
  
  // --- 狀態：虛擬裝修 ---
  const [sourceImg, setSourceImg] = useState<PropertyFile | null>(null);
  const [stagedImg, setStagedImg] = useState<string | null>(null);
  const [stageStyle, setStageStyle] = useState('現代奢華風');
  const [isStaging, setIsStaging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // --- 狀態：行銷海報 ---
  const [posterPrompt, setPosterPrompt] = useState('');
  const [posterImg, setPosterImg] = useState<string | null>(null);
  const [posterRefImg, setPosterRefImg] = useState<PropertyFile | null>(null);
  const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

  // 通用下載函數：解決 window.open 被攔截的問題
  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'source' | 'ref') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = { data: reader.result as string, mimeType: file.type, name: file.name };
      if (target === 'source') {
        setSourceImg(data);
        setStagedImg(null);
      } else {
        setPosterRefImg(data);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunStaging = async () => {
    if (!sourceImg) return;
    setIsStaging(true);
    setShowOriginal(false);
    // AI 功能已停用
    alert('AI 虛擬裝修功能已停用。');
    setIsStaging(false);
  };

  const handleAnalyzePosterRef = async () => {
    if (!posterRefImg) return;
    setIsAnalyzingRef(true);
    // AI 功能已停用
    alert('AI 圖片分析功能已停用，請手動輸入行銷文案。');
    setIsAnalyzingRef(false);
  };

  const handleGeneratePoster = async () => {
    if (!posterPrompt) return;
    setIsGeneratingPoster(true);
    // AI 功能已停用
    alert('AI 行銷圖片生成功能已停用。');
    setIsGeneratingPoster(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-10 animate-in fade-in duration-700">
      
      {/* 模式切換 */}
      <div className="flex bg-slate-900/5 backdrop-blur-xl p-1.5 rounded-[32px] w-fit mx-auto border border-slate-100 shadow-sm">
        {[
          { id: 'staging', label: '🏠 虛擬裝修', color: 'text-amber-600' },
          { id: 'poster', label: '🎨 行銷海報', color: 'text-blue-600' },
          { id: 'video', label: '🎬 影音創意', color: 'text-rose-600' }
        ].map(m => (
          <button 
            key={m.id}
            onClick={() => setMode(m.id as StudioMode)}
            className={`px-10 py-4 rounded-[26px] font-black text-xs transition-all ${mode === m.id ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* --- 模式：虛擬裝修 --- */}
      {mode === 'staging' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. 上傳空屋/舊屋照片</label>
                    {sourceImg ? (
                      <div className="relative aspect-square rounded-[32px] overflow-hidden group border-2 border-slate-100">
                         <img src={sourceImg.data} className="w-full h-full object-cover" />
                         <button onClick={() => setSourceImg(null)} className="absolute top-4 right-4 bg-black/50 text-white w-8 h-8 rounded-full">&times;</button>
                      </div>
                    ) : (
                      <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                        <span className="text-4xl mb-4">📸</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">點擊上傳原始照</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'source')} />
                      </label>
                    )}
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. 選擇裝修風格</label>
                    <div className="grid grid-cols-2 gap-3">
                       {['現代奢華風', '侘寂簡約風', '日系原木風', '美式鄉村風', '奶油溫馨風', '工業loft風'].map(s => (
                         <button 
                           key={s} 
                           onClick={() => setStageStyle(s)}
                           className={`p-4 rounded-2xl text-[11px] font-black border-2 transition-all ${stageStyle === s ? 'bg-amber-600 text-white border-amber-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                         >
                           {s}
                         </button>
                       ))}
                    </div>
                 </div>

                 <button 
                   onClick={handleRunStaging}
                   disabled={isStaging || !sourceImg}
                   className="w-full bg-slate-900 text-white py-6 rounded-[28px] font-black text-lg shadow-xl hover:bg-black transition-all disabled:opacity-30"
                 >
                   {isStaging ? '正在鎖定結構並裝修...' : '🚀 開始 AI 虛擬裝修'}
                 </button>
              </div>
           </div>

           <div className="lg:col-span-8 space-y-6">
              <div className="bg-slate-50 rounded-[56px] border-2 border-dashed border-slate-200 h-full min-h-[500px] flex items-center justify-center relative overflow-hidden group">
                 {stagedImg ? (
                    <>
                      <img 
                        src={showOriginal ? sourceImg?.data : stagedImg} 
                        className="w-full h-full object-cover animate-in fade-in duration-500" 
                        alt="Staging Result"
                      />
                      
                      {/* 前後對比控制器 */}
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl flex items-center space-x-2 border border-white">
                         <button 
                           onClick={() => setShowOriginal(true)}
                           className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${showOriginal ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
                         >
                           原始現況
                         </button>
                         <button 
                           onClick={() => setShowOriginal(false)}
                           className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${!showOriginal ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400'}`}
                         >
                           AI 裝修後
                         </button>
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-6">
                         <button 
                            onClick={() => downloadImage(stagedImg!, `AI虛擬裝修_${stageStyle}.png`)} 
                            className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm shadow-2xl hover:bg-slate-100 transition-all"
                         >
                           💾 下載成果圖
                         </button>
                         <button onClick={handleRunStaging} className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-2xl">重新生成</button>
                      </div>
                    </>
                 ) : (
                    <div className="text-center space-y-4 opacity-30">
                       <span className="text-8xl">🏘️</span>
                       <p className="font-black text-slate-400 uppercase text-xs tracking-[0.4em]">等待改造指令...</p>
                    </div>
                 )}
                 {isStaging && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center">
                       <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                       <p className="text-amber-700 font-black italic animate-pulse">正在精確鎖定空間結構中...</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* --- 模式：行銷海報 --- */}
      {mode === 'poster' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           <div className="bg-white rounded-[40px] p-12 border border-slate-100 shadow-sm space-y-10">
              <div className="flex items-center space-x-4">
                 <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">🖼️</div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight">AI 行銷海報工作室</h3>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center space-x-2">
                       <span>📸</span>
                       <span>第一步：由照片自動分析美學描述</span>
                    </label>
                    <div className="flex items-center space-x-4">
                       {posterRefImg ? (
                          <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
                             <img src={posterRefImg.data} className="w-full h-full object-cover" />
                             <button onClick={() => setPosterRefImg(null)} className="absolute top-1 right-1 bg-black/50 text-white w-5 h-5 rounded-full text-[10px]">&times;</button>
                          </div>
                       ) : (
                          <label className="w-24 h-24 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all flex-shrink-0">
                             <span className="text-xl">➕</span>
                             <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'ref')} />
                          </label>
                       )}
                       <div className="flex-1 space-y-2">
                          <p className="text-[10px] text-slate-400 font-bold">上傳物件現況照，AI 將自動產出具備高級感的行銷提詞。</p>
                          <button 
                             onClick={handleAnalyzePosterRef}
                             disabled={isAnalyzingRef || !posterRefImg}
                             className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${isAnalyzingRef ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white shadow-lg'}`}
                          >
                             {isAnalyzingRef ? '正在分析空間亮點...' : '✨ 點擊解析空間描述'}
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">第二步：確認海報視覺描述</label>
                    <textarea 
                      value={posterPrompt}
                      onChange={e => setPosterPrompt(e.target.value)}
                      placeholder="例如：台北信義區豪宅客廳，擁有台北101景觀，黃昏時刻，極具奢華感..."
                      className="w-full bg-slate-50 p-6 rounded-[24px] min-h-[140px] outline-none font-bold text-slate-700 border-2 border-transparent focus:border-blue-600 transition-all text-sm"
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">版面比例</label>
                    <div className="flex space-x-4">
                       {[
                         { id: '16:9', label: '橫式 16:9' },
                         { id: '9:16', label: '直式 9:16' },
                         { id: '1:1', label: '正方 1:1' }
                       ].map(r => (
                         <button 
                           key={r.id}
                           onClick={() => setAspectRatio(r.id as any)}
                           className={`px-6 py-3 rounded-xl text-[10px] font-black border-2 transition-all ${aspectRatio === r.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                         >
                           {r.label}
                         </button>
                       ))}
                    </div>
                 </div>

                 <button 
                   onClick={handleGeneratePoster}
                   disabled={isGeneratingPoster || !posterPrompt}
                   className="w-full bg-slate-900 text-white py-6 rounded-[28px] font-black text-lg shadow-xl hover:bg-black transition-all disabled:opacity-30"
                 >
                   {isGeneratingPoster ? '正在繪製高品質海報...' : '🎨 開始生成行銷海報'}
                 </button>
              </div>
           </div>

           <div className="space-y-6">
              <div className={`bg-slate-100 rounded-[48px] border-2 border-dashed border-slate-200 overflow-hidden relative flex items-center justify-center ${aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[700px] mx-auto' : 'aspect-video'}`}>
                 {posterImg ? (
                   <img src={posterImg} className="w-full h-full object-cover animate-in fade-in duration-1000" />
                 ) : (
                   <div className="text-center opacity-30">
                     <span className="text-6xl mb-4 block">🖼️</span>
                     <p className="text-[10px] font-black uppercase tracking-widest">等待海報繪製</p>
                   </div>
                 )}
                 {isGeneratingPoster && (
                   <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-blue-700 font-black animate-pulse">AI 正在計算美學細節...</p>
                   </div>
                 )}
              </div>
              
              {posterImg && !isGeneratingPoster && (
                <button 
                  onClick={() => downloadImage(posterImg!, `AI行銷海報_${aspectRatio.replace(':', 'x')}.png`)}
                  className="w-full bg-emerald-600 text-white py-6 rounded-[28px] font-black text-base shadow-2xl hover:bg-emerald-700 transition-all animate-in slide-in-from-bottom-4"
                >
                  📥 儲存海報至裝置
                </button>
              )}
           </div>
        </div>
      )}

      {/* --- 模式：影音創意 --- */}
      {mode === 'video' && (
        <div className="bg-white rounded-[56px] p-16 border border-slate-100 shadow-sm text-center space-y-10">
           <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[32px] flex items-center justify-center text-5xl mx-auto shadow-sm">🎬</div>
           <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-4xl font-black text-slate-800 tracking-tight">AI 影音創意工作室</h3>
              <p className="text-slate-400 font-medium leading-relaxed">此功能已與「短影音腳本」功能連動。請前往該頁面上傳物件照片與文件，AI 將自動生成包含分鏡描述與動效建議的專業腳本。</p>
           </div>
           <button onClick={() => window.location.hash = '#short-video'} className="bg-rose-600 text-white px-12 py-5 rounded-[28px] font-black text-base shadow-2xl hover:scale-105 transition-transform">前往影音腳本師</button>
        </div>
      )}

    </div>
  );
};

export default MarketingStudio;
