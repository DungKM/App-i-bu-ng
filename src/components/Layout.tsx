
import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserRole, SyncStatus, SyncQueueItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import avatar from "@/assets/avatar.jpg";

export const Layout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Poll for Sync Status
  const { data: queue } = useQuery({ 
      queryKey: ['sync-queue'], 
      queryFn: api.getSyncQueue,
      refetchInterval: 5000 // Poll every 5s to check sync status
  });

  /* Fix: Cast queue to SyncQueueItem[] to fix filter error */
  const failedItems = (queue as SyncQueueItem[])?.filter(i => i.status === SyncStatus.FAILED) || [];
  const pendingItems = (queue as SyncQueueItem[])?.filter(i => i.status === SyncStatus.PENDING || i.status === SyncStatus.SYNCING) || [];

  if (!user) return null;

  const isDoctor = user.role === UserRole.DOCTOR;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                <i className="fa-solid fa-hospital"></i>
              </div>
              {/* Hide text on very small screens if needed, but show on normal mobile */}
              <span className="font-bold text-lg text-slate-800 block">MediRound</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-1 lg:gap-4">
                <div className="relative group">
                    <button className={`text-sm font-medium px-3 py-2 rounded-md transition whitespace-nowrap flex items-center gap-1 ${location.pathname.startsWith('/treatment') ? 'text-primary bg-primary/5' : 'text-slate-600 hover:text-slate-900'}`}>
                        Đi buồng <i className="fa-solid fa-chevron-down text-[10px]"></i>
                    </button>
                    <div className="absolute top-full left-0 bg-white border border-slate-200 rounded-lg shadow-lg w-48 py-1 hidden group-hover:block animate-fade-in">
                        <Link to="/treatment" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary">
                            Danh sách bệnh nhân
                        </Link>
                        <Link to="/rounds/dashboard" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary font-bold">
                            Giám sát đi buồng
                        </Link>
                    </div>
                </div>
                
                {/* <Link to="/surgery" className={`text-sm font-medium px-3 py-2 rounded-md transition whitespace-nowrap ${location.pathname.startsWith('/surgery') ? 'text-primary bg-primary/5' : 'text-slate-600 hover:text-slate-900'}`}>
                    DVKT
                </Link> */}
                <div className="relative group">
                    <button className={`text-sm font-medium px-3 py-2 rounded-md transition whitespace-nowrap flex items-center gap-1 ${location.pathname.startsWith('/medication') || location.pathname.startsWith('/rx') || location.pathname.startsWith('/compliance') ? 'text-primary bg-primary/5' : 'text-slate-600 hover:text-slate-900'}`}>
                        Cấp phát thuốc <i className="fa-solid fa-chevron-down text-[10px]"></i>
                    </button>
                    <div className="absolute top-full left-0 bg-white border border-slate-200 rounded-lg shadow-lg w-56 py-1 hidden group-hover:block animate-fade-in">
                        <Link to="/rx/inbox" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary border-b border-slate-100">
                            <i className="fa-solid fa-inbox mr-2 text-slate-400"></i>Tiếp nhận Y lệnh (HIS)
                        </Link>
                        <Link to="/medication" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary">
                            Cấp phát tại khoa (MAR)
                        </Link>
                        {/* <Link to="/medication/dashboard" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary">
                            Theo dõi cấp phát
                        </Link> */}
                        <Link to="/compliance/dashboard" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary font-bold border-t border-slate-100">
                            <i className="fa-solid fa-tower-observation mr-2 text-slate-400"></i>Dashboard Tuân thủ
                        </Link>
                    </div>
                </div>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {/* SYNC INDICATOR */}
             <Link to="/sync/dashboard" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 transition" title="Trạng thái đồng bộ HIS">
                 {failedItems.length > 0 ? (
                     <div className="flex items-center gap-1 text-red-600 animate-pulse font-bold text-xs">
                         <i className="fa-solid fa-triangle-exclamation"></i>
                         <span className="hidden sm:inline">{failedItems.length} Lỗi Sync</span>
                     </div>
                 ) : pendingItems.length > 0 ? (
                     <div className="flex items-center gap-1 text-blue-600 text-xs">
                         <i className="fa-solid fa-rotate fa-spin"></i>
                         <span className="hidden sm:inline">Đang gửi...</span>
                     </div>
                 ) : (
                     <div className="flex items-center gap-1 text-green-600 text-xs">
                         <i className="fa-solid fa-cloud-check"></i>
                         <span className="hidden sm:inline">Đã Sync</span>
                     </div>
                 )}
             </Link>

             {/* Logout - Hide text on mobile */}
            <button
              onClick={logout}
              className="text-xs font-medium px-2 sm:px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition border border-red-100 whitespace-nowrap"
            >
              <i className="fa-solid fa-right-from-bracket sm:mr-1"></i>
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>

            <Link to="/profile" className="flex items-center gap-2 border-l pl-2 sm:pl-4 border-slate-200 hover:bg-slate-50 p-1 sm:p-2 rounded-lg transition group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-primary transition max-w-[120px] truncate">{user.name}</p>
                <p className={`text-xs ${isDoctor ? 'text-primary' : 'text-success'} font-medium`}>
                  {isDoctor ? 'Bác sĩ' : 'Điều dưỡng'}
                </p>
              </div>
              <img
                src={avatar}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-slate-200 group-hover:border-primary transition object-cover bg-slate-100"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Add padding bottom for mobile nav */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>

      {/* Bottom Nav (Mobile Only) - Uses safe area for iPhone X+ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 z-40 pb-[env(safe-area-inset-bottom,20px)] shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
        <Link to="/treatment" className={`flex flex-col items-center gap-1 min-w-[64px] p-1 rounded-lg ${location.pathname.startsWith('/treatment') ? 'text-primary bg-blue-50' : 'text-slate-400'}`}>
          <i className="fa-solid fa-bed-pulse text-lg"></i>
          <span className="text-[10px] font-medium">Đi buồng</span>
        </Link>
        <Link to="/rx/inbox" className={`flex flex-col items-center gap-1 min-w-[64px] p-1 rounded-lg ${location.pathname.startsWith('/rx') ? 'text-primary bg-blue-50' : 'text-slate-400'}`}>
          <i className="fa-solid fa-inbox text-lg"></i>
          <span className="text-[10px] font-medium">Y lệnh</span>
        </Link>
        <Link to="/surgery" className={`flex flex-col items-center gap-1 min-w-[64px] p-1 rounded-lg ${location.pathname.startsWith('/surgery') ? 'text-primary bg-blue-50' : 'text-slate-400'}`}>
          <i className="fa-solid fa-microscope text-lg"></i>
          <span className="text-[10px] font-medium">DVKT</span>
        </Link>
        <Link to="/medication" className={`flex flex-col items-center gap-1 min-w-[64px] p-1 rounded-lg ${location.pathname.startsWith('/medication') ? 'text-primary bg-blue-50' : 'text-slate-400'}`}>
          <i className="fa-solid fa-pills text-lg"></i>
          <span className="text-[10px] font-medium">Thuốc</span>
        </Link>
      </nav>
    </div>
  );
};
