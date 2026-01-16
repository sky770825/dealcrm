
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Contact, Deal, ViewType } from '../types';

interface DashboardProps {
  contacts: Contact[];
  deals: Deal[];
  setActiveView: (view: ViewType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ contacts, deals, setActiveView }) => {
  const totalBudget = contacts.filter(c => c.role === 'buyer').reduce((sum, c) => sum + (c.budget || 0), 0);
  const closedDeals = deals.filter(d => d.stage === '結案' || d.stage === '成交簽約');
  const actualRevenue = closedDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const monthlyGoal = 5000;
  const goalProgress = Math.min(Math.round((actualRevenue / monthlyGoal) * 100), 100);

  // 補強：過期未追蹤客戶
  const urgentContacts = contacts.filter(c => {
    if (c.status === '議價中') return true;
    if (!c.lastContacted) return false;
    try {
      const lastDate = new Date(c.lastContacted);
      if (isNaN(lastDate.getTime())) return false;
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      return diffDays > 7;
    } catch {
      return false;
    }
  }).slice(0, 3);

  const activeBuyers = contacts.filter(c => c.role === 'buyer' && c.status === '潛在買方').length;
  const activeSellers = contacts.filter(c => c.role === 'seller' && c.status === '委託中').length;
  const totalBuyers = contacts.filter(c => c.role === 'buyer').length;
  const totalSellers = contacts.filter(c => c.role === 'seller').length;
  const buyerBudget = contacts.filter(c => c.role === 'buyer').reduce((sum, c) => sum + (c.budget || 0), 0);
  const sellerValue = contacts.filter(c => c.role === 'seller').reduce((sum, c) => sum + (c.budget || 0), 0);

  const chartData = [
    { name: '7月', value: 12000 },
    { name: '8月', value: 15400 },
    { name: '9月', value: 9800 },
    { name: '10月', value: 18900 },
    { name: '11月', value: 24500 },
    { name: '12月', value: actualRevenue || 31000 },
  ];

  const sourceData = Array.from(new Set(contacts.map(c => c.source).filter(Boolean))).map(source => ({
    name: source || '未知',
    value: contacts.filter(c => c.source === source).length
  }));

  const COLORS = ['#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

  return (
    <div className="space-y-4 lg:space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-xl p-4 lg:p-6 text-white relative overflow-hidden shadow-lg">
         <div className="absolute top-0 right-0 w-48 h-48 lg:w-64 lg:h-64 bg-blue-600/10 blur-[80px] rounded-full"></div>
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center">
            <div>
               <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-blue-600 px-2 py-1 rounded text-xs font-medium">Monthly Target</span>
                  <span className="text-slate-400 text-xs font-medium">目標：{monthlyGoal.toLocaleString()} 萬</span>
               </div>
               <h2 className="text-2xl lg:text-3xl font-semibold mb-2">業績達成率 <span className="text-blue-400">{goalProgress}%</span></h2>
               <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-1000" style={{ width: `${goalProgress}%` }}></div>
               </div>
               <p className="text-slate-400 text-sm font-medium">目前已入帳：<span className="text-white font-medium">{actualRevenue.toLocaleString()} 萬</span></p>
            </div>
            
            {/* 今日急件區塊 */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg backdrop-blur-sm">
               <h4 className="text-base font-semibold text-rose-400 mb-3 flex items-center gap-1.5 whitespace-nowrap">
                 <span>🚨</span>
                 <span>今日急需追蹤 ({urgentContacts.length})</span>
               </h4>
               <div className="space-y-2">
                  {urgentContacts.map(c => (
                    <div key={c.id} className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setActiveView('contacts')}>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{c.name}</p>
                          <p className="text-sm text-slate-300 truncate">{c.status} • {c.lastContacted} 至今未聯絡</p>
                       </div>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           if (c.phone) {
                             window.location.href = `tel:${c.phone}`;
                           } else {
                             alert('客戶電話號碼未設定');
                           }
                         }}
                         className="ml-2 text-sm font-medium bg-blue-600 px-3 py-1.5 rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                       >
                         撥打
                       </button>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* 買方/賣方統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg p-4 lg:p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-xl backdrop-blur-sm flex-shrink-0">🎯</div>
              <div>
                <p className="text-sm font-medium uppercase opacity-90 whitespace-nowrap">買方客戶</p>
                <p className="text-2xl lg:text-3xl font-semibold whitespace-nowrap">{totalBuyers} 位</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-3 pt-3 border-t border-white/20">
            <div className="flex justify-between text-sm">
              <span className="opacity-90 whitespace-nowrap">潛在買方</span>
              <span className="font-semibold whitespace-nowrap">{activeBuyers} 位</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-90 whitespace-nowrap">總預算</span>
              <span className="font-semibold whitespace-nowrap">{buyerBudget.toLocaleString()} 萬</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-4 lg:p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-xl backdrop-blur-sm flex-shrink-0">🏠</div>
              <div>
                <p className="text-sm font-medium uppercase opacity-90 whitespace-nowrap">賣方/案源</p>
                <p className="text-2xl lg:text-3xl font-semibold whitespace-nowrap">{totalSellers} 位</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-3 pt-3 border-t border-white/20">
            <div className="flex justify-between text-sm">
              <span className="opacity-90 whitespace-nowrap">委託中</span>
              <span className="font-semibold whitespace-nowrap">{activeSellers} 位</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-90 whitespace-nowrap">總開價</span>
              <span className="font-semibold whitespace-nowrap">{sellerValue.toLocaleString()} 萬</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-4 lg:p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 whitespace-nowrap">業績趨勢分析</h3>
            <div className="h-56 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px'}} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white p-4 lg:p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 whitespace-nowrap">客戶來源占比</h3>
            <div className="h-48 lg:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value" stroke="none">
                    {sourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '500'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
