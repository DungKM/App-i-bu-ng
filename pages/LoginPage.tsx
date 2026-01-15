import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Mock check: Password must be '123'
      if (password !== '123') {
          setError('Sai mật khẩu');
          setIsSubmitting(false);
          return;
      }

      const success = await login(username);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('Tên đăng nhập không tồn tại');
      }
    } catch (err) {
      setError('Đã có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">
         <div className="w-full p-8">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white text-3xl mb-4 shadow-lg shadow-primary/30">
                    <i className="fa-solid fa-hospital"></i>
                </div>
                <h1 className="text-2xl font-bold text-slate-800">MediRound</h1>
                <p className="text-slate-500">Hệ thống hỗ trợ đi buồng & điều trị</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center">
                        <i className="fa-solid fa-circle-exclamation mr-2"></i> {error}
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tên đăng nhập</label>
                    <div className="relative">
                        <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                            placeholder="doctor hoặc nurse"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu</label>
                    <div className="relative">
                        <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input 
                            type="password" 
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                            placeholder="Mặc định: 123"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-sky-600 transition shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <i className="fa-solid fa-circle-notch fa-spin"></i> Đang đăng nhập...
                        </>
                    ) : (
                        'Đăng nhập'
                    )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                <p className="font-semibold mb-2">Tài khoản Demo:</p>
                <div className="flex justify-center gap-4">
                    <span className="bg-slate-50 px-2 py-1 rounded border">doctor / 123</span>
                    <span className="bg-slate-50 px-2 py-1 rounded border">nurse / 123</span>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};