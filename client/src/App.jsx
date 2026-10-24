import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout        from './components/layout/Layout.jsx';
import Dashboard     from './pages/Dashboard.jsx';
import ClientPage    from './pages/ClientPage.jsx';
import ClientEdit    from './pages/ClientEdit.jsx';
import InvoiceNew    from './pages/InvoiceNew.jsx';
import InvoiceView   from './pages/InvoiceView.jsx';
import AllInvoices   from './pages/AllInvoices.jsx';
import Reports       from './pages/Reports.jsx';
import Settings      from './pages/Settings.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index                        element={<Dashboard />} />
          <Route path="clients/new"           element={<ClientEdit />} />
          <Route path="clients/:id"           element={<ClientPage />} />
          <Route path="clients/:id/edit"      element={<ClientEdit />} />
          <Route path="invoices"              element={<AllInvoices />} />
          <Route path="invoices/new"          element={<InvoiceNew />} />
          <Route path="invoices/:id"          element={<InvoiceView />} />
          <Route path="invoices/:id/edit"     element={<InvoiceNew />} />
          <Route path="reports"               element={<Reports />} />
          <Route path="settings"              element={<Settings />} />
          <Route path="*"                     element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
