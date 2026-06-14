export function buildAdvancedShiftStats(meds: any[], splits: any) {
  const shifts: any = {
    MORNING: { used: 0, pending: 0, returned: 0, total: 0 },
    NOON: { used: 0, pending: 0, returned: 0, total: 0 },
    AFTERNOON: { used: 0, pending: 0, returned: 0, total: 0 },
    NIGHT: { used: 0, pending: 0, returned: 0, total: 0 },
  };

  const shiftKeys = ["MORNING", "NOON", "AFTERNOON", "NIGHT"] as const;

  meds.forEach((m) => {
    const id = String(m.IdPhieuThuoc);
    const info = splits[id];
    const totalMedQty = Number(m.SoLuong ?? 1);

    // Kiểm tra có split nào > 0 không
    const hasAnySplit = shiftKeys.some((k) => Number(info?.splits?.[k] ?? 0) > 0);
    // Kiểm tra đã confirm ở ca nào chưa
    const confirmedAnyShift = shiftKeys.some((k) => info?.confirmedShifts?.includes(k));

    shiftKeys.forEach((k) => {
      const qtyInShift = Number(info?.splits?.[k] ?? 0);
      const isShiftConfirmed = info?.confirmedShifts?.includes(k) ?? false;

      if (qtyInShift > 0) {
        // Có chia ca — logic cũ
        shifts[k].total += qtyInShift;

        if (isShiftConfirmed) {
          shifts[k].used += qtyInShift;
        } else {
          const ret =
            info?.returnHistory?.reduce((s: number, h: any) => {
              return h.shift === k ? s + Number(h.quantity || 0) : s;
            }, 0) ?? 0;

          shifts[k].returned += ret;
          shifts[k].pending += Math.max(0, qtyInShift - ret);
        }
      } else if (!hasAnySplit) {
        // Không có chia ca nào — dùng SoLuong làm fallback
        if (isShiftConfirmed) {
          // Đã xác nhận dùng ở ca này
          shifts[k].total += totalMedQty;
          shifts[k].used += totalMedQty;
        } else if (!confirmedAnyShift) {
          // Chưa xác nhận ở bất kỳ ca nào → hiện là chờ dùng ở tất cả các ca
          const ret =
            info?.returnHistory?.reduce((s: number, h: any) => {
              return h.shift === k ? s + Number(h.quantity || 0) : s;
            }, 0) ?? 0;
          const pending = Math.max(0, totalMedQty - ret);
          if (pending > 0 || ret > 0) {
            shifts[k].total += totalMedQty;
            shifts[k].pending += pending;
            shifts[k].returned += ret;
          }
        }
        // Nếu đã confirm ở ca khác → không hiện pending ở ca này (thuốc đã dùng)
      }
    });
  });

  return shifts;
}