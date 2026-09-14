import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { AuthorApplyPage } from '@/features/auth/pages/AuthorApplyPage';
import { PendingRoute } from '@/routes/PendingRoute';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { MyBooksPage } from '@/features/books/pages/MyBooksPage';
import { NewBookPage } from '@/features/books/pages/NewBookPage';
import { EditBookPage } from '@/features/books/pages/EditBookPage';
import { BookDetailPage } from '@/features/books/pages/BookDetailPage';
import { MySeriesPage } from '@/features/series/pages/MySeriesPage';
import { SeriesDetailPage } from '@/features/series/pages/SeriesDetailPage';
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

        {/* `/pending` n'etait derriere aucun garde : rien n'en faisait jamais
            sortir. Un auteur approuve rechargeait la page — c'est tout ce que
            fait « Verifier le statut » — et retombait sur l'ecran d'attente,
            indefiniment. Le seul moyen d'entrer etait de taper une autre URL. */}
        <Route path="/pending" element={<PendingRoute />} />

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
          <Route path="/books/:id/edit" element={<EditBookPage />} />
          <Route path="/series" element={<MySeriesPage />} />
          <Route path="/series/:id" element={<SeriesDetailPage />} />
          <Route path="/earnings" element={<EarningsPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
