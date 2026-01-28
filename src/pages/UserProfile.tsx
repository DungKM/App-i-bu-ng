import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import avatar from "@/assets/avatar.jpg";
interface ProfileForm {
    name: string;
    avatar: string;
    password?: string;
}

export const UserProfile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [successMsg, setSuccessMsg] = useState('');
    
    const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
        defaultValues: {
            name: user?.name || '',
            avatar: user?.avatar || ''
        }
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data: ProfileForm) => api.updateProfile(user!.id, data),
        onSuccess: (updatedUser) => {
            updateUser(updatedUser);
            setSuccessMsg('Cập nhật thông tin thành công!');
            setTimeout(() => setSuccessMsg(''), 3000);
        },
        onError: () => {
            alert('Có lỗi xảy ra khi cập nhật.');
        }
    });

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto">
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                 <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <i className="fa-solid fa-user-gear text-primary"></i> Quản lý tài khoản
                 </h1>

                 {successMsg && (
                     <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 animate-fade-in">
                         <i className="fa-solid fa-circle-check"></i> {successMsg}
                     </div>
                 )}

                 <div className="flex flex-col md:flex-row gap-8">
                     <div className="flex flex-col items-center gap-4">
                         <div className="w-32 h-32 rounded-full border-4 border-slate-100 overflow-hidden shadow-sm">
                             <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                         </div>
                         <div className="text-center">
                             <p className="font-bold text-lg text-slate-800">{user.name}</p>
                             <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                 {user.role}
                             </span>
                         </div>
                     </div>

                     <form onSubmit={handleSubmit(d => updateProfileMutation.mutate(d))} className="flex-1 space-y-5">
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-1">Họ và tên</label>
                             <input 
                                {...register('name', { required: "Vui lòng nhập tên" })}
                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition" 
                             />
                             {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                         </div>
                         <div className="pt-4 border-t border-slate-100">
                             <h4 className="font-bold text-slate-700 mb-3"><i className="fa-solid fa-lock mr-2"></i>Đổi mật khẩu</h4>
                             <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                                 <input 
                                    type="password"
                                    {...register('password')}
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition" 
                                    placeholder="Để trống nếu không đổi"
                                 />
                             </div>
                         </div>

                         <div className="pt-4 flex justify-end">
                             <button 
                                type="submit" 
                                disabled={updateProfileMutation.isPending}
                                className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/30 hover:bg-sky-600 transition disabled:opacity-70 flex items-center gap-2"
                             >
                                 {updateProfileMutation.isPending ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                                 Lưu thay đổi
                             </button>
                         </div>
                     </form>
                 </div>
             </div>
        </div>
    );
};