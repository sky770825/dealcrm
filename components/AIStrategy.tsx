
import React, { useState, useEffect, useRef } from 'react';
// AI 功能已停用
import { Contact, Deal } from '../types';

interface AIStrategyProps {
  contacts: Contact[];
  deals: Deal[];
}

const AIStrategy: React.FC<AIStrategyProps> = ({ contacts, deals }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Fix: Add refs to manage AudioContext and SourceNode for playback control
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const { getGlobalSummary } = await import('../services/aiService');
        const res = await getGlobalSummary(contacts, deals);
        setSummary(res || '');
      } catch (error) {
        // AI 失敗時顯示基本統計
        const totalContacts = contacts.length;
        const totalDeals = deals.length;
        const activeDeals = deals.filter(d => d.stage !== '結案').length;
        const res = `目前共有 ${totalContacts} 位客戶，${totalDeals} 筆交易，其中 ${activeDeals} 筆進行中。建議持續跟進潛在案件，加強與客戶的溝通。`;
        setSummary(res || '');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [contacts, deals]);

  // 強大的解析器：過濾掉 Markdown 符號並結構化內容
  const parseAIContent = (text: string) => {
    if (!text) return { title: '報告生成中...', strategies: [], action: '' };

    // 移除常見的 Markdown 符號：# , * , _ , 📌
    const clean = (str: string) => str.replace(/[#*📌_]/g, '').trim();

    const lines = text.split('\n').filter(l => l.trim() !== '');
    
    // 試圖抓取標題
    const title = clean(lines[0]);
    
    // 抓取策略建議
    const strategies = lines
      .filter(l => l.includes('📌') || l.includes('策略') || /^[1-3]\./.test(l))
      .map(s => {
        const parts = s.split(/[:：]/);
        return {
          header: clean(parts[0]),
          body: parts[1] ? clean(parts[1]) : ''
        };
      })
      .slice(0, 3);

    // 抓取金牌行動
    const actionLine = lines.find(l => l.toLowerCase().includes('行動') || l.includes('核心'));
    const action = actionLine ? clean(actionLine.replace(/.*行動[:：]?/, '')) : "持續跟進潛在案件";

    return { title, strategies, action };
  };

  const { title, strategies, action } = parseAIContent(summary);

  // Fix: Implement real PCM audio playback instead of mock alert
  const handlePlayBriefing = async () => {
    if (isSpeaking) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }
    
    try {
      const { generateStrategySpeech } = await import('../services/aiService');
      const speechText = await generateStrategySpeech(summary);
      
      // 使用瀏覽器語音合成
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = 'zh-TW';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      } else {
        alert('您的瀏覽器不支援語音合成功能。');
      }
    } catch (error: any) {
      alert(`語音生成失敗：${error.message || '請檢查 AI 模型設定'}`);
      setIsSpeaking(false);
    }
    
    // 以下代碼已停用
    /*
    const base64Audio = await generateStrategySpeech(summary);
    
    if (base64Audio) {
      try {
        // Initialize AudioContext at 24kHz (standard sample rate for gemini-2.5-flash-preview-tts)
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        
        // Decode base64 string to Uint8Array
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Gemini TTS returns raw PCM data (16-bit). We need to manually convert it to Float32 for AudioBuffer.
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => {
          setIsSpeaking(false);
          sourceNodeRef.current = null;
        };
        sourceNodeRef.current = source;
        source.start();
      } catch (err) {
        console.error("Audio playback error:", err);
        setIsSpeaking(false);
      }
    } else {
      setIsSpeaking(false);
    }
    */
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      {/* 頂部英雄區：移除雜訊，強調視覺 */}
      <div className="bg-slate-900 rounded-[50px] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
              <span className="text-teal-400 font-black text-[10px] uppercase tracking-[0.4em]">Strategic Intelligence</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tight">
              智慧<span className="text-blue-500">銷售報告</span>
            </h2>
            <p className="text-slate-400 mt-4 text-sm font-medium">系統已為您清洗所有數據噪音，呈現最純粹的決策建議。</p>
            <button 
              onClick={handlePlayBriefing}
              className={`mt-8 px-8 py-3 rounded-2xl font-black text-xs transition-all flex items-center space-x-2 ${isSpeaking ? 'bg-teal-500 text-slate-900' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              <span>{isSpeaking ? '正在朗讀簡報...' : '聽取 AI 語音簡報'}</span>
              {isSpeaking && <span className="flex space-x-0.5"><div className="w-1 h-3 bg-slate-900 animate-bounce"></div><div className="w-1 h-3 bg-slate-900 animate-bounce delay-75"></div></span>}
            </button>
          </div>
          <div className="hidden lg:block">
            <div className="w-40 h-40 border border-white/5 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl"></div>
              <span className="text-6xl">💎</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center bg-white rounded-[40px] border border-slate-100">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold text-sm">正在深度解析銷售數據...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {/* 主評語：大器且乾淨 */}
          <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <h3 className="text-slate-300 text-[10px] font-black uppercase tracking-widest mb-6">今日核心策略觀點</h3>
            <p className="text-2xl md:text-3xl font-black text-slate-800 leading-tight relative z-10">
              「{title}」
            </p>
            <div className="absolute right-10 bottom-10 opacity-5 group-hover:scale-110 transition-transform">
               <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017V14C19.017 11.2386 16.7784 9 14.017 9V7C17.883 7 21.017 10.134 21.017 14V21H14.017ZM3.017 21L3.017 18C3.017 16.8954 3.91243 16 5.017 16H8.017V14C8.017 11.2386 5.77843 9 3.017 9V7C6.883 7 10.017 10.134 10.017 14V21H3.017Z"/></svg>
            </div>
          </div>

          {/* 策略建議：轉換為卡片而非文字行 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {strategies.map((s, idx) => (
              <div key={idx} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <span className="text-xl font-black">{idx + 1}</span>
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-3">{s.header}</h4>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          {/* 金牌行動：強烈號召 */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[50px] p-1 shadow-2xl">
            <div className="bg-slate-900 rounded-[48px] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest border border-blue-400/30 px-3 py-1 rounded-full mb-4 inline-block">Weekly Golden Action</span>
                <h3 className="text-2xl font-black text-white">{action}</h3>
              </div>
              <button className="bg-white text-slate-900 px-10 py-5 rounded-3xl font-black text-sm hover:scale-105 transition-transform active:scale-95">
                立即部署行動
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIStrategy;
