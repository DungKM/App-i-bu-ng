
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { SurgeryGroupStatus } from '@/types';

const statusColors = {
  [SurgeryGroupStatus.NEW]: 'bg-red-100 text-red-700 border-red-200',
  [SurgeryGroupStatus.EXECUTING]: 'bg-amber-100 text-amber-700 border-amber-200',
  [SurgeryGroupStatus.RESULT]: 'bg-green-100 text-green-700 border-green-200',
};

const statusLabels = {
  [SurgeryGroupStatus.NEW]: 'Chưa thực hiện',
  [SurgeryGroupStatus.EXECUTING]: 'Đang thực hiện',
  [SurgeryGroupStatus.RESULT]: 'Đã trả KQ',
};

export const SurgeryList: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const deptCode = 'CDHA'; // Cố định theo khoa của tài khoản (VD: Chẩn đoán hình ảnh)

  const { data: groups, isLoading } = useQuery({
    queryKey: ['surgery-groups', deptCode, keyword],
    queryFn: () => api.searchSurgeryGroups({ fulfillDeptCode: deptCode, keyword }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách DVKT / Cận lâm sàng</h1>
          <p className="text-slate-500 text-sm">Khoa thực hiện: <span className="font-bold text-primary">Chẩn đoán hình ảnh</span></p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Tìm tên, mã phiếu..."
              className="pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups?.map(group => (
            <Link key={group.id} to={`/surgery/${group.id}`} className="block">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition p-4 relative overflow-hidden group h-full">
                {/* Status Badge */}
                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold border-b border-l ${statusColors[group.status]}`}>
                  {statusLabels[group.status]}
                </div>

                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {group.patientName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 group-hover:text-primary transition truncate pr-16">{group.patientName}</h3>
                    <p className="text-xs text-slate-500">{group.patientCode}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Người chỉ định</span>
                    <span className="truncate max-w-[150px] text-right font-medium">{group.indicationPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">Thời gian</span>
                    <span className="font-medium">{new Date(group.indicationDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded text-xs line-clamp-1 border border-slate-100 italic">
                    <span className="font-bold mr-1 text-slate-700">CĐ:</span>{group.diagnosis}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {groups?.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-400">
              <i className="fa-solid fa-clipboard-list text-4xl mb-2"></i>
              <p>Không tìm thấy phiếu chỉ định nào.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
