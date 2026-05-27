// src/pages/DepartmentAdminPage.tsx
import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { authApi } from "@/services/auth.api";
import { DepartmentModal } from "@/components/DepartmentModal";

export const DepartmentAdminPage = () => {
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [importResult, setImportResult] = useState<any>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const { data: departments, isLoading } = useQuery({
        queryKey: ["departments"],
        queryFn: authApi.getDepartments
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => authApi.deleteDepartment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            alert("Đã xóa thành công!");
        },
        onError: (error: any) => alert(error.message)
    });

    const importMutation = useMutation({
        mutationFn: (departments: any[]) => authApi.importDepartments(departments),
        onSuccess: (result: any) => {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            setImportResult(result);
        },
        onError: (error: any) => alert(error.message),
    });

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa ${name}?`)) {
            deleteMutation.mutate(id);
        }
    };

    const handleDownloadTemplate = async () => {
        setIsDownloading(true);
        try {
            await authApi.downloadDepartmentTemplate();
        } catch (err: any) {
            alert(err.message || "Không thể tải file mẫu");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleImportExcel = async (file: File) => {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];

        const departments = rows
            .map((r: any) => ({
                name: String(r.name || r["name (*)"] || r["Tên đơn vị"] || "").trim(),
                type: String(r.type || r["type (*)"] || r["Loại"] || "").trim().toUpperCase(),
                idHis: String(r.idHis || r["ID HIS"] || "").trim() || undefined,
                parentIdHis: String(r.parentIdHis || r["ID HIS Khoa cha"] || "").trim() || undefined,
            }))
            .filter((d: any) => d.name);

        if (departments.length === 0) {
            alert("Không có dữ liệu hợp lệ trong file");
            return;
        }

        setImportResult(null);
        importMutation.mutate(departments);
    };

    const normalized = (value: unknown) => String(value ?? "").toLowerCase().trim();

    const filteredDepartments = useMemo(() => {
        const q = normalized(search);
        if (!q) return departments || [];

        return (departments || []).filter((dept: any) => {
            const typeLabel = dept.type === "KHOA" ? "khoa chủ quản" : "phòng trực thuộc";

            return (
                normalized(dept.name).includes(q) ||
                normalized(dept.type).includes(q) ||
                normalized(typeLabel).includes(q) ||
                normalized(dept.parentName).includes(q) ||
                normalized(dept.idHis).includes(q)
            );
        });
    }, [departments, search]);

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-10 space-y-8">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-5 md:flex-row md:justify-between md:items-center">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-[24px] flex items-center justify-center text-3xl shadow-xl shadow-purple-100">
                        <i className="fa-solid fa-sitemap"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Cấu trúc tổ chức</h1>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Quản lý Khoa & Phòng trực thuộc</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 items-center justify-end">
                    <button
                        onClick={handleDownloadTemplate}
                        disabled={isDownloading}
                        className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-lg hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? (
                            <><i className="fa-solid fa-spinner animate-spin"></i> ĐANG TẢI...</>
                        ) : (
                            <><i className="fa-solid fa-file-arrow-down"></i> TẢI MẪU</>
                        )}
                    </button>
                    <label className={`flex items-center gap-2 bg-sky-500 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-lg transition-all cursor-pointer ${importMutation.isPending ? "opacity-60 cursor-not-allowed" : "hover:scale-105"}`}>
                        {importMutation.isPending ? (
                            <><i className="fa-solid fa-spinner animate-spin"></i> ĐANG XỬ LÝ...</>
                        ) : (
                            <><i className="fa-solid fa-file-import"></i> IMPORT EXCEL</>
                        )}
                        <input
                            type="file"
                            accept=".xlsx,.xls"
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
                        onClick={() => { setEditData(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg hover:scale-105 transition-all"
                    >
                        <i className="fa-solid fa-plus"></i> THÊM MỚI
                    </button>
                </div>
            </div>

            {importResult && (
                <div className={`bg-white p-6 rounded-[28px] border shadow-sm ${importResult.errors?.length > 0 ? "border-amber-200" : "border-emerald-200"}`}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-black text-slate-700 text-sm uppercase tracking-tight">
                            <i className={`fa-solid ${importResult.errors?.length > 0 ? "fa-triangle-exclamation text-amber-500" : "fa-circle-check text-emerald-500"} mr-2`}></i>
                            Kết quả import
                        </span>
                        <button onClick={() => setImportResult(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3 mb-3">
                        <span className="text-xs font-black bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl">
                            <i className="fa-solid fa-plus mr-1"></i>Thêm mới: {importResult.data?.inserted ?? 0}
                        </span>
                        <span className="text-xs font-black bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl">
                            <i className="fa-solid fa-pen mr-1"></i>Cập nhật: {importResult.data?.updated ?? 0}
                        </span>
                        {importResult.errors?.length > 0 && (
                            <span className="text-xs font-black bg-red-100 text-red-600 px-3 py-1.5 rounded-xl">
                                <i className="fa-solid fa-circle-exclamation mr-1"></i>Lỗi: {importResult.errors.length} dòng
                            </span>
                        )}
                    </div>
                    {importResult.errors?.length > 0 && (
                        <div className="max-h-44 overflow-y-auto space-y-1.5">
                            {importResult.errors.map((err: any, i: number) => (
                                <div key={i} className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl font-bold">
                                    Dòng {err.row}{err.name ? ` (${err.name})` : ""}: {err.message}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-4 md:px-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:max-w-[420px] md:flex-1">
                            <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo tên đơn vị, loại, khoa cha..."
                                className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="text-slate-400 transition-colors hover:text-slate-700"
                                    title="Xóa tìm kiếm"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            )}
                        </div>
                        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                            {filteredDepartments.length} đơn vị
                        </div>
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            {/* <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">ID Phần mềm</th> */}
                            <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tên đơn vị</th>
                            <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Phân cấp</th>
                            <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredDepartments.map((dept: any) => (
                            <tr key={dept._id} className="hover:bg-purple-50/30 transition-colors group">
                                {/* <td className="px-8 py-4 font-mono text-xs font-bold text-slate-400">
                                    {dept.idHis || "N/A"}
                                </td> */}
                                <td className="px-6 py-4">
                                    <span className="font-black text-slate-700 uppercase text-sm tracking-tight">{dept.name}</span>
                                </td>
                                <td className="px-6 py-4">
                                    {dept.type === 'KHOA' ? (
                                        <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">KHOA CHỦ QUẢN</span>
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase w-fit">PHÒNG TRỰC THUỘC</span>
                                            <span className="text-[10px] font-bold text-slate-400 mt-1 italic">Thuộc: {dept.parentName || "..."}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => { setEditData(dept); setIsModalOpen(true); }}
                                        className="w-9 h-9 text-slate-300 hover:text-[#1EADED] transition-all"
                                    >
                                        <i className="fa-solid fa-pen-to-square"></i>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(dept._id, dept.name)}
                                        className="w-9 h-9 text-slate-300 hover:text-red-500 transition-all"
                                    >
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredDepartments.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-sm font-bold text-slate-400">
                                    Không tìm thấy khoa/phòng phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <DepartmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={editData}
                departments={departments || []}
            />
        </div>
    );
};
