import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/services/auth.api";
import { UserModal } from "@/components/UserModal";
import { ResetPasswordModal } from "@/components/ResetPasswordModal";
import * as XLSX from "xlsx";

export const UserAdminPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [resetUser, setResetUser] = useState<any>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20; // đổi tuỳ ý
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: authApi.getDepartments
  });

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: authApi.getUsers
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => authApi.updateStatus(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });



  const importMutation = useMutation({
    mutationFn: (payload: any[]) => authApi.importUsers(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });

  const handleImportExcel = async (file: File) => {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });

    // Tìm sheet có dữ liệu tài khoản (tránh đọc nhầm sheet "Hướng dẫn")
    let rows: any[] = [];
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const candidate = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];
      if (candidate.length > 0) {
        const first = candidate[0] as any;
        const hasUser = first["username (*)"] !== undefined || first.username !== undefined || first.UserName !== undefined;
        if (hasUser) { rows = candidate; break; }
      }
    }
    if (rows.length === 0) {
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }) as any[];
    }

    const payload = rows
      .map((r: any) => ({
        username: String(r["username (*)"] || r.username || r.UserName || "").trim(),
        idKhoa: String(r["idKhoa"] || r["ID Khoa"] || "").trim() || null,
        role: String(r["role (*)"] || r.role || "").trim().toLowerCase(),
        password: "admin123",
        isActive: true,
      }))
      .filter((x) => x.username);

    if (payload.length === 0) {
      alert("Không có dữ liệu hợp lệ trong file");
      return;
    }

    const validRoles = new Set(["admin", "doctor", "nurse"]);
    const bad = payload.filter((x) => !validRoles.has(x.role));
    if (bad.length) {
      alert(`Role không hợp lệ ở ${bad.length} dòng. Role chỉ nhận: admin/doctor/nurse`);
      return;
    }

    importMutation.mutate(payload);
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      await authApi.downloadUsersImportTemplate();
    } catch (err: any) {
      alert(err.message || "Không thể tải file mẫu");
    } finally {
      setIsDownloading(false);
    }
  };

  const normalized = (s: any) => String(s ?? "").toLowerCase().trim();

  const selectedDeptName = useMemo(() => {
    if (departmentFilter === "all") return "Tất cả khoa/phòng";
    const found = (departments || []).find((d: any) => String(d._id || d.id) === String(departmentFilter));
    return found?.name || "Chọn khoa/phòng";
  }, [departmentFilter, departments]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!deptDropdownRef.current) return;
      if (!deptDropdownRef.current.contains(e.target as Node)) {
        setIsDeptOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDeptOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredUsers = (users || []).filter((u: any) => {
    const selectedDept = departmentFilter !== "all";
    if (selectedDept) {
      const userDeptId = typeof u.idKhoa === "string" ? u.idKhoa : u.idKhoa?._id;
      if (userDeptId !== departmentFilter) return false;
    }

    const q = normalized(search);
    if (!q) return true;

    return (
      normalized(u.username).includes(q) ||
      normalized(u.fullName).includes(q) ||
      normalized(u.role).includes(q) ||
      normalized(u.idKhoa?.name).includes(q) ||
      normalized(u.idKhoa?.idHis).includes(q)
    );
  });

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Nếu search làm giảm số trang, kéo page về hợp lệ
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const pagedUsers = filteredUsers.slice(start, end);

  if (isLoading) return (
    <div className="p-20 text-center font-black animate-pulse text-sky-400 uppercase tracking-widest">
      Đang kết nối cơ sở dữ liệu...
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-10 space-y-8">

      {/* --- HEADER BANNER --- */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1EADED] to-blue-600 text-white rounded-[24px] flex items-center justify-center text-3xl shadow-xl shadow-sky-200">
            <i className="fa-solid fa-users-gear"></i>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Quản trị nhân sự</h1>
            <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              {users?.length || 0} tài khoản hệ thống
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloading}
            className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <><i className="fa-solid fa-spinner animate-spin"></i> ĐANG TẢI...</>
            ) : (
              <><i className="fa-solid fa-file-arrow-down"></i> TẢI MẪU</>
            )}
          </button>
          <label className={`flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-sm shadow-sm transition-all cursor-pointer ${importMutation.isPending ? "opacity-60 cursor-not-allowed" : "hover:scale-105 active:scale-95"}`}>
            {importMutation.isPending ? (
              <><i className="fa-solid fa-spinner animate-spin"></i> ĐANG XỬ LÝ...</>
            ) : (
              <><i className="fa-solid fa-file-import"></i> IMPORT EXCEL</>
            )}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={importMutation.isPending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportExcel(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1EADED] text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-sky-100 hover:scale-105 active:scale-95 transition-all"
          >
            <i className="fa-solid fa-plus"></i> THÊM TÀI KHOẢN
          </button>
        </div>
      </div>
      <div className="w-full md:w-[620px]">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex-1">
            <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tài khoản, tên khoa, vai trò..."
              className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="text-slate-400 hover:text-slate-700"
                title="Xoá"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>


          <div className="relative md:w-[260px]" ref={deptDropdownRef}>
            <button
              type="button"
              onClick={() => setIsDeptOpen((v) => !v)}
              className={`w-full flex items-center justify-between gap-3 bg-slate-50 border rounded-2xl px-4 py-3 ${isDeptOpen ? "border-sky-300 ring-2 ring-sky-200" : "border-slate-200"}`}
              aria-expanded={isDeptOpen}
            >
              <div className="flex items-center gap-3 min-w-0">
                <i className="fa-solid fa-building-user text-slate-400"></i>
                <span className="text-sm font-black text-slate-700 truncate">{selectedDeptName}</span>
              </div>
              <i className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${isDeptOpen ? "rotate-180" : ""}`}></i>
            </button>

            {isDeptOpen && (
              <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                <div className="max-h-[50vh] md:max-h-72 overflow-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setDepartmentFilter("all");
                      setIsDeptOpen(false);
                      setPage(1);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-black whitespace-normal leading-snug ${departmentFilter === "all" ? "bg-sky-50 text-sky-700" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    Tất cả khoa/phòng
                  </button>
                  {(departments || []).map((d: any) => {
                    const value = String(d._id || d.id);
                    const active = value === String(departmentFilter);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setDepartmentFilter(value);
                          setIsDeptOpen(false);
                          setPage(1);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-black whitespace-normal leading-snug ${active ? "bg-sky-50 text-sky-700" : "text-slate-700 hover:bg-slate-50"}`}
                      >
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* --- DANH SÁCH DẠNG BẢNG --- */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tài khoản</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Vai trò</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Khoa / Phòng</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedUsers?.map((user: any) => (
                <tr key={user._id || user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-mono text-slate-400">@{user.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-[#1EADED]'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-slate-500 uppercase">
                    {user.idKhoa?.name || <span className="text-slate-300 italic uppercase">Chưa phân khoa</span>}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => statusMutation.mutate({ id: user._id, active: !user.isActive })}
                      className={`flex items-center gap-2 font-black text-[10px] uppercase transition-all ${user.isActive ? 'text-emerald-500' : 'text-slate-300'
                        }`}
                    >
                      <i className={`fa-solid ${user.isActive ? 'fa-toggle-on text-lg' : 'fa-toggle-off text-lg'}`}></i>
                      {user.isActive ? 'Đang mở' : 'Đã khóa'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsModalOpen(true);
                        }}
                        className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition-all"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        onClick={() => {
                          setResetUser(user);
                          setIsResetModalOpen(true);
                        }}
                        className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-amber-500 rounded-xl transition-all"
                      >
                        <i className="fa-solid fa-key"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50/30 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase">
            Hiển thị {total === 0 ? 0 : start + 1}-{Math.min(end, total)} / {total} kết quả
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className={`px-4 py-2 bg-white border rounded-xl text-xs font-black ${safePage === 1
                ? "border-slate-200 text-slate-300 cursor-not-allowed"
                : "border-slate-200 text-slate-600 hover:border-primary"
                }`}
            >
              Đầu
            </button>

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className={`px-4 py-2 bg-white border rounded-xl text-xs font-black ${safePage === 1
                ? "border-slate-200 text-slate-300 cursor-not-allowed"
                : "border-slate-200 text-slate-600 hover:border-primary"
                }`}
            >
              Trình trước
            </button>

            <span className="px-3 text-xs font-black text-slate-500">
              Trang {safePage}/{totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className={`px-4 py-2 bg-white border rounded-xl text-xs font-black ${safePage === totalPages
                ? "border-slate-200 text-slate-300 cursor-not-allowed"
                : "border-slate-200 text-slate-600 hover:border-primary"
                }`}
            >
              Trang sau
            </button>

            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className={`px-4 py-2 bg-white border rounded-xl text-xs font-black ${safePage === totalPages
                ? "border-slate-200 text-slate-300 cursor-not-allowed"
                : "border-slate-200 text-slate-600 hover:border-primary"
                }`}
            >
              Cuối
            </button>
          </div>
        </div>
        <UserModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          data={selectedUser}
          departments={departments}
        />
        <ResetPasswordModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          user={resetUser}
        />
      </div>
    </div>
  );
};
