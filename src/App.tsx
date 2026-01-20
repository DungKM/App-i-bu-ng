
import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
// import "@fortawesome/fontawesome-free/css/all.min.css";

// Lazy Load Pages for Performance
const PatientList = lazyNamed(() => import('@/pages/PatientList'), 'PatientList');
const PatientDetail = lazyNamed(() => import('@/pages/PatientDetail'), 'PatientDetail');
const MedicationList = lazyNamed(() => import('@/pages/MedicationList'), 'MedicationList');
const MedicationDetail = lazyNamed(() => import('@/pages/MedicationDetail'), 'MedicationDetail');
const WardStock = lazyNamed(() => import('@/pages/WardStock'), 'WardStock');
const MedicationDashboard = lazyNamed(() => import('@/pages/MedicationDashboard'), 'MedicationDashboard');
const RxInbox = lazyNamed(() => import('@/pages/RxInbox'), 'RxInbox');
const TreatmentList = lazyNamed(() => import('@/pages/TreatmentList'), 'TreatmentList');
const TreatmentDetail = lazyNamed(() => import('@/pages/TreatmentDetail'), 'TreatmentDetail');
const SurgeryList = lazyNamed(() => import('@/pages/SurgeryList'), 'SurgeryList');
const SurgeryDetail = lazyNamed(() => import('@/pages/SurgeryDetail'), 'SurgeryDetail');
const RoundDashboard = lazyNamed(() => import('@/pages/RoundDashboard'), 'RoundDashboard');
const UserProfile = lazyNamed(() => import('@/pages/UserProfile'), 'UserProfile');
const SyncDashboard = lazyNamed(() => import('@/pages/SyncDashboard'), 'SyncDashboard');
const ComplianceDashboard = lazyNamed(() => import('@/pages/ComplianceDashboard'), 'ComplianceDashboard');



function lazyNamed<T extends React.ComponentType<any>>(
  loader: () => Promise<any>,
  name: string
) {
  return React.lazy(async () => {
    const mod = await loader();
    const comp = mod[name];
    if (!comp) {
      throw new Error(`Lazy import failed: module has no export named "${name}"`);
    }
    return { default: comp as T };
  });
}

// Optimized Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // Data stays fresh for 1 minute (reduces fetching)
      gcTime: 1000 * 60 * 10, // Cache garbage collection after 10 mins
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1 // Only retry once
    }
  }
});

// Fixed ErrorBoundary to properly resolve inherited React.Component properties in TypeScript
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  // Use property initialization for state to better assist TypeScript's type inference
  state = { hasError: false, error: null as any };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 text-red-900 h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-2">Đã xảy ra lỗi hệ thống</h1>
          <p className="mb-4">Vui lòng tải lại trang hoặc liên hệ IT.</p>
          <pre className="text-left bg-white p-4 rounded shadow text-xs overflow-auto max-w-lg border border-red-200">
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Tải lại trang</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center"><i className="fa-solid fa-circle-notch fa-spin text-primary text-3xl"></i></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const LoadingSpinner = () => (
  <div className="h-full w-full flex items-center justify-center py-20">
    <i className="fa-solid fa-circle-notch fa-spin text-primary text-3xl"></i>
  </div>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HashRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    {/* Default Home: Patient List */}
                    <Route path="/" element={<Navigate to="/patients" replace />} />
                    <Route path="/patients" element={<PatientList />} />
                    <Route path="/patient/:id" element={<PatientDetail />} />
                    
                    {/* Module: Treatment (Đi buồng) */}
                    <Route path="/treatment" element={<TreatmentList />} />
                    <Route path="/treatment/:id" element={<TreatmentDetail />} />

                    {/* Module: Surgery (DVKT) */}
                    <Route path="/surgery" element={<SurgeryList />} />
                    <Route path="/surgery/:groupId" element={<SurgeryDetail />} />

                    {/* Module: Medication (Dược) */}
                    <Route path="/rx/inbox" element={<RxInbox />} />
                    <Route path="/medication" element={<MedicationList />} />
                    <Route path="/medication/dashboard" element={<MedicationDashboard />} />
                    <Route path="/medication/ward-stock" element={<WardStock />} />
                    <Route path="/medication/:visitId" element={<MedicationDetail />} />
                    <Route path="/compliance/dashboard" element={<ComplianceDashboard />} />

                    {/* Module: Rounds, Profile & System */}
                    <Route path="/rounds/dashboard" element={<RoundDashboard />} />
                    <Route path="/profile" element={<UserProfile />} />
                    <Route path="/sync/dashboard" element={<SyncDashboard />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </HashRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
