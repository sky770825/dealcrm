
import React from 'react';
import { Deal, Contact } from '../types';

interface DealKanbanProps {
  deals: Deal[];
  contacts: Contact[];
  onUpdateDeal: (deal: Deal) => void;
  onAddDeal?: () => void;
}

const STAGES = ['初次洽談', '現場帶看', '要約議價', '成交簽約', '結案'] as const;

const DealKanban: React.FC<DealKanbanProps> = ({ deals, contacts, onUpdateDeal, onAddDeal }) => {
  const getContact = (id: string) => contacts.find(c => c.id === id);

  const moveDeal = (deal: Deal, direction: 'prev' | 'next') => {
    const currentIndex = STAGES.indexOf(deal.stage as any);
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < STAGES.length) {
      onUpdateDeal({ ...deal, stage: STAGES[nextIndex] as any });
    }
  };

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* 頂部操作列 */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 whitespace-nowrap">交易看板</h3>
        {onAddDeal && (
          <button 
            onClick={onAddDeal}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>+</span>
            <span>新增交易</span>
          </button>
        )}
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

          return (
            <div key={stage} className="flex-shrink-0 w-64 lg:w-72 flex flex-col gap-2.5">
              <div className="flex items-center justify-between px-1.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-slate-900 text-base tracking-tight whitespace-nowrap">{stage}</h4>
                  <span className="bg-slate-100 text-slate-600 text-sm font-medium px-2 py-0.5 rounded whitespace-nowrap">{stageDeals.length}</span>
                </div>
                <p className="text-sm font-semibold text-blue-600 whitespace-nowrap">${stageTotal.toLocaleString()} 萬</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-2.5 min-h-[350px] border border-slate-200 space-y-2">
                {stageDeals.map((deal) => {
                  const contact = getContact(deal.contactId);
                  return (
                    <div key={deal.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-slate-600 whitespace-nowrap">預估結案：{deal.expectedClose || '未設定'}</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-sm font-semibold text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors border border-slate-200 flex-shrink-0">
                          {deal.probability || 0}%
                        </div>
                      </div>
                      <h5 className="font-semibold text-base text-slate-900 mb-1 truncate">{deal.title || '未命名交易'}</h5>
                      <p className="text-sm text-slate-600 mb-2.5 truncate">客戶：{contact?.name || '未知'}</p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold text-slate-900 whitespace-nowrap">${(deal.value || 0).toLocaleString()}<span className="text-sm ml-1">萬</span></p>
                        <div className="flex gap-1">
                          {STAGES.indexOf(stage) > 0 && (
                            <button onClick={() => moveDeal(deal, 'prev')} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm transition-all border border-slate-200">←</button>
                          )}
                          {STAGES.indexOf(stage) < STAGES.length - 1 && (
                            <button onClick={() => moveDeal(deal, 'next')} className="w-8 h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center text-sm transition-all">→</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {stageDeals.length === 0 && (
                  <div className="h-28 flex items-center justify-center border border-dashed border-slate-300 rounded-lg">
                    <span className="text-sm font-medium text-slate-400 whitespace-nowrap">暫無案件</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DealKanban;
