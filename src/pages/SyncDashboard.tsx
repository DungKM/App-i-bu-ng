
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { SyncStatus, SyncType, SyncQueueItem } from '@/types';

export const SyncDashboard: React.FC = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: queue, isLoading } = useQuery({ 
      queryKey: ['sync-queue'], 
      queryFn: api.getSyncQueue,
      refetchInterval: 3000 // Poll frequently
  });

  // Mutations
  const processMutation = useMutation({
      mutationFn: api.processSyncQueue,
      onSuccess: (data: any) => {
          queryClient.invalidateQueries({ queryKey: ['sync-queue'] });
          alert(`Đã xử lý: ${data.processed} thành công, ${data.failed} thất bại.`);
      }
  });

  const retryItemMutation = useMutation({
      mutationFn: (id: string) => api.retrySyncItem(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sync-queue'] })
  });

  const getStatusBadge = (status: SyncStatus) => {
      switch(status) {
          case SyncStatus.PENDING: return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">Chờ gửi</span>;
          case SyncStatus.SYNCING: return <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-bold animate-pulse">Đang gửi...</span>;
          case SyncStatus.COMPLETED: return <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold">Thành công</span>;
          case SyncStatus.FAILED: return <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">Thất bại</span>;
      }
  };

  /* Fix: Cast queue to SyncQueueItem[] */
  const pendingCount = (queue as SyncQueueItem[])?.filter(i => i.status === SyncStatus.PENDING || i.status === SyncStatus.FAILED).length || 0;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Trạng thái đồng bộ HIS</h1>
                <p className="text-slate-500 text-sm">Giám sát các giao dịch gửi về hệ thống trung tâm</p>
            </div>
            <button 
                onClick={() => processMutation.mutate()}
                disabled={pendingCount === 0 || processMutation.isPending}
                className="bg-primary text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {processMutation.isPending ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-rotate"></i>}
                Đồng bộ ngay ({pendingCount})
            </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Thời gian</th>
                            <th className="px-4 py-3">Loại giao dịch</th>
                            <th className="px-4 py-3">Thông tin chi tiết</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-8"><i className="fa-solid fa-circle-notch fa-spin text-primary"></i></td></tr>
                        ) : /* Fix: Cast queue to SyncQueueItem[] */
                        (!queue || (queue as SyncQueueItem[]).length === 0) ? (
                            <tr><td colSpan={5} className="text-center py-8 text-slate-400">Không có giao dịch nào trong hàng đợi.</td></tr>
                        ) : (
                            /* Fix: Cast queue to SyncQueueItem[] */
                            (queue as SyncQueueItem[]).map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                        {new Date(item.updatedAt).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-slate-700">
                                        {item.type === SyncType.ADMINISTRATION && <span className="text-blue-600"><i className="fa-solid fa-pills mr-1"></i>Dùng thuốc</span>}
                                        {item.type === SyncType.RETURN && <span className="text-purple-600"><i className="fa-solid fa-rotate-left mr-1"></i>Trả thuốc</span>}
                                        {item.type === SyncType.SHIFT_CLOSE && <span className="text-amber-600"><i className="fa-solid fa-lock mr-1"></i>Chốt ca</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{item.patientName || 'Hệ thống'}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[200px]" title={JSON.stringify(item.payload)}>
                                            Ref: {item.referenceId}
                                        </div>
                                        {item.lastError && (
                                            <div className="text-xs text-red-500 mt-1 font-bold">
                                                <i className="fa-solid fa-circle-exclamation mr-1"></i>{item.lastError}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            {getStatusBadge(item.status)}
                                            {item.retryCount > 0 && <span className="text-[10px] text-slate-400">Retry: {item.retryCount}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {item.status === SyncStatus.FAILED && (
                                            <button 
                                                onClick={() => retryItemMutation.mutate(item.id)}
                                                disabled={retryItemMutation.isPending}
                                                className="text-primary hover:bg-blue-50 px-3 py-1.5 rounded text-xs font-bold border border-blue-100 transition"
                                            >
                                                <i className="fa-solid fa-arrow-rotate-right mr-1"></i>Thử lại
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};
