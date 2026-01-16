
import React from 'react';
import { ViewType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  onAddClick: () => void;
  pendingLeadsCount: number;
  contacts?: Array<{ role: 'buyer' | 'seller' }>;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, onAddClick, pendingLeadsCount, contacts = [], onLogout }) => {
  const navItems = [
    { id: 'dashboard' as ViewType, label: '儀表板', icon: '📊' },
    { id: 'contacts' as ViewType, label: '客戶管理', icon: '👥' },
    { id: 'property-matcher' as ViewType, label: '智慧配案', icon: '🤝' },
    { id: 'marketing-studio' as ViewType, label: '行銷研究室', icon: '🎨' },
    { id: 'lead-inbox' as ViewType, label: '進件收件匣', icon: '📥', count: pendingLeadsCount },
    { id: 'agent-tools' as ViewType, label: '房仲工具箱', icon: '🧰' },
    { id: 'short-video' as ViewType, label: '短影音腳本', icon: '🎬' },
    { id: 'ai-insights' as ViewType, label: 'AI 銷售策略', icon: '✨' },
    { id: 'ai-settings' as ViewType, label: 'AI 模型設定', icon: '⚙️' },
    { id: 'data-management' as ViewType, label: '數據管理', icon: '💾' },
    { id: 'security' as ViewType, label: '安全設定', icon: '🔒' },
  ];

  const quickLinks = [
    { label: '樂居 LEJU', url: 'https://www.leju.com.tw', icon: '🏘️', color: 'bg-orange-500' },
    { label: '591 房屋交易', url: 'https://www.591.com.tw', icon: '🏠', color: 'bg-yellow-500' },
    { label: '實價登錄 2.0', url: 'https://lvr.land.moi.gov.tw', icon: '📈', color: 'bg-blue-500' },
    { label: '地籍便民系統', url: 'https://easymap.land.moi.gov.tw', icon: '🗺️', color: 'bg-emerald-500' },
    { label: '即夢 AI (專業繪圖)', url: 'https://jimeng.jianying.com/ai-tool/home/', icon: '🎨', color: 'bg-purple-600' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden md:flex w-64 lg:w-72 bg-slate-900 text-white flex-col shadow-2xl">
        <div className="p-4 lg:p-6">
          <h1 className="text-xl lg:text-2xl font-black bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent italic">
            我超業 AI CRM
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">Intelligence Pro</p>
        </div>
        
        <nav className="flex-1 mt-2 px-2 lg:px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2 px-2 lg:px-3 whitespace-nowrap">主要功能</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                activeView === item.id 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
              </div>
              {item.count ? (
                <span className="bg-rose-500 text-white text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap">
                  {item.count}
                </span>
              ) : null}
            </button>
          ))}

          <div className="mt-4 lg:mt-6 space-y-1 pb-4 lg:pb-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2 px-2 lg:px-3 whitespace-nowrap">外部工具快捷</p>
            {quickLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all group"
              >
                <span className={`w-6 h-6 rounded flex items-center justify-center text-base flex-shrink-0 ${link.color} text-white group-hover:scale-105 transition-transform`}>
                  {link.icon}
                </span>
                <span className="font-medium text-sm truncate">{link.label}</span>
                <span className="text-xs opacity-0 group-hover:opacity-100 ml-auto transition-opacity flex-shrink-0">↗</span>
              </a>
            ))}
          </div>
        </nav>

        <div className="p-4 lg:p-6 border-t border-slate-800">
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center font-bold text-white text-sm lg:text-base">王</div>
            <div className="flex flex-col">
              <p className="text-sm lg:text-base font-semibold">王牌經紀人</p>
              <div className="flex items-center space-x-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">系統已就緒</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 移動端側邊欄按鈕 */}
      <button 
        onClick={() => {/* TODO: 添加移動端側邊欄切換 */}}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg"
      >
        ☰
      </button>

      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight whitespace-nowrap">
              {navItems.find(n => n.id === activeView)?.label}
            </h2>
            {activeView === 'contacts' && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium border border-blue-200 whitespace-nowrap">
                  🎯 {contacts.filter(c => c.role === 'buyer').length} 買方
                </span>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded text-sm font-medium border border-indigo-200 whitespace-nowrap">
                  🏠 {contacts.filter(c => c.role === 'seller').length} 賣方
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
             <div className="hidden lg:flex gap-1.5 mr-3 border-r border-slate-200 pr-3">
                {quickLinks.slice(0, 4).map(link => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" title={link.label} className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-all border border-slate-200">
                    <span className="text-base">{link.icon}</span>
                  </a>
                ))}
             </div>
             <button onClick={onAddClick} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap">
               + 快速錄入
             </button>
             {onLogout && (
               <button 
                 onClick={() => {
                   if (confirm('確定要登出嗎？')) {
                     onLogout();
                   }
                 }}
                 className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 transition-all shadow-sm whitespace-nowrap"
                 title="登出系統"
               >
                 🔒 登出
               </button>
             )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
