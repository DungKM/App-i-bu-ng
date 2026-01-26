import React, { useMemo, useState } from "react";
import { MARItem } from "@/types";

type Props = {
  item: MARItem;
  maxQty: number; // số lượng đang có => giới hạn trả
  patientName: string;
  onConfirm: (payload: { qty: number; reason?: string; note?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export const MedicationReturnModal: React.FC<Props> = ({
  item,
  maxQty,
  patientName,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  const [qty, setQty] = useState<number>(Math.min(1, Math.max(0, maxQty)));
  const [reason, setReason] = useState<string>("THUA_LIEU");
  const [note, setNote] = useState<string>("");

  const safeMax = useMemo(() => Math.max(0, maxQty), [maxQty]);
  const disabled = safeMax <= 0 || qty <= 0 || qty > safeMax;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-[28px] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Trả thuốc
          </div>
          <div className="mt-1 text-lg font-black text-slate-900">
            {item.drugName}
          </div>
          <div className="mt-1 text-xs font-bold text-slate-400">
            BN: <span className="text-slate-700">{patientName}</span> • Giờ:
            <span className="text-slate-700"> {item.scheduledTime}</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-500">Số lượng đang có</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{safeMax}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Bạn chỉ có thể trả tối đa bằng số lượng đang có.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Số lượng trả
              </label>
              <input
                type="number"
                min={0}
                max={safeMax}
                value={Number.isFinite(qty) ? qty : 0}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  // clamp
                  setQty(Math.max(0, Math.min(safeMax, v)));
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-black text-slate-900 outline-none focus:ring-4 focus:ring-primary/10"
              />
              <div className="mt-1 text-[10px] text-slate-400">
                Max: <span className="font-bold">{safeMax}</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Lý do
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10"
              >
                <option value="THUA_LIEU">Thừa liều</option>
                <option value="DOI_Y_LENH">Đổi y lệnh</option>
                <option value="BENH_NHAN_KHONG_DUNG">BN không dùng</option>
                <option value="KHAC">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              Ghi chú
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Nhập ghi chú (nếu có)..."
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          {safeMax <= 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-[12px] font-bold">
              Không có thuốc để trả (số lượng đang có = 0).
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-black text-xs uppercase text-slate-600 hover:bg-slate-50"
            disabled={isLoading}
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={() => onConfirm({ qty, reason, note })}
            disabled={disabled || isLoading}
            className={`flex-1 rounded-2xl px-5 py-3 font-black text-xs uppercase shadow-lg transition active:scale-[0.99]
              ${
                disabled || isLoading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-sky-600 shadow-primary/20"
              }`}
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận trả"}
          </button>
        </div>
      </div>
    </div>
  );
};
