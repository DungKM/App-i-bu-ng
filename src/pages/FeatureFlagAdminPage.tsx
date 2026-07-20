import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { featureFlagApi } from "@/services/featureFlag.api";

type FeatureFlag = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  toggleHistory?: { isEnabled: boolean; reason: string; performedBy: string; at: string }[];
};

const emptyForm = { code: "", name: "", description: "", reason: "" };

export const FeatureFlagAdminPage = () => {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editFlag, setEditFlag] = useState<FeatureFlag | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toggleModal, setToggleModal] = useState<{ flag: FeatureFlag; next: boolean } | null>(null);
  const [toggleReason, setToggleReason] = useState("");
  const [historyFlag, setHistoryFlag] = useState<FeatureFlag | null>(null);
  const [search, setSearch] = useState("");

  const { data: flags = [], isLoading } = useQuery<FeatureFlag[]>({
    queryKey: ["feature-flags"],
    queryFn: featureFlagApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: featureFlagApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      closeModal();
    },
    onError: (e: any) => alert(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ code, payload }: { code: string; payload: any }) =>
      featureFlagApi.update(code, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      closeModal();
    },
    onError: (e: any) => alert(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ code, isEnabled, reason }: { code: string; isEnabled: boolean; reason: string }) =>
      featureFlagApi.toggle(code, { isEnabled, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      setToggleModal(null);
      setToggleReason("");
    },
    onError: (e: any) => alert(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: featureFlagApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feature-flags"] }),
    onError: (e: any) => alert(e.message),
  });

  const openCreate = () => {
    setEditFlag(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (flag: FeatureFlag) => {
    setEditFlag(flag);
    setForm({ code: flag.code, name: flag.name, description: flag.description || "", reason: "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditFlag(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFlag) {
      updateMutation.mutate({ code: editFlag.code, payload: { name: form.name, description: form.description } });
    } else {
      createMutation.mutate({ code: form.code, name: form.name, description: form.description, reason: form.reason });
    }
  };

  const handleDelete = (flag: FeatureFlag) => {
    if (window.confirm(`Xóa flag "${flag.code}"? Hành động không thể hoàn tác.`)) {
      deleteMutation.mutate(flag.code);
    }
  };

  const filtered = flags.filter(
    (f) =>
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.name.toLowerCase().includes(search.toLowerCase())
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-10 space-y-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-5 md:flex-row md:justify-between md:items-center">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white rounded-[24px] flex items-center justify-center text-3xl shadow-xl shadow-violet-100">
            <i className="fa-solid fa-toggle-on"></i>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Config Tính Năng</h1>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Bật / tắt tính năng theo môi trường</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg hover:scale-105 transition-all"
        >
          <i className="fa-solid fa-plus"></i> THÊM FLAG
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-4 md:px-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:max-w-[380px] md:flex-1">
            <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo code hoặc tên..."
              className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-700">
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            {filtered.length} flags
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Code</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tên / Mô tả</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                  <i className="fa-solid fa-circle-notch fa-spin text-violet-500 text-2xl"></i>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm font-bold text-slate-400">
                  Không có feature flag nào.
                </td>
              </tr>
            ) : (
              filtered.map((flag) => (
                <tr key={flag._id} className="hover:bg-violet-50/20 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-black text-violet-700 bg-violet-50 px-2 py-1 rounded-lg">
                      {flag.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-700 text-sm">{flag.name}</p>
                    {flag.description && (
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{flag.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setToggleModal({ flag, next: !flag.isEnabled });
                        setToggleReason("");
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all hover:scale-105 ${
                        flag.isEnabled
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <i className={`fa-solid ${flag.isEnabled ? "fa-toggle-on text-emerald-500" : "fa-toggle-off"}`}></i>
                      {flag.isEnabled ? "BẬT" : "TẮT"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setHistoryFlag(flag)}
                      className="w-9 h-9 text-slate-300 hover:text-amber-500 transition-all"
                      title="Lịch sử"
                    >
                      <i className="fa-solid fa-clock-rotate-left"></i>
                    </button>
                    <button
                      onClick={() => openEdit(flag)}
                      className="w-9 h-9 text-slate-300 hover:text-[#1EADED] transition-all"
                      title="Sửa"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(flag)}
                      className="w-9 h-9 text-slate-300 hover:text-red-500 transition-all"
                      title="Xóa"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                {editFlag ? "Cập nhật Flag" : "Tạo Flag mới"}
              </h2>
              <button onClick={closeModal} className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editFlag && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="VD: SHOW_DRUG_SPLIT"
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Tự động uppercase. Không thể thay đổi sau khi tạo.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Tên hiển thị <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="VD: Hiển thị tính năng chia thuốc"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả ngắn về tính năng này..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
                />
              </div>

              {!editFlag && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Lý do tạo <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.reason}
                    onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                    placeholder="VD: Triển khai tính năng chia thuốc Q3/2025"
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 rounded-2xl bg-violet-600 text-white font-black text-sm shadow-lg hover:bg-violet-700 transition-all disabled:opacity-60"
                >
                  {isPending ? <i className="fa-solid fa-spinner animate-spin"></i> : editFlag ? "Lưu thay đổi" : "Tạo Flag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Modal */}
      {toggleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 mx-4">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${toggleModal.next ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                <i className={`fa-solid ${toggleModal.next ? "fa-toggle-on" : "fa-toggle-off"}`}></i>
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  {toggleModal.next ? "Bật" : "Tắt"} Flag
                </h2>
                <p className="text-xs font-mono font-black text-violet-600">{toggleModal.flag.code}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Lý do <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={toggleReason}
                  onChange={(e) => setToggleReason(e.target.value)}
                  placeholder={`VD: ${toggleModal.next ? "Bật" : "Tắt"} theo yêu cầu trưởng khoa...`}
                  rows={3}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setToggleModal(null); setToggleReason(""); }}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  disabled={!toggleReason.trim() || toggleMutation.isPending}
                  onClick={() =>
                    toggleMutation.mutate({
                      code: toggleModal.flag.code,
                      isEnabled: toggleModal.next,
                      reason: toggleReason.trim(),
                    })
                  }
                  className={`flex-1 py-3 rounded-2xl font-black text-sm text-white shadow-lg transition-all disabled:opacity-60 ${toggleModal.next ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-600 hover:bg-slate-700"}`}
                >
                  {toggleMutation.isPending ? <i className="fa-solid fa-spinner animate-spin"></i> : `Xác nhận ${toggleModal.next ? "bật" : "tắt"}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg p-8 mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Lịch sử toggle</h2>
                <p className="text-xs font-mono font-black text-violet-600">{historyFlag.code}</p>
              </div>
              <button onClick={() => setHistoryFlag(null)} className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {!historyFlag.toggleHistory?.length ? (
                <p className="text-center text-sm font-bold text-slate-400 py-8">Chưa có lịch sử.</p>
              ) : (
                [...(historyFlag.toggleHistory || [])].reverse().map((h, i) => (
                  <div key={i} className="flex gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${h.isEnabled ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"}`}>
                      <i className={`fa-solid ${h.isEnabled ? "fa-toggle-on" : "fa-toggle-off"}`}></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-700">
                        {h.isEnabled ? "BẬT" : "TẮT"} &nbsp;·&nbsp;
                        <span className="text-slate-400 font-bold">{h.performedBy}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium italic mt-0.5">{h.reason}</p>
                      <p className="text-[10px] text-slate-300 font-bold mt-1">
                        {h.at ? new Date(h.at).toLocaleString("vi-VN") : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
