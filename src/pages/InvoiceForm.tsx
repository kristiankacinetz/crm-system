import { Button, Checkbox, Grid, Group, Modal, TextInput, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";
import { listCustomers } from "../db/repo/customers";
import { createInvoice, updateInvoice, type InvoiceInput, type InvoiceView } from "../db/repo/invoices";
import { getSettings } from "../db/repo/settings";
import { addDays, todayIso } from "../domain/dates";
import { CustomerSelect, DateField, MoneyInput, nn } from "../ui/fields";
import { attempt } from "../ui/notify";
import { useAsync } from "../ui/useAsync";

const empty = (): InvoiceInput => ({
  number: "",
  variableSymbol: null,
  customerId: null,
  orderId: null,
  issueDate: todayIso(),
  taxableDate: null,
  dueDate: addDays(todayIso(), 14),
  currency: "EUR",
  totalNet: 0,
  totalVat: 0,
  totalGross: 0,
  cancelled: false,
  note: null,
});

/** Manual entry fallback when an invoice is not in an iDoklad export yet. */
export function InvoiceForm({
  opened,
  onClose,
  invoice,
  customerId,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  invoice?: InvoiceView | null;
  customerId?: string;
  onSaved: () => void;
}) {
  const { data: customers } = useAsync(listCustomers, []);
  const [v, setV] = useState<InvoiceInput>(empty());
  const [vatRate, setVatRate] = useState(23);
  useEffect(() => {
    if (!opened) return;
    void getSettings().then((s) => setVatRate(s.defaultVatRate));
    if (invoice) {
      const { number, variableSymbol, customerId: cid, orderId, issueDate, taxableDate, dueDate, currency, totalNet, totalVat, totalGross, cancelled, note } = invoice;
      setV({ number, variableSymbol, customerId: cid, orderId, issueDate, taxableDate, dueDate, currency, totalNet, totalVat, totalGross, cancelled, note });
    } else setV({ ...empty(), customerId: customerId ?? null });
  }, [opened, invoice, customerId]);

  const setNet = (net: number) => {
    const vat = Math.round((net * vatRate) / 100);
    setV({ ...v, totalNet: net, totalVat: vat, totalGross: net + vat });
  };

  async function submit() {
    const clean = { ...v, number: v.number.trim(), variableSymbol: nn(v.variableSymbol) ?? (v.number.replace(/\D/g, "") || null), note: nn(v.note) };
    const ok = await attempt(() => (invoice ? updateInvoice(invoice.id, clean) : createInvoice(clean)), "Faktúra uložená");
    if (ok) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={invoice ? `Faktúra ${invoice.number}` : "Nová faktúra (ručne)"} size="lg">
      <Grid>
        <Grid.Col span={6}>
          <TextInput label="Číslo faktúry" required value={v.number} onChange={(e) => setV({ ...v, number: e.currentTarget.value })} />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput label="Variabilný symbol" value={v.variableSymbol ?? ""} onChange={(e) => setV({ ...v, variableSymbol: e.currentTarget.value })} />
        </Grid.Col>
        <Grid.Col span={12}>
          <CustomerSelect customers={customers ?? []} value={v.customerId} onChange={(id) => setV({ ...v, customerId: id })} clearable />
        </Grid.Col>
        <Grid.Col span={4}>
          <DateField label="Vystavená" required value={v.issueDate} onChange={(d) => setV({ ...v, issueDate: d ?? todayIso() })} />
        </Grid.Col>
        <Grid.Col span={4}>
          <DateField label="Dodanie (DUZP)" value={v.taxableDate} onChange={(d) => setV({ ...v, taxableDate: d })} />
        </Grid.Col>
        <Grid.Col span={4}>
          <DateField label="Splatná" required value={v.dueDate} onChange={(d) => setV({ ...v, dueDate: d ?? v.issueDate })} />
        </Grid.Col>
        <Grid.Col span={4}>
          <MoneyInput label={`Bez DPH (DPH ${vatRate} %)`} value={v.totalNet} onChange={setNet} />
        </Grid.Col>
        <Grid.Col span={4}>
          <MoneyInput label="DPH" value={v.totalVat} onChange={(vat) => setV({ ...v, totalVat: vat, totalGross: v.totalNet + vat })} />
        </Grid.Col>
        <Grid.Col span={4}>
          <MoneyInput label="Spolu s DPH" required value={v.totalGross} onChange={(g) => setV({ ...v, totalGross: g })} />
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea label="Poznámka" autosize minRows={2} value={v.note ?? ""} onChange={(e) => setV({ ...v, note: e.currentTarget.value })} />
        </Grid.Col>
        <Grid.Col span={12}>
          <Checkbox label="Stornovaná" checked={v.cancelled} onChange={(e) => setV({ ...v, cancelled: e.currentTarget.checked })} />
        </Grid.Col>
      </Grid>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          Zrušiť
        </Button>
        <Button onClick={submit}>Uložiť</Button>
      </Group>
    </Modal>
  );
}
