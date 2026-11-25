import { Button, Card, Group, SegmentedControl, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFileImport, IconPlus, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { normalizeName } from "../db/repo/customers";
import { listInvoices } from "../db/repo/invoices";
import { isOpen } from "../domain/invoiceStatus";
import { formatMoney } from "../domain/money";
import { PageHeader } from "../ui/PageHeader";
import { useAsync } from "../ui/useAsync";
import { InvoiceDetail } from "./InvoiceDetail";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceTable } from "./InvoiceTable";

type Filter = "all" | "open" | "overdue" | "paid" | "cancelled";

export default function Invoices() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = (params.get("f") as Filter) || "open";
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [formOpened, form] = useDisclosure(false);
  const { data = [], reload } = useAsync(() => listInvoices(), []);

  const rows = useMemo(() => {
    const n = normalizeName(q);
    return data.filter((i) => {
      if (filter === "open" && !isOpen(i.status)) return false;
      if (filter === "overdue" && i.status !== "overdue") return false;
      if (filter === "paid" && i.status !== "paid") return false;
      if (filter === "cancelled" && i.status !== "cancelled") return false;
      return !n || i.number.toLowerCase().includes(q.trim().toLowerCase()) || normalizeName(i.customerName).includes(n);
    });
  }, [data, filter, q]);

  const sumRemaining = rows.reduce((s, i) => s + (i.status === "cancelled" ? 0 : i.remaining), 0);
  const sumGross = rows.reduce((s, i) => s + (i.status === "cancelled" ? 0 : i.totalGross), 0);

  return (
    <>
      <PageHeader title="Faktúry">
        <Button variant="default" leftSection={<IconFileImport size={16} />} onClick={() => navigate("/import")}>
          Import z iDokladu
        </Button>
        <Button leftSection={<IconPlus size={16} />} onClick={form.open}>
          Zadať ručne
        </Button>
      </PageHeader>
      <Group mb="md" justify="space-between">
        <SegmentedControl
          value={filter}
          onChange={(f) => setParams({ f })}
          data={[
            { value: "open", label: "Neuhradené" },
            { value: "overdue", label: "Po splatnosti" },
            { value: "paid", label: "Uhradené" },
            { value: "cancelled", label: "Stornované" },
            { value: "all", label: "Všetky" },
          ]}
        />
        <TextInput placeholder="Číslo alebo odberateľ" leftSection={<IconSearch size={16} />} value={q} onChange={(e) => setQ(e.currentTarget.value)} />
      </Group>
      <Card withBorder p={0}>
        <InvoiceTable invoices={rows} onOpen={(i) => setDetail(i.id)} empty={data.length ? "Žiadne faktúry v tomto filtri." : "Zatiaľ žiadne faktúry. Importujte export z iDokladu."} />
      </Card>
      <Group justify="flex-end" mt="sm" gap="xl">
        <Text size="sm" c="dimmed">
          Počet: {rows.length}
        </Text>
        <Text size="sm">Spolu s DPH: {formatMoney(sumGross)}</Text>
        <Text size="sm" fw={600}>
          Zostáva uhradiť: {formatMoney(sumRemaining)}
        </Text>
      </Group>
      <InvoiceDetail invoiceId={detail} onClose={() => setDetail(null)} onChanged={reload} />
      <InvoiceForm opened={formOpened} onClose={form.close} onSaved={reload} />
    </>
  );
}
