import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Landing from '@/pages/Landing';
import Overview from '@/pages/Overview';
import Payments from '@/pages/Payments';
import BeneficiariesPage from '@/pages/Beneficiaries';
import WalletPage from '@/pages/Wallet';
import ActivityPage from '@/pages/Activity';
import ApiDocsPage from '@/pages/ApiDocs';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/beneficiaries" element={<BeneficiariesPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
