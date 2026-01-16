
import React, { useState } from 'react';
// AI 功能已停用
import { PropertyFile } from '../services/geminiService';

const ShortVideoScript: React.FC = () => {
  const [propertyInfo, setPropertyInfo] = useState('');
  const [protagonistName, setProtagonistName] = useState('');
  const [endingTagline, setEndingTagline] = useState('');
  const [docFiles, setDocFiles] = useState<PropertyFile[]>([]);
  const [housePhotos, setHousePhotos] = useState<PropertyFile[]>([]);
  const [scriptStyle, setScriptStyle] = useState('豪宅沉浸式');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);

  const styles = [
    '豪宅沉浸式', 
    '首購知識型', 
    '反差探房 Vlog', 
    '技術流快剪', 
    '溫馨生活風', 
    '幽默趣味風',
    '專家評測風'
  ];

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    (Array.from(uploadedFiles) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocFiles(prev => [...prev, {
          data: reader.result as string,
          mimeType: file.type,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    const currentCount = housePhotos.length;
    const remaining = 10 - currentCount;
    
    (Array.from(uploadedFiles) as File[]).slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHousePhotos(prev => [...prev, {
          data: reader.result as string,
          mimeType: file.type,
          name: file.name
        }].slice(0, 10));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyzeFiles = async () => {
    const allFiles = [...docFiles, ...housePhotos];
    if (allFiles.length === 0) {
      alert('請先上傳文件或照片！');
      return;
    }
    setAnalyzing(true);
    // AI 功能已停用
    alert('AI 文件分析功能已停用，請手動輸入物件資訊。');
    setAnalyzing(false);
  };

  const handleGenerate = async () => {
    const allFiles = [...docFiles, ...housePhotos];
    if (!propertyInfo || allFiles.length === 0) {
      alert('請提供物件資訊或上傳檔案！');
      return;
    }
    setLoading(true);
    // AI 功能已停用
    alert('AI 腳本生成功能已停用，請手動撰寫腳本。');
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white rounded-[48px] p-10 shadow-sm border border-slate-100 space-y-8">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl">🎬</div>
                <div>
                   <h3 className="text-xl font-black text-slate-800">AI 多模態腳本師</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Script & Persona Director</p>
                </div>
             </div>
             {(docFiles.length > 0 || housePhotos.length > 0) && (
               <button 
                onClick={handleAnalyzeFiles}
                disabled={analyzing}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg flex items-center space-x-2"
               >
                 {analyzing ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>📄 AI 解析檔案亮點</span>}
               </button>
             )}
          </div>

          {/* 新增人設欄位 */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">主角名稱 (人設)</label>
                <input 
                  type="text"
                  value={protagonistName}
                  onChange={e => setProtagonistName(e.target.value)}
                  placeholder="例如：大安區 Linda"
                  className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-transparent focus:border-rose-300 outline-none font-bold text-sm"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">結尾金句 / 聯繫資訊</label>
                <input 
                  type="text"
                  value={endingTagline}
                  onChange={e => setEndingTagline(e.target.value)}
                  placeholder="例如：找好房，找 Linda"
                  className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-transparent focus:border-rose-300 outline-none font-bold text-sm"
                />
             </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">物件詳細資訊 (手動補充或一鍵解析)</label>
            <textarea 
              value={propertyInfo}
              onChange={e => setPropertyInfo(e.target.value)}
              placeholder="提示：上傳資料後點擊「AI 解析」，系統會自動提取坪數、屋況與亮點..."
              className="w-full bg-slate-50 px-6 py-4 rounded-3xl border-2 border-transparent focus:border-rose-600 outline-none font-bold min-h-[100px] text-sm leading-relaxed"
            />
          </div>

          {/* 第一部分：物件資料文件 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. 物件資料 (PDF 謄本、平面圖)</label>
              <span className="text-[9px] text-slate-300 font-bold">{docFiles.length} 份文件</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {docFiles.map((file, idx) => (
                <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 bg-white flex flex-col items-center justify-center p-2 text-center shadow-sm">
                  {file.mimeType.includes('pdf') ? <span className="text-3xl">📕</span> : <img src={file.data} className="w-full h-full object-cover rounded-xl" />}
                  <span className="text-[8px] font-black text-slate-400 truncate w-full px-1 mt-1">{file.name}</span>
                  <button onClick={() => setDocFiles(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-xs">移除</button>
                </div>
              ))}
              <label className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                <span className="text-xl text-slate-300">📄</span>
                <input type="file" multiple accept="image/*,application/pdf" onChange={handleDocUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* 第二部分：現況房屋照片 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. 現況房屋照片 (限 10 張)</label>
              <span className={`text-[9px] font-black ${housePhotos.length === 10 ? 'text-rose-500' : 'text-slate-300'}`}>{housePhotos.length} / 10</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {housePhotos.map((file, idx) => (
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50">
                  <img src={file.data} className="w-full h-full object-cover" />
                  <button onClick={() => housePhotos.length > 0 && setHousePhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-[10px]">移除</button>
                </div>
              ))}
              {housePhotos.length < 10 && (
                <label className="aspect-square bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                  <span className="text-xl text-slate-300">📷</span>
                  <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-50">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">影音腳本風格</label>
            <div className="flex flex-wrap gap-2">
              {styles.map(style => (
                <button key={style} onClick={() => setScriptStyle(style)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${scriptStyle === style ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                  {style}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading} className={`w-full py-6 rounded-[28px] font-black text-base transition-all shadow-2xl flex items-center justify-center space-x-3 ${loading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
            {loading ? <><div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div><span>AI 導演正在撰稿...</span></> : <span>🚀 生成拍攝腳本</span>}
          </button>
        </div>

        <div className="space-y-8 h-full">
          {generatedScript ? (
            <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden h-full flex flex-col min-h-[600px]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 blur-[60px] rounded-full"></div>
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex flex-col">
                   <h4 className="text-lg font-black text-rose-400 uppercase tracking-widest">AI 腳本：{scriptStyle}</h4>
                   <p className="text-[10px] text-slate-500 font-bold">由 {protagonistName || '專業房仲'} 主講</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(generatedScript || ''); alert('已複製腳本！'); }} className="text-[10px] font-black bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl">複製全文</button>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide relative z-10 prose prose-invert prose-sm max-w-none whitespace-pre-line leading-relaxed font-medium text-slate-300">
                {generatedScript}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[48px] p-12 shadow-sm border border-slate-100 h-full flex flex-col items-center justify-center text-center space-y-6 min-h-[600px]">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl grayscale opacity-30">📹</div>
              <div className="space-y-2">
                <p className="text-slate-800 font-black text-lg">等待導演下令...</p>
                <p className="text-slate-400 font-bold text-xs max-w-[280px]">填入主角名稱並上傳照片，AI 將產出量身打造的腳本。</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShortVideoScript;
