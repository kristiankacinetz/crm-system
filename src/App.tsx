import { AppShell, Group, NavLink, ScrollArea, Text, ThemeIcon } from "@mantine/core";
import {
  IconBuildingStore,
  IconClipboardList,
  IconFileImport,
  IconFileInvoice,
  IconFileText,
  IconLayoutDashboard,
  IconLayoutKanban,
  IconSettings,
} from "@tabler/icons-react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Invoices from "./pages/Invoices";
import ImportPage from "./pages/Import";
import Quotes from "./pages/Quotes";
import QuoteEdit from "./pages/QuoteEdit";
import Pipeline from "./pages/Pipeline";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";

const NAV = [
  { to: "/", label: "Prehľad", icon: IconLayoutDashboard },
  { to: "/customers", label: "Zákazníci", icon: IconBuildingStore },
  { to: "/invoices", label: "Faktúry", icon: IconFileInvoice },
  { to: "/import", label: "Import z iDokladu", icon: IconFileImport },
  { to: "/pipeline", label: "Pipeline", icon: IconLayoutKanban },
  { to: "/quotes", label: "Ponuky", icon: IconFileText },
  { to: "/orders", label: "Zákazky", icon: IconClipboardList },
  { to: "/settings", label: "Nastavenia", icon: IconSettings },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = (to: string) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));
  return (
    <AppShell navbar={{ width: 230, breakpoint: 0 }} padding="lg">
      <AppShell.Navbar p="sm">
        <Group mb="md" px="xs" gap="xs">
          <ThemeIcon size="lg" radius="md">
            <IconBuildingStore size={20} />
          </ThemeIcon>
          <Text fw={700} size="lg">
            CRM
          </Text>
        </Group>
        <AppShell.Section grow component={ScrollArea}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              label={n.label}
              leftSection={<n.icon size={18} />}
              active={active(n.to)}
              onClick={() => navigate(n.to)}
              style={{ borderRadius: 8 }}
            />
          ))}
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/quotes/:id" element={<QuoteEdit />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
