
import React, { useState, useMemo } from 'react';
import { Contact } from '../types';
import { TAIWAN_DATA } from '../constants';

interface ContactListProps {
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
  onAddClick: () => void;
  onDelete?: (id: string) => void;
}

interface FilterState {
  search: string;
  role: 'all' | 'buyer' | 'seller';
  minBudget: number;
  maxBudget: number;
  city: string;
  district: string;
  agePref: string;
  floorPref: string;
  propertyStatus: string;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, onSelect, onAddClick, onDelete }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: 'all',
    minBudget: 0,
    maxBudget: 20000,
    city: '',
    district: '',
    agePref: '不限',
    floorPref: '不限',
    propertyStatus: '不限'
  });

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchSearch = !filters.search || 
        (c.name && c.name.includes(filters.search)) || 
        (c.phone && c.phone.includes(filters.search)) ||
        (c.requirement && c.requirement.includes(filters.search));
      
      const matchRole = filters.role === 'all' || c.role === filters.role;
      const matchBudget = (c.budget || 0) >= filters.minBudget && (c.budget || 0) <= filters.maxBudget;
      const matchCity = !filters.city || (c.preferredArea && c.preferredArea.includes(filters.city));
      const matchDistrict = !filters.district || (c.preferredArea && c.preferredArea.includes(filters.district));
      const matchAge = filters.agePref === '不限' || (c.agePref === filters.agePref);
      const matchFloor = filters.floorPref === '不限' || (c.floorPref === filters.floorPref);
      const matchStatus = filters.propertyStatus === '不限' || (c.propertyStatus === filters.propertyStatus);

      return matchSearch && matchRole && matchBudget && matchCity && matchDistrict && matchAge && matchFloor && matchStatus;
    });
  }, [contacts, filters]);

  const resetFilters = () => {
    setFilters({
      search: '',
      role: 'all',
      minBudget: 0,
      maxBudget: 20000,
      city: '',
      district: '',
      agePref: '不限',
      floorPref: '不限',
      propertyStatus: '不限'
    });
  };

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* 頂部搜尋與控制列 */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 lg:p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="搜尋姓名、電話、或是物件關鍵字..."
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm transition-all"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => {
                const csv = [
                  ['姓名', '角色', '電話', '區域', '預算/開價', '狀態', '來源', '最後聯絡'].join(','),
                  ...filteredContacts.map(c => [
                    c.name,
                    c.role === 'buyer' ? '買方' : '賣方',
                    c.phone,
                    c.preferredArea || '',
                    c.budget || 0,
                    c.status,
                    c.source || '',
                    c.lastContacted || ''
                  ].join(','))
                ].join('\n');
                const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `客戶列表_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 shadow-sm transition-all whitespace-nowrap"
              title="匯出 CSV"
            >
              📥 匯出
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${showFilters ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <span>{showFilters ? '收起' : '篩選'}</span>
              <span>{showFilters ? '🔼' : '🔽'}</span>
            </button>
            <button 
              onClick={onAddClick}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 shadow-sm transition-all whitespace-nowrap"
            >
              + 新增
            </button>
          </div>
        </div>
        
        {/* 快速篩選：買方/賣方切換 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600 whitespace-nowrap">快速篩選：</span>
          <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setFilters({ ...filters, role: 'all' })}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap ${
                filters.role === 'all' 
                  ? 'bg-white shadow-sm text-slate-900' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部 ({contacts.length})
            </button>
            <button
              onClick={() => setFilters({ ...filters, role: 'buyer' })}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                filters.role === 'buyer' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <span>🎯</span>
              <span>買方 ({contacts.filter(c => c.role === 'buyer').length})</span>
            </button>
            <button
              onClick={() => setFilters({ ...filters, role: 'seller' })}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                filters.role === 'seller' 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              <span>🏠</span>
              <span>賣方 ({contacts.filter(c => c.role === 'seller').length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 進階篩選面板 */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm animate-in slide-in-from-top-4 duration-500 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-slate-900 whitespace-nowrap">進階篩選條件</h4>
            <button onClick={resetFilters} className="text-blue-600 text-sm font-medium underline whitespace-nowrap">重置所有</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 whitespace-nowrap">預算範圍 (萬)</label>
              <div className="flex items-center gap-2">
                <input type="number" className="bg-white p-2.5 rounded-lg text-sm font-medium outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full" value={filters.minBudget} onChange={e => setFilters({...filters, minBudget: Number(e.target.value)})} placeholder="最低" />
                <span className="text-slate-400 font-medium">-</span>
                <input type="number" className="bg-white p-2.5 rounded-lg text-sm font-medium outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full" value={filters.maxBudget} onChange={e => setFilters({...filters, maxBudget: Number(e.target.value)})} placeholder="最高" />
              </div>
              <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded text-sm font-medium border border-blue-200 whitespace-nowrap">符合：{filteredContacts.length} 筆</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 whitespace-nowrap">目標區域</label>
              <div className="grid grid-cols-2 gap-2">
                <select 
                  className="bg-white p-2.5 rounded-lg text-sm font-medium outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={filters.city}
                  onChange={e => setFilters({...filters, city: e.target.value, district: ''})}
                >
                  <option value="">所有縣市</option>
                  {Object.keys(TAIWAN_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                  className="bg-white p-2.5 rounded-lg text-sm font-medium outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={!filters.city}
                  value={filters.district}
                  onChange={e => setFilters({...filters, district: e.target.value})}
                >
                  <option value="">所有行政區</option>
                  {filters.city && (TAIWAN_DATA[filters.city] || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-200">
            {/* 樓層偏好 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 whitespace-nowrap">樓層偏好</label>
              <div className="flex flex-wrap gap-1.5">
                {['不限', '低樓層', '中樓層', '高樓層'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilters({...filters, floorPref: f})}
                    className={`px-2.5 py-1.5 rounded text-sm font-medium transition-all border whitespace-nowrap ${
                      filters.floorPref === f 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* 屋齡偏好 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 whitespace-nowrap">屋齡限制</label>
              <select 
                className="w-full bg-white p-2.5 rounded-lg text-sm font-medium outline-none border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={filters.agePref}
                onChange={e => setFilters({...filters, agePref: e.target.value})}
              >
                {['不限', '5年內', '10年內', '20年內', '30年內'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* 物件狀況 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 whitespace-nowrap">屋況/現況</label>
              <div className="flex flex-wrap gap-1.5">
                {['不限', '空屋', '出租中', '自住'].map(s => (
                  <button 
                    key={s}
                    onClick={() => setFilters({...filters, propertyStatus: s})}
                    className={`px-2.5 py-1.5 rounded text-sm font-medium transition-all border whitespace-nowrap ${
                      filters.propertyStatus === s 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 資料列表表格 */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase text-sm font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 lg:px-4 py-3 whitespace-nowrap">身分與資訊</th>
                <th className="px-3 lg:px-4 py-3 hidden md:table-cell whitespace-nowrap">區域/地址</th>
                <th className="px-3 lg:px-4 py-3 whitespace-nowrap">狀態</th>
                <th className="px-3 lg:px-4 py-3 text-blue-600 font-semibold whitespace-nowrap">預算/開價</th>
                <th className="px-3 lg:px-4 py-3 hidden lg:table-cell whitespace-nowrap">規格細節</th>
                <th className="px-3 lg:px-4 py-3 text-center whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.length > 0 ? filteredContacts.map((contact) => (
                <tr 
                  key={contact.id} 
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                  onClick={() => onSelect(contact)}
                >
                  <td className="px-3 lg:px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-lg shadow-sm transition-all flex-shrink-0 ${
                        contact.role === 'seller' 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white group-hover:scale-105' 
                          : 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white group-hover:scale-105'
                      }`}>
                        {contact.role === 'seller' ? '🏠' : '🎯'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-semibold text-base text-slate-900 truncate">{contact.name}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase whitespace-nowrap flex-shrink-0 ${
                            contact.role === 'seller' 
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {contact.role === 'seller' ? '賣方' : '買方'}
                          </span>
                          {contact.urgency?.includes('S') && <span className="bg-rose-50 text-rose-600 text-xs font-medium px-1.5 py-0.5 rounded border border-rose-200 whitespace-nowrap flex-shrink-0">極急</span>}
                        </div>
                        <p className="text-sm text-slate-600 truncate mt-0.5">{contact.requirement || '無需求描述'}</p>
                        <p className="text-sm text-slate-500 mt-0.5 whitespace-nowrap">{contact.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 lg:px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{contact.preferredArea || '未設定'}</span>
                      {contact.mrtStation && (
                        <span className="text-sm text-slate-500 mt-0.5 whitespace-nowrap">🚇 {contact.mrtStation}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 lg:px-4 py-3">
                    <span className={`px-2.5 py-1 rounded text-sm font-medium border whitespace-nowrap ${
                      contact.status.includes('已結案') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      contact.status.includes('委託') ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      contact.status.includes('潛在') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      contact.status.includes('議價') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-3 lg:px-4 py-3">
                    <div className="flex flex-col">
                      <span className={`text-lg font-semibold whitespace-nowrap ${
                        contact.role === 'seller' ? 'text-indigo-600' : 'text-blue-600'
                      }`}>
                        {contact.budget?.toLocaleString() || 0} <span className="text-sm font-medium">萬</span>
                      </span>
                      {contact.role === 'buyer' && contact.downPayment && (
                        <span className="text-sm text-slate-600 mt-0.5 whitespace-nowrap">自備：{contact.downPayment}萬</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 lg:px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800 whitespace-nowrap">
                        {contact.rooms || '--'} / {contact.totalSize ? `${contact.totalSize}坪` : '--'}
                      </span>
                      <span className="text-sm text-slate-500 mt-0.5 whitespace-nowrap">
                        {contact.floorPref || contact.agePref || '--'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 lg:px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (contact.phone) {
                            window.location.href = `tel:${contact.phone}`;
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center text-base transition-all border border-blue-200"
                        title="撥打電話"
                      >
                        📞
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (contact.phone) {
                            window.open(`https://line.me/ti/p/~${contact.phone}`, '_blank');
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center text-base transition-all border border-green-200"
                        title="開啟 LINE"
                      >
                        💬
                      </button>
                      {onDelete && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`確定要刪除客戶「${contact.name}」嗎？此操作無法復原。`)) {
                              onDelete(contact.id);
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center text-base transition-all border border-rose-200"
                          title="刪除客戶"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <span className="text-4xl">🕵️‍♂️</span>
                      <p className="text-slate-900 font-medium text-sm">找不到符合條件的客戶</p>
                      <button onClick={resetFilters} className="text-blue-600 underline text-xs font-medium">重置所有篩選</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContactList;
