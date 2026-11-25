import { ActionIcon, Badge, Button, Divider, Group, Modal, Select, SimpleGrid, Stack, Table, Text, TextInput } from "@mantine/core";
import { IconCheck, IconPencil, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { addPayment, deleteInvoice, deletePayment, getInvoiceView, listPayments, markPaid, type InvoiceView } from "../db/repo/invoices";
import type { Payment } from "../db/schema";
import { formatDate, todayIso } from "../domain/dates";
import { formatMoney } from "../domain/money";
import { DateField, InvoiceStatusBadge, MoneyInput, confirmDelete, nn } from "../ui/fields";
import { attempt } from "../ui/notify";
import { InvoiceForm } from "./InvoiceForm";

const METHOD_LABELS: Record<Payment["method"], string> = { bank: "Prevod", cash: "Hotovosť", other: "Iné" };

export function InvoiceDetail({ invoiceId, onClose, onChanged }: { invoiceId: string | null; onClose: () => void; onChanged: () => void }) {
  const [inv, setInv] = useState<InvoiceView | null>(null);
  const [pays, setPays] = useState<Payment[]>([]);
  const [editing, setEditing] = useState(false);
  const [pay, setPay] = useState({ paidOn: todayIso(), amount: 0, method: "bank" as Payment["method"], note: "" });

  async function load() {
    if (!invoiceId) return;
    const v = (await getInvoiceView(invoiceId)) ?? null;
    setInv(v);
    setPays(await listPayments(invoiceId));
    setPay((p) => ({ ...p, amount: v?.remaining ?? 0 }));
  }
  useEffect(() => {
    setInv(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const changed = async () => {
    await load();
    onChanged();
  };

  return (
    <Modal opened={!!invoiceId} onClose={onClose} title={inv ? `Faktúra ${inv.number}` : "Faktúra"} size="lg">
      {inv && (
        <Stack>
          <Group justify="space-between">
            <InvoiceStatusBadge status={inv.status} />
            <Group gap="xs">
              {inv.source === "import" && <Badge variant="outline">z iDokladu</Badge>}
              <Button size="xs" variant="default" leftSection={<IconPencil size={14} />} onClick={() => setEditing(true)}>
                Upraviť
              </Button>
              <Button
                size="xs"
                variant="subtle"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() =>
                  confirmDelete(`faktúru ${inv.number}`, () =>
                    void attempt(() => deleteInvoice(inv.id), "Faktúra zmazaná").then((ok) => {
                      if (ok) {
                        onChanged();
                        onClose();
                      }
                    }),
                  )
                }
              >
                Zmazať
              </Button>
            </Group>
          </Group>
          <SimpleGrid cols={3}>
            <Info label="Odberateľ" value={inv.customerName} />
            <Info label="Variabilný symbol" value={inv.variableSymbol ?? "—"} />
            <Info label="Mena" value={inv.currency} />
            <Info label="Vystavená" value={formatDate(inv.issueDate)} />
            <Info label="DUZP" value={formatDate(inv.taxableDate) || "—"} />
            <Info label="Splatná" value={formatDate(inv.dueDate)} />
            <Info label="Bez DPH" value={formatMoney(inv.totalNet, inv.currency)} />
            <Info label="DPH" value={formatMoney(inv.totalVat, inv.currency)} />
            <Info label="Spolu" value={formatMoney(inv.totalGross, inv.currency)} strong />
            <Info label="Uhradené" value={formatMoney(inv.paid, inv.currency)} />
            <Info label="Zostáva" value={formatMoney(inv.remaining, inv.currency)} strong />
            <Info label="Uhradené podľa importu" value={formatMoney(inv.importedPaid, inv.currency)} />
          </SimpleGrid>
          {inv.note && <Text size="sm">{inv.note}</Text>}

          <Divider label="Úhrady zadané ručne" labelPosition="left" />
          {pays.length > 0 && (
            <Table>
              <Table.Tbody>
                {pays.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td>{formatDate(p.paidOn)}</Table.Td>
                    <Table.Td>{METHOD_LABELS[p.method]}</Table.Td>
                    <Table.Td>{p.note}</Table.Td>
                    <Table.Td className="num">{formatMoney(p.amount, inv.currency)}</Table.Td>
                    <Table.Td w={40}>
                      <ActionIcon variant="subtle" color="red" onClick={() => void attempt(() => deletePayment(p.id)).then(changed)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
          {inv.remaining > 0 && inv.status !== "cancelled" && (
            <>
              <Button leftSection={<IconCheck size={16} />} color="green" onClick={() => void attempt(() => markPaid(inv.id), "Označené ako uhradené").then(changed)}>
                Označiť celú sumu ako uhradenú dnes
              </Button>
              <Group align="flex-end" grow>
                <DateField label="Dátum úhrady" value={pay.paidOn} onChange={(d) => setPay({ ...pay, paidOn: d ?? todayIso() })} />
                <MoneyInput label="Suma" value={pay.amount} onChange={(amount) => setPay({ ...pay, amount })} currency={inv.currency} />
                <Select label="Spôsob" data={Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }))} value={pay.method} onChange={(m) => setPay({ ...pay, method: (m ?? "bank") as Payment["method"] })} />
              </Group>
              <Group align="flex-end">
                <TextInput label="Poznámka" style={{ flex: 1 }} value={pay.note} onChange={(e) => setPay({ ...pay, note: e.currentTarget.value })} />
                <Button variant="light" onClick={() => void attempt(() => addPayment(inv.id, { ...pay, note: nn(pay.note) }), "Úhrada pridaná").then(changed)}>
                  Pridať čiastočnú úhradu
                </Button>
              </Group>
            </>
          )}
        </Stack>
      )}
      <InvoiceForm opened={editing} onClose={() => setEditing(false)} invoice={inv} onSaved={changed} />
    </Modal>
  );
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={strong ? 700 : 400}>{value}</Text>
    </div>
  );
}
