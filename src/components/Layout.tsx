import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';
import avatar from "@/assets/avatar.jpg";
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { env } from "@/config/env";
import { authStorage } from '@/services/auth.api';
import { ReturnNotificationsModal } from "@/components/ReturnNotificationsModal";
import { getNotifications } from "@/services/notifications.api";

export const Layout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNoti, setShowNoti] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const idKhoa = user?.idKhoa;

  useEffect(() => {
    if (!idKhoa) return;

    (async () => {
      try {
        const json = await getNotifications();
        setNotifications(json.data || []);
        setUnreadCount(json.unreadCount || 0);
      } catch (e) {
        console.log("Load notifications error:", e);
      }
    })();
  }, [idKhoa]);

  useEffect(() => {
    if (!idKhoa) return;

    const socket = io(env.API_BACKEND_AUTH_NODE_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join_khoa", idKhoa);
    });

    socket.on("new_notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((c) => c + 1);
      toast.success(`BN ${data.tenBenhNhan} trả thuốc`);
    });

    socket.on("connect_error", (e) => {
      console.log("❌ connect_error:", e?.message || e);
    });

    return () => {
      socket.disconnect();
    };
  }, [idKhoa]);

  if (!user) return null;

  const isAdmin = user.role === UserRole.ADMIN;
  const isDoctor = user.role === UserRole.DOCTOR;
  const isNurse = user.role === UserRole.NURSE;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                <i className="fa-solid fa-hospital"></i>
              </div>
              <span className="font-bold text-lg text-slate-800">MediRound</span>
            </Link>

            <nav className="hidden md:flex gap-4">
              {/* Menu Đi buồng */}
              {(isDoctor || isAdmin || isNurse) && (
                <div className="relative group">
                  <button className={`text-sm font-medium px-3 py-2 rounded-md flex items-center gap-1 ${location.pathname.startsWith('/treatment') ? 'text-primary bg-primary/5' : 'text-slate-600'}`}>
                    Đi buồng <i className="fa-solid fa-chevron-down text-[10px]"></i>
                  </button>
                  <div className="absolute top-full left-0 bg-white border border-slate-200 rounded-lg shadow-lg w-48 py-1 hidden group-hover:block animate-fade-in">
                    <Link to="/treatment" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Danh sách bệnh nhân</Link>
                  </div>
                </div>
              )}
              {/* Menu Cấp phát thuốc */}
              {(isDoctor || isNurse || isAdmin) && (
                <div className="relative group">
                  <button className={`text-sm font-medium px-3 py-2 rounded-md flex items-center gap-1 ${location.pathname.startsWith('/medication') ? 'text-primary bg-primary/5' : 'text-slate-600'}`}>
                    Cấp phát thuốc <i className="fa-solid fa-chevron-down text-[10px]"></i>
                  </button>
                  <div className="absolute top-full left-0 bg-white border border-slate-200 rounded-lg shadow-lg w-56 py-1 hidden group-hover:block animate-fade-in">
                    <Link to="/rx/inbox" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-50">
                      <i className="fa-solid fa-inbox mr-2"></i>Tiếp nhận Y lệnh
                    </Link>
                    <Link to="/medication" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-50">
                      <i className="fa-solid fa-pills mr-2"></i>Cấp phát tại khoa
                    </Link>
                    <Link to="/medication/history" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <i className="fa-solid fa-table-list mr-2"></i>Lịch sử xác nhận
                    </Link>
                  </div>
                </div>
              )}
              {/* Menu Quản trị */}
              {isAdmin && (
                <div className="relative group">
                  <button className={`text-sm font-medium px-3 py-2 rounded-md flex items-center gap-1 ${location.pathname.startsWith('/admin') ? 'text-primary bg-primary/5' : 'text-slate-600'}`}>
                    Quản trị <i className="fa-solid fa-chevron-down text-[10px]"></i>
                  </button>
                  <div className="absolute top-full left-0 bg-white border border-slate-200 rounded-lg shadow-lg w-48 py-1 hidden group-hover:block animate-fade-in">
                    <Link to="/admin/users" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-50">Người dùng</Link>
                    <Link to="/admin/departments" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Khoa Phòng</Link>
                  </div>
                </div>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative overflow-visible">
              <button
                onClick={async (e) => {
                  e.stopPropagation();

                  const next = !showNoti;
                  setShowNoti(next);

                  if (next) {
                    await fetch(`${env.API_BACKEND_AUTH_NODE_URL}/api/notifications/read-all`, {
                      method: "PATCH",
                      headers: { Authorization: `Bearer ${authStorage.getAccessToken()}` },
                    });

                    setUnreadCount(0);
                    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
                  }
                }}

                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative ${showNoti ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'}`}
              >
                <i className="fa-solid fa-bell text-lg"></i>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNoti && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setShowNoti(false)} />

                  <div
                    className="
                        fixed md:absolute
                        top-16 md:top-full
                        left-3 right-3 md:left-auto md:right-0
                        mt-0 md:mt-3
                        w-auto md:w-80
                        bg-white border border-slate-200
                        rounded-[24px] md:rounded-[32px]
                        shadow-2xl
                        py-3 md:py-4
                        z-[60]
                        overflow-hidden
                        animate-in fade-in slide-in-from-top-2
                      "
                  >
                    <div className="px-4 md:px-6 pb-3 border-b border-slate-50 flex items-start md:items-center justify-between gap-3">
                      <span className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-widest">
                        Thông báo
                      </span>

                      <div className="flex items-center gap-2 md:gap-3 text-[11px] md:text-xs shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReturnModal(true);
                            setShowNoti(false);
                          }}
                          className="text-primary hover:underline font-bold normal-case whitespace-nowrap"
                        >
                          Xem tất cả
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              await fetch(`${env.API_BACKEND_AUTH_NODE_URL}/api/notifications`, {
                                method: "DELETE",
                                headers: {
                                  Authorization: `Bearer ${authStorage.getAccessToken()}`,
                                },
                              });

                              setNotifications([]);
                              setUnreadCount(0);
                            } catch (e) {
                              console.log("Clear notifications error:", e);
                              toast.error("Không xóa được thông báo");
                            }
                          }}
                          className="text-primary hover:underline font-bold whitespace-nowrap"
                        >
                          Xóa tất cả
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[50vh] md:max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 font-bold uppercase text-xs">
                          <i className="fa-solid fa-bell-slash text-2xl mb-2 block"></i>
                          Không có thông báo
                        </div>
                      ) : (
                        notifications.map((n, idx) => (
                          <div
                            key={n._id || idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              const raw = n.payload?.url ?? n.url;
                              if (!raw) return;
                              const hashIndex = raw.indexOf("#");
                              let to = hashIndex !== -1 ? raw.slice(hashIndex + 1) : raw;
                              if (!to.startsWith("/")) to = "/" + to;
                              window.location.replace(`/#${to}`);
                              setShowNoti(false);
                            }}
                            className="px-4 md:px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex gap-3"
                          >
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 text-sm">
                              <i className="fa-solid fa-pills"></i>
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 uppercase italic break-words">
                                {n.payload?.tenBenhNhan ?? n.tenBenhNhan}{" "}
                                <span className="text-slate-400 not-italic">
                                  #{n.payload?.maBenhNhan ?? n.maBenhNhan}
                                </span>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1 font-medium italic break-words">
                                Trả {n.payload?.soLuongTra ?? n.soLuongTra} {n.payload?.tenThuoc ?? n.tenThuoc}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <ReturnNotificationsModal
              open={showReturnModal}
              onClose={() => setShowReturnModal(false)}
            />
            {/* Đăng xuất */}
            <button onClick={logout} className="text-xs font-bold px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-100">
              <i className="fa-solid fa-right-from-bracket mr-1"></i>Đăng xuất
            </button>

            {/* Profile */}
            <Link to="/profile" className="flex items-center gap-2 border-l pl-4 border-slate-200 group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-primary transition">{user.username}</p>
                {/* <p className={`text-[10px] ${getRoleColorClass()} font-black uppercase italic tracking-widest`}>{getRoleLabel()}</p> */}
              </div>
              <img src={avatar} className="w-8 h-8 rounded-full border border-slate-200 group-hover:border-primary transition" alt="Avatar" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-24 sm:pb-6 italic font-medium">
        <Outlet />
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 z-40 pb-[env(safe-area-inset-bottom,20px)] shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
        <Link to="/patients" className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <i className="fa-solid fa-bed-pulse text-lg"></i>
          <span className="text-[10px] font-bold">Đi buồng</span>
        </Link>
        <Link to="/rx/inbox" className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <i className="fa-solid fa-inbox text-lg"></i>
          <span className="text-[10px] font-bold">Y lệnh</span>
        </Link>
        <Link to="/medication" className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <i className="fa-solid fa-microscope text-lg"></i>
          <span className="text-[10px] font-bold">Thuốc</span>
        </Link>
      </nav>
    </div>
  );
};
