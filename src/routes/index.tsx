import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { AuthorApplyPage } from '@/features/auth/pages/AuthorApplyPage';
import { PendingPage } from '@/features/auth/pages/PendingPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { MyBooksPage } from '@/features/books/pages/MyBooksPage';
import { NewBookPage } from '@/features/books/pages/NewBookPage';
import { BookDetailPage } from '@/features/books/pages/BookDetailPage';
import { EarningsPage } from '@/features/earnings/pages/EarningsPage';
import { StatisticsPage } from '@/features/dashboard/pages/StatisticsPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/apply" element={<AuthorApplyPage />} />
        </Route>

        <Route path="/pending" element={<PendingPage />} />

        {/* Protected */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/books" element={<MyBooksPage />} />
          <Route path="/books/new" element={<NewBookPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route path="/earnings" element={<EarningsPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
