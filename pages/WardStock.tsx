
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { IssueNoteStatus, HisIssueStatus, StockTransactionType, MARStatus } from '../types';

interface ReceiveInput {
    qty: number;
    reason: string;
    note: string;
    image: File | null;
}

export const WardStock: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'RECEIPT' | 'RETURNS'>('RECEIPT');
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);
  const [adjustItem, setAdjustItem] = useState<{code: string, name: string, currentQty: number} | null>(null);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustQty, setAdjustQty] = useState(0);
  
  // Store receipt data: { itemId: { qty, reason, note, image } }
  const [receiveData, setReceiveData] = useState<{[key:string]: ReceiveInput}>({});
  
  // Filters
  const [filterFrom, setFilterFrom] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [filterTo, setFilterTo] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('');

  const queryClient = useQueryClient();

  // Queries
  const { data: stock } = useQuery({ queryKey: ['ward-stock'], queryFn: api.getWardStock });
  const { data: notes } = useQuery({ 
      queryKey: ['issue-notes', filterFrom, filterTo, filterStatus], 
      queryFn: () => api.getIssueNotes({ from: filterFrom, to: filterTo, status: filterStatus }),
      enabled: activeTab === 'RECEIPT'
  });
  const { data: history, isLoading: historyLoading } = useQuery({
      queryKey: ['stock-history', showHistoryFor],
      queryFn: () => api.getWardStockHistory(showHistoryFor!),
      enabled: !!showHistoryFor
  });
  const { data: pendingReturns } = useQuery({
      queryKey: ['pending-returns'],
      queryFn: () => api.getReturnsPending(),
      enabled: activeTab === 'RETURNS'
  });
  // Fetch Reason Codes for mapping
  const { data: reasons } = useQuery({ 
      queryKey: ['mar-reasons'], 
      queryFn: api.getMARReasonCodes,
      enabled: activeTab === 'RETURNS'
  });

  // Mutations
  const confirmMutation = useMutation({
      mutationFn: (data: {id: string, items: any[]}) => api.confirmIssueNote(data.id, data.items),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['ward-stock'] });
          queryClient.invalidateQueries({ queryKey: ['issue-notes'] });
          setSelectedNote(null);
          setReceiveData({});
          alert('Đã xác nhận nhập kho thành công!');
      }
  });

  const adjustMutation = useMutation({
      mutationFn: () => api.adjustWardStock(adjustItem!.code, adjustQty, adjustReason),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['ward-stock'] });
          queryClient.invalidateQueries({ queryKey: ['stock-history'] });
          setAdjustItem(null);
          setAdjustReason('');
          alert('Đã điều chỉnh tồn kho!');
      }
  });

  const returnStockMutation = useMutation({
      mutationFn: (data: { id: string }) => api.updateMARStatus(data.id, MARStatus.RETURNED, {}),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['pending-returns'] });
          queryClient.invalidateQueries({ queryKey: ['ward-stock'] });
          alert('Đã nhập lại thuốc vào tủ!');
      }
  });

  const handleConfirm = () => {
      if(!selectedNote) return;
      const note = notes?.find(n => n.id === selectedNote);
      if(!note) return;

      const itemsPayload = note.items.map(item => {
          const input = receiveData[item.id];
          const qtyReceived = input?.qty !== undefined ? input.qty : item.qtySent;
          
          return {
              id: item.id,
              qtyReceived,
              note: input?.note || (qtyReceived !== item.qtySent ? 'Sai lệch số lượng' : ''),
              discrepancyReason: input?.reason,
              discrepancyImage: input?.image ? 'data:image/png;base64,mocked_image_data' : undefined 
          };
      });

      confirmMutation.mutate({ id: selectedNote, items: itemsPayload });
  };

  const handleInputChange = (itemId: string, field: keyof ReceiveInput, value: any) => {
      setReceiveData(prev => ({
          ...prev,
          [itemId]: {
              ...prev[itemId],
              [field]: value
          }
      }));
  };

  const currentNote = notes?.find(n => n.id === selectedNote);
  const isEditable = currentNote?.status === IssueNoteStatus.SENT && currentNote?.hisStatus !== HisIssueStatus.CANCELED;

  const getHisStatusBadge = (status: HisIssueStatus) => {
      switch(status) {
          case HisIssueStatus.CANCELED: return <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200 uppercase">Đã hủy</span>;
          case HisIssueStatus.UPDATED: return <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200 uppercase">Cập nhật</span>;
          default: return null;
      }
  };

  const getTransactionTypeBadge = (type: StockTransactionType) => {
      switch(type) {
          case StockTransactionType.IMPORT: return <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-bold border border-green-100">Nhập</span>;
          case StockTransactionType.EXPORT: return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold border border-blue-100">Xuất</span>;
          case StockTransactionType.ADJUST: return <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold border border-amber-100">Điều chỉnh</span>;
          case StockTransactionType.RETURN: return <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-xs font-bold border border-purple-100">Hoàn lại</span>;
          default: return <span>{type}</span>;
      }
  };

  return (
    <div className="space-y-6 relative">
        {/* History Modal */}
        {showHistoryFor && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-xl animate-fade-in">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">Lịch sử xuất nhập tồn: {stock?.find(s => s.drugCode === showHistoryFor)?.drugName}</h3>
                        <button onClick={() => setShowHistoryFor(null)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div className="p-0 max-h-[60vh] overflow-y-auto">
                        {historyLoading ? (
                            <div className="p-8 text-center text-slate-400">Đang tải...</div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Thời gian</th>
                                        <th className="px-4 py-3">Loại</th>
                                        <th className="px-4 py-3 text-right">Biến động</th>
                                        <th className="px-4 py-3 text-right">Tồn sau</th>
                                        <th className="px-4 py-3">Người TH</th>
                                        <th className="px-4 py-3">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history?.map(h => (
                                        <tr key={h.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-xs text-slate-500">{new Date(h.timestamp).toLocaleString('vi-VN')}</td>
                                            <td className="px-4 py-3">{getTransactionTypeBadge(h.type)}</td>
                                            <td className={`px-4 py-3 text-right font-bold ${h.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {h.quantityChange > 0 ? '+' : ''}{h.quantityChange}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800">{h.quantityAfter}</td>
                                            <td className="px-4 py-3 text-xs">{h.performedBy}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[150px]">{h.reason || h.referenceId || '--'}</td>
                                        </tr>
                                    ))}
                                    {history?.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-8 text-slate-400">Chưa có giao dịch nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Adjustment Modal */}
        {adjustItem && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-md shadow-xl animate-fade-in">
                    <div className="p-4 border-b border-slate-100 bg-amber-50">
                        <h3 className="font-bold text-amber-800 flex items-center gap-2">
                            <i className="fa-solid fa-scale-balanced"></i> Kiểm kê / Điều chỉnh
                        </h3>
                        <p className="text-xs text-amber-600">Thao tác này sẽ được ghi nhận vào lịch sử và cần audit.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm text-slate-500 mb-1">Thuốc</label>
                            <div className="font-bold text-slate-800 text-lg">{adjustItem.name}</div>
                            <div className="text-xs text-slate-400">Mã: {adjustItem.code}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">Tồn hệ thống</label>
                                <div className="p-2 bg-slate-100 rounded text-center font-bold">{adjustItem.currentQty}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tồn thực tế (Mới)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2 border rounded font-bold text-center focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={adjustQty}
                                    onChange={e => setAdjustQty(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                        {adjustQty !== adjustItem.currentQty && (
                            <div className={`text-center text-sm font-bold ${adjustQty > adjustItem.currentQty ? 'text-green-600' : 'text-red-600'}`}>
                                Chênh lệch: {adjustQty > adjustItem.currentQty ? '+' : ''}{adjustQty - adjustItem.currentQty}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Lý do điều chỉnh <span className="text-red-500">*</span></label>
                            <textarea 
                                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                rows={2}
                                placeholder="VD: Vỡ khi vận chuyển, Hết hạn hủy..."
                                value={adjustReason}
                                onChange={e => setAdjustReason(e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                        <button onClick={() => setAdjustItem(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded font-medium transition">Hủy</button>
                        <button 
                            onClick={() => adjustMutation.mutate()}
                            disabled={!adjustReason || adjustQty === adjustItem.currentQty || adjustMutation.isPending}
                            className="px-4 py-2 bg-primary text-white rounded font-bold hover:bg-sky-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Xác nhận điều chỉnh
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Quản lý Dược khoa phòng</h1>
                <p className="text-slate-500 text-sm">Khoa Nội 1 • Tủ trực A</p>
            </div>
            <Link to="/medication" className="text-slate-500 hover:text-primary text-sm font-medium self-start sm:self-auto">
                <i className="fa-solid fa-arrow-left mr-1"></i> Quay lại DS người bệnh
            </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
            <button 
                onClick={() => setActiveTab('RECEIPT')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition whitespace-nowrap ${activeTab === 'RECEIPT' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
            >
                Nhập thuốc (Issue Notes) 
                {notes?.some(n => n.status === IssueNoteStatus.SENT && n.hisStatus !== HisIssueStatus.CANCELED) && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">New</span>}
            </button>
            <button 
                onClick={() => setActiveTab('STOCK')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition whitespace-nowrap ${activeTab === 'STOCK' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
            >
                Tồn tủ trực (Ward Stock)
            </button>
            <button 
                onClick={() => setActiveTab('RETURNS')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'RETURNS' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
            >
                Thuốc chờ trả
                {pendingReturns && pendingReturns.length > 0 && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">{pendingReturns.length}</span>}
            </button>
        </div>

        {/* Content: Stock List */}
        {activeTab === 'STOCK' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div className="text-sm text-slate-500 font-bold">Danh sách thuốc trong tủ trực</div>
                    <div className="text-xs text-slate-400"><i className="fa-solid fa-circle-info mr-1"></i>Dữ liệu được cập nhật từ HIS & MAR</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">Tên thuốc</th>
                                <th className="px-4 py-3">Đơn vị</th>
                                <th className="px-4 py-3 text-center">Tồn hiện tại</th>
                                <th className="px-4 py-3 text-center">Min</th>
                                <th className="px-4 py-3">Trạng thái</th>
                                <th className="px-4 py-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stock?.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                    <td className="px-4 py-3 font-bold text-slate-800">
                                        {item.drugName}
                                        <div className="text-[10px] text-slate-400 font-normal">{item.drugCode} • Lô: {item.lotNumber}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-lg font-bold ${item.quantity < item.minQuantity ? 'text-red-600' : 'text-slate-800'}`}>
                                            {item.quantity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-400">{item.minQuantity}</td>
                                    <td className="px-4 py-3">
                                        {item.quantity < item.minQuantity ? (
                                            <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-100 flex items-center w-fit gap-1">
                                                <i className="fa-solid fa-triangle-exclamation"></i>Sắp hết
                                            </span>
                                        ) : (
                                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold border border-green-100 flex items-center w-fit gap-1">
                                                <i className="fa-solid fa-check"></i>Đủ dùng
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setShowHistoryFor(item.drugCode)}
                                                className="text-slate-500 hover:text-primary hover:bg-slate-100 p-2 rounded-lg transition" 
                                                title="Xem lịch sử"
                                            >
                                                <i className="fa-solid fa-clock-rotate-left"></i>
                                            </button>
                                            <button 
                                                onClick={() => { setAdjustItem({code: item.drugCode, name: item.drugName, currentQty: item.quantity}); setAdjustQty(item.quantity); }}
                                                className="text-slate-500 hover:text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition" 
                                                title="Điều chỉnh / Kiểm kê"
                                            >
                                                <i className="fa-solid fa-sliders"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Content: Returns List (NEW) */}
        {activeTab === 'RETURNS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
                    <div>
                        <div className="text-sm text-purple-900 font-bold">Danh sách thuốc chờ hoàn trả</div>
                        <div className="text-xs text-purple-700">Các liều thuốc đã xuất khỏi tủ nhưng không dùng cho người bệnh. Cần nhập lại kho.</div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">Thuốc / Hàm lượng</th>
                                <th className="px-4 py-3">Bệnh nhân</th>
                                <th className="px-4 py-3">Lý do hoàn trả</th>
                                <th className="px-4 py-3 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pendingReturns?.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-800">{item.drugName}</div>
                                        <div className="text-xs text-slate-500">{item.dosage}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{item.patientName}</div>
                                        <div className="text-xs text-slate-500">{item.patientCode}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700">
                                                {reasons?.find(r => r.code === item.reasonCode)?.label || item.reasonCode || 'Chưa ghi nhận'}
                                            </span>
                                            {item.note && <span className="text-xs text-slate-500 italic">"{item.note}"</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => returnStockMutation.mutate({ id: item.id })}
                                            className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-purple-700 shadow-sm inline-flex items-center gap-1"
                                        >
                                            <i className="fa-solid fa-box-archive"></i> Nhập lại tủ
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {pendingReturns?.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-10 text-slate-400">Không có thuốc nào đang chờ trả.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Content: Receipt List (Existing Logic) */}
        {activeTab === 'RECEIPT' && (
            <>
                {/* Filters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Từ ngày</label>
                        <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="w-full text-sm border rounded p-1.5" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Đến ngày</label>
                        <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="w-full text-sm border rounded p-1.5" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Trạng thái</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full text-sm border rounded p-1.5 bg-white">
                            <option value="">Tất cả</option>
                            <option value={IssueNoteStatus.SENT}>Mới gửi</option>
                            <option value={IssueNoteStatus.RECEIVED}>Đã nhận</option>
                            <option value={IssueNoteStatus.DISCREPANCY}>Sai lệch</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* List of Notes */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit max-h-[600px] overflow-y-auto">
                        <div className="p-3 bg-slate-50 border-b font-bold text-slate-700 sticky top-0">Phiếu từ Dược</div>
                        <div className="divide-y divide-slate-100">
                            {notes?.map(note => (
                                <div 
                                    key={note.id} 
                                    onClick={() => setSelectedNote(note.id)}
                                    className={`p-4 cursor-pointer transition ${selectedNote === note.id ? 'bg-blue-50 border-l-4 border-primary' : 'hover:bg-slate-50 border-l-4 border-transparent'} ${note.hisStatus === HisIssueStatus.CANCELED ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex flex-col">
                                            <span className={`font-bold ${note.hisStatus === HisIssueStatus.CANCELED ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{note.code}</span>
                                            {getHisStatusBadge(note.hisStatus)}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {note.status === IssueNoteStatus.SENT && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Mới</span>}
                                            {note.status === IssueNoteStatus.RECEIVED && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Đã nhận</span>}
                                            {note.status === IssueNoteStatus.DISCREPANCY && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Sai lệch</span>}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-500">{new Date(note.createdDate).toLocaleString('vi-VN')}</div>
                                    <div className="text-xs text-slate-500 mt-1">{note.items.length} khoản mục</div>
                                </div>
                            ))}
                            {notes?.length === 0 && <div className="p-4 text-center text-slate-400">Không tìm thấy phiếu.</div>}
                        </div>
                    </div>

                    {/* Note Detail & Action */}
                    <div className="md:col-span-2 space-y-4">
                        {currentNote ? (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative">
                                {/* Canceled Overlay */}
                                {currentNote.hisStatus === HisIssueStatus.CANCELED && (
                                    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-xl pointer-events-none">
                                        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-200 shadow-lg text-center">
                                            <i className="fa-solid fa-ban text-3xl mb-2"></i>
                                            <h3 className="font-bold text-lg">Phiếu này đã bị Hủy</h3>
                                            <p className="text-sm">Không thể nhập kho</p>
                                        </div>
                                    </div>
                                )}

                                {/* Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-slate-100 pb-3 gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="font-bold text-lg text-slate-900">Chi tiết: {currentNote.code}</h2>
                                            {getHisStatusBadge(currentNote.hisStatus)}
                                        </div>
                                        <p className="text-slate-500 text-sm">
                                            {isEditable ? 'Vui lòng kiểm đếm thực tế trước khi xác nhận.' : `Đã xác nhận lúc ${new Date(currentNote.receivedAt!).toLocaleString()}`}
                                        </p>
                                    </div>
                                    {isEditable && (
                                        <button 
                                            onClick={handleConfirm}
                                            disabled={confirmMutation.isPending}
                                            className="bg-primary text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-sky-600 transition disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {confirmMutation.isPending ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-check-double mr-2"></i>}
                                            Xác nhận nhập kho
                                        </button>
                                    )}
                                </div>

                                {currentNote.pharmacyNote && (
                                    <div className="mb-4 bg-amber-50 p-3 rounded-lg border border-amber-100 text-amber-800 text-sm flex gap-2">
                                        <i className="fa-solid fa-comment-medical mt-0.5"></i>
                                        <div><span className="font-bold mr-1">Ghi chú từ Dược:</span> {currentNote.pharmacyNote}</div>
                                    </div>
                                )}

                                {/* Items Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                                            <tr>
                                                <th className="px-3 py-2 w-1/3">Thuốc</th>
                                                <th className="px-3 py-2 text-center w-20">SL Cấp</th>
                                                <th className="px-3 py-2 text-center w-24">Thực nhận</th>
                                                <th className="px-3 py-2">Chi tiết (Nếu sai lệch)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {currentNote.items.map(item => {
                                                const currentInput = receiveData[item.id];
                                                const qtyVal = currentInput?.qty !== undefined ? currentInput.qty : item.qtySent;
                                                const hasDiff = qtyVal !== item.qtySent;
                                                // If already received (locked), check stored data
                                                const isLockedDiff = !isEditable && item.qtyReceived !== item.qtySent;

                                                return (
                                                    <tr key={item.id} className={hasDiff || isLockedDiff ? 'bg-red-50/50' : ''}>
                                                        <td className="px-3 py-3 align-top">
                                                            <div className="font-medium text-slate-900">{item.drugName}</div>
                                                            <div className="text-xs text-slate-500">{item.unit} • {item.lotNumber}</div>
                                                            <div className="text-[10px] text-slate-400">HSD: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '--'}</div>
                                                        </td>
                                                        <td className="px-3 py-3 text-center align-top font-bold text-slate-700">
                                                            {item.qtySent}
                                                        </td>
                                                        <td className="px-3 py-3 text-center align-top">
                                                            {isEditable ? (
                                                                <input 
                                                                    type="number"
                                                                    className={`w-20 p-1.5 border rounded text-center font-bold outline-none focus:ring-2 ${hasDiff ? 'border-red-300 text-red-600 focus:ring-red-200 bg-white' : 'border-slate-300 focus:ring-primary/20'}`}
                                                                    value={qtyVal}
                                                                    onChange={(e) => handleInputChange(item.id, 'qty', parseInt(e.target.value) || 0)}
                                                                />
                                                            ) : (
                                                                <span className={isLockedDiff ? 'text-red-600 font-bold' : 'font-bold'}>{item.qtyReceived}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 align-top">
                                                            {/* EDIT MODE: Discrepancy Form */}
                                                            {isEditable && hasDiff && (
                                                                <div className="space-y-2 animate-fade-in">
                                                                    <select 
                                                                        className="w-full text-xs border border-red-200 rounded p-1.5 bg-white text-red-700"
                                                                        value={currentInput?.reason || ''}
                                                                        onChange={(e) => handleInputChange(item.id, 'reason', e.target.value)}
                                                                    >
                                                                        <option value="">-- Chọn lý do --</option>
                                                                        <option value="MISSING">Thiếu thuốc</option>
                                                                        <option value="DAMAGED">Hỏng / Vỡ</option>
                                                                        <option value="WRONG_ITEM">Sai loại thuốc</option>
                                                                        <option value="OTHER">Khác</option>
                                                                    </select>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Ghi chú thêm..." 
                                                                        className="w-full text-xs border border-slate-200 rounded p-1.5"
                                                                        value={currentInput?.note || ''}
                                                                        onChange={(e) => handleInputChange(item.id, 'note', e.target.value)}
                                                                    />
                                                                    <div className="flex items-center gap-2">
                                                                        <label className="cursor-pointer text-xs bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-50 flex items-center gap-1">
                                                                            <i className="fa-solid fa-camera"></i> Ảnh
                                                                            <input type="file" className="hidden" onChange={(e) => handleInputChange(item.id, 'image', e.target.files?.[0])} />
                                                                        </label>
                                                                        {currentInput?.image && <span className="text-[10px] text-green-600 truncate max-w-[100px]">{currentInput.image.name}</span>}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* READ MODE: Locked Details */}
                                                            {!isEditable && isLockedDiff && (
                                                                <div className="text-xs text-red-600">
                                                                    <div className="font-bold flex items-center gap-1"><i className="fa-solid fa-circle-exclamation"></i> Sai lệch: {item.qtyReceived - item.qtySent}</div>
                                                                    <div>Lý do: {item.discrepancyReason}</div>
                                                                    {item.note && <div className="italic text-slate-500">"{item.note}"</div>}
                                                                    {item.discrepancyImage && (
                                                                        <div className="mt-1 px-2 py-1 bg-slate-100 rounded inline-flex items-center gap-1 text-slate-600 border border-slate-200">
                                                                            <i className="fa-regular fa-image"></i> Đã đính kèm ảnh
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* Read-only Audit Trail */}
                                {!isEditable && (
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <i className="fa-solid fa-lock text-slate-400"></i>
                                            <span>Phiếu đã khóa. Chỉ trưởng ca được phép điều chỉnh.</span>
                                        </div>
                                        {/* Mock Audit Log Link */}
                                        <button className="text-primary hover:underline">Xem lịch sử</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                                Chọn phiếu bên trái để xem chi tiết
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}
    </div>
  );
};
