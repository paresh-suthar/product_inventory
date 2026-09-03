import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ServerInventoryPage } from './pages/ServerInventoryPage';
import { ProvidersPage } from './pages/ProvidersPage';
import { ClientsPage } from './pages/ClientsPage';
import { BanksPage } from './pages/BanksPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { CurrenciesPage } from './pages/CurrenciesPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/servers" element={<ServerInventoryPage />} />
              <Route path="/providers" element={<ProvidersPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/banks" element={<BanksPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/currencies" element={<CurrenciesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
