import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/services/auth.api";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";

type UserModalProps = {
    isOpen: boolean;
    onClose: () => void;
    data?: any;
    departments?: any[];
};

type UserFormData = {
    fullName: string;
    username: string;
    password: string;
    role: string;
    idKhoa: string;
};

export const UserModal = ({ isOpen, onClose, data, departments }: UserModalProps) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<UserFormData>({
        fullName: "",
        username: "",
        password: "",
        role: "nurse",
        idKhoa: "",
    });
    const [fieldErrors, setFieldErrors] = useState<{ username?: string }>({});

    useEffect(() => {
        if (data) {
            setFormData({
                fullName: data.fullName,
                username: data.username,
                password: "",
                role: data.role,
                idKhoa: data.idKhoa?._id || data.idKhoa || "",
            });
        } else {
            setFormData({
                fullName: "",
                username: "",
                password: "",
                role: "nurse",
                idKhoa: "",
            });
        }

        setFieldErrors({});
    }, [data, isOpen]);

    const handleChange = (field: keyof UserFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        if (field === "username" && fieldErrors.username) {
            setFieldErrors((prev) => ({ ...prev, username: undefined }));
        }
    };

    const mutation = useMutation({
        mutationFn: (payload: UserFormData) =>
            data ? authApi.updateUser(data._id, payload) : authApi.createUser(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(data ? "Cập nhật thành công!" : "Tạo tài khoản thành công!");
            onClose();
        },
        onError: (err: any) => {
            if (!data && err?.message === "Tên đăng nhập đã tồn tại") {
                setFieldErrors({ username: err.message });
                return;
            }

            toast.error(err?.message || "Không thể lưu tài khoản");
        },
    });

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-300">
                <h2 className="text-2xl font-black text-slate-800 uppercase mb-6 tracking-tighter">
                    {data ? "Cập nhật nhân sự" : "Thêm nhân sự mới"}
                </h2>

                <div className="space-y-4">
                    <div>
                        <input
                            placeholder="Tên đăng nhập"
                            value={formData.username}
                            onChange={(e) => handleChange("username", e.target.value)}
                            className={`w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none border transition-colors ${fieldErrors.username ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-transparent"}`}
                        />
                        {fieldErrors.username && (
                            <p className="text-sm font-bold text-red-500 mt-2">{fieldErrors.username}</p>
                        )}
                    </div>

                    {!data && (
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={formData.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none"
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <select
                            value={formData.role}
                            onChange={(e) => handleChange("role", e.target.value)}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700"
                        >
                            <option value="doctor">Bác sĩ</option>
                            <option value="nurse">Điều dưỡng</option>
                            <option value="admin">Quản trị viên</option>
                        </select>

                        <select
                            value={formData.idKhoa}
                            onChange={(e) => handleChange("idKhoa", e.target.value)}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700"
                        >
                            <option value="">Chọn Khoa/Phòng</option>
                            {departments?.map((d: any) => (
                                <option key={d._id} value={d.idHis}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs">
                        Hủy
                    </button>
                    <button
                        onClick={() => mutation.mutate(formData)}
                        disabled={mutation.isPending}
                        className="flex-1 py-4 bg-[#1EADED] text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-sky-100 disabled:opacity-50"
                    >
                        {mutation.isPending ? "Đang xử lý..." : "Lưu dữ liệu"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
