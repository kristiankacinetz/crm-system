import { ActionIcon, Anchor, Badge, Button, Card, Grid, Group, NumberInput, Select, Stack, Table, Text, TextInput, Textarea } from "@mantine/core";
import { IconArrowLeft, IconCopy, IconFileTypePdf, IconPlus, IconTrash, IconTrophy } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getCustomer, listContacts, listCustomers } from "../db/repo/customers";
import { createOrderFromQuote } from "../db/repo/orders";
import { deleteQuote, duplicateQuote, getQuote, newQuoteDefaults, ordersForQuote, saveQuote, type QuoteInput, type QuoteItemInput } from "../db/repo/quotes";
import { getSettings } from "../db/repo/settings";
import { listStages } from "../db/repo/stages";
import type { Contact, Customer, Order, PipelineStage, Quote } from "../db/schema";
import { formatMoney } from "../domain/money";
import { computeTotals, lineNet } from "../domain/quoteTotals";
import { buildQuotePdf } from "../pdf/quotePdf";
import { saveFile } from "../services/files";
import { CustomerSelect, DateField, MoneyInput, confirmDelete, nn } from "../ui/fields";
import { attempt, notifyError, notifyOk } from "../ui/notify";
import { PageHeader } from "../ui/PageHeader";

export default function QuoteEdit() {
  const { id = "new" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [quote, setQuote] = useState<Quote | null>(null);
  const [v, setV] = useState<QuoteInput | null>(null);
  const [items, setItems] = useState<QuoteItemInput[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vatRate, setVatRate] = useState(23);
  const [dirty, setDirty] = useState(false);

  const blankItem = (): QuoteItemInput => ({ name: "", description: null, quantity: 1, unit: "ks", unitPrice: 0, discountPct: 0, vatRate });

  async function load() {
    const [cs, st, s] = await Promise.all([listCustomers(), listStages(), getSettings()]);
    setCustomers(cs);
    setStages(st);
    setVatRate(s.defaultVatRate);
    if (isNew) {
      setQuote(null);
      setV(await newQuoteDefaults(params.get("customer") ?? ""));
      setItems([{ name: "", description: null, quantity: 1, unit: "ks", unitPrice: 0, discountPct: 0, vatRate: s.defaultVatRate }]);
      setOrders([]);
    } else {
      const q = await getQuote(id);
      if (!q) return;
      setQuote(q.quote);
      const { customerId, contactId, title, stageId, issueDate, validUntil, expectedCloseDate, currency, introText, note, lostReason } = q.quote;
      setV({ customerId, contactId, title, stageId, issueDate, validUntil, expectedCloseDate, currency, introText, note, lostReason });
      setItems(q.items.map(({ name, description, quantity, unit, unitPrice, discountPct, vatRate }) => ({ name, description, quantity, unit, unitPrice, discountPct, vatRate })));
      setOrders(await ordersForQuote(id));
    }
    setDirty(false);
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => {
    if (v?.customerId) void listContacts(v.customerId).then(setContacts);
    else setContacts([]);
  }, [v?.customerId]);

  if (!v) return null;
  const totals = computeTotals(items.filter((i) => i.name.trim()));
  const stage = stages.find((s) => s.id === v.stageId);
  const set = (patch: Partial<QuoteInput>) => {
    setV({ ...v, ...patch });
    setDirty(true);
  };
  const setItem = (i: number, patch: Partial<QuoteItemInput>) => {
    setItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
    setDirty(true);
  };

  async function save(): Promise<string | null> {
    let savedId: string | null = null;
    const clean = { ...v!, title: v!.title.trim(), introText: nn(v!.introText), note: nn(v!.note), lostReason: nn(v!.lostReason) };
    const ok = await attempt(async () => {
      savedId = await saveQuote(clean, items, isNew ? undefined : id);
    }, "Ponuka uložená");
    if (ok && savedId) {
      if (isNew) navigate(`/quotes/${savedId}`, { replace: true });
      else await load();
    }
    return ok ? savedId : null;
  }

  async function exportPdf() {
    try {
      const savedId = dirty || isNew ? await save() : id;
      if (!savedId) return;
      const q = await getQuote(savedId);
      if (!q) return;
      const customer = await getCustomer(q.quote.customerId);
      const contact = q.quote.contactId ? (await listContacts(q.quote.customerId)).find((c) => c.id === q.quote.contactId) : undefined;
      const bytes = await buildQuotePdf({ quote: q.quote, items: q.items, customer: customer!, contact, settings: await getSettings() });
      const path = await saveFile(`Ponuka ${q.quote.number}.pdf`, bytes, "PDF", ["pdf"]);
      if (path) notifyOk(`PDF uložené: ${path}`);
    } catch (e) {
      notifyError(e);
    }
  }

  return (
    <>
      <Anchor size="sm" onClick={() => navigate("/quotes")}>
        <Group gap={4}>
          <IconArrowLeft size={14} /> Ponuky
        </Group>
      </Anchor>
      <PageHeader
        title={
          <Group gap="sm">
            {isNew ? "Nová ponuka" : `Ponuka ${quote?.number ?? ""}`}
            {stage && <Badge color={stage.color}>{stage.name}</Badge>}
          </Group>
        }
      >
        {!isNew && (
          <>
            <Button variant="default" leftSection={<IconCopy size={16} />} onClick={() => void attempt(() => duplicateQuote(id).then((nid) => navigate(`/quotes/${nid}`)), "Ponuka skopírovaná")}>
              Kopírovať
            </Button>
            <Button
              variant="default"
              leftSection={<IconTrophy size={16} />}
              onClick={() =>
                void attempt(async () => {
                  if (dirty) await save();
                  await createOrderFromQuote(id);
                  navigate("/orders");
                }, "Zákazka vytvorená")
              }
            >
              Vytvoriť zákazku
            </Button>
          </>
        )}
        <Button variant="default" leftSection={<IconFileTypePdf size={16} />} onClick={exportPdf}>
          PDF
        </Button>
        <Button onClick={() => void save()} disabled={!dirty && !isNew}>
          Uložiť
        </Button>
      </PageHeader>

      <Stack>
        <Card withBorder>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <CustomerSelect customers={customers} value={v.customerId || null} onChange={(c) => set({ customerId: c ?? "", contactId: null })} required />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select label="Kontaktná osoba" clearable data={contacts.map((c) => ({ value: c.id, label: c.name }))} value={v.contactId} onChange={(c) => set({ contactId: c })} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="Predmet ponuky" required value={v.title} onChange={(e) => set({ title: e.currentTarget.value })} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select label="Fáza" data={stages.map((s) => ({ value: s.id, label: s.name }))} value={v.stageId} onChange={(s) => s && set({ stageId: s })} allowDeselect={false} />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <DateField label="Dátum vystavenia" required value={v.issueDate} onChange={(d) => d && set({ issueDate: d })} />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <DateField label="Platná do" value={v.validUntil} onChange={(d) => set({ validUntil: d })} />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <DateField label="Očakávané rozhodnutie" value={v.expectedCloseDate} onChange={(d) => set({ expectedCloseDate: d })} />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Select label="Mena" data={["EUR", "CZK", "USD"]} value={v.currency} onChange={(c) => c && set({ currency: c })} allowDeselect={false} />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea label="Úvodný text (v PDF nad položkami)" autosize minRows={2} value={v.introText ?? ""} onChange={(e) => set({ introText: e.currentTarget.value })} />
            </Grid.Col>
            {stage?.kind === "lost" && (
              <Grid.Col span={12}>
                <TextInput label="Dôvod prehry" value={v.lostReason ?? ""} onChange={(e) => set({ lostReason: e.currentTarget.value })} />
              </Grid.Col>
            )}
          </Grid>
        </Card>

        <Card withBorder p={0}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Položka</Table.Th>
                <Table.Th w={90}>Množstvo</Table.Th>
                <Table.Th w={80}>MJ</Table.Th>
                <Table.Th w={140}>Cena/MJ bez DPH</Table.Th>
                <Table.Th w={80}>Zľava %</Table.Th>
                <Table.Th w={80}>DPH %</Table.Th>
                <Table.Th w={120} className="num">
                  Spolu bez DPH
                </Table.Th>
                <Table.Th w={40} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((it, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <TextInput size="xs" placeholder="Názov" value={it.name} onChange={(e) => setItem(i, { name: e.currentTarget.value })} />
                    <TextInput size="xs" mt={4} placeholder="Popis (voliteľný)" value={it.description ?? ""} onChange={(e) => setItem(i, { description: nn(e.currentTarget.value) })} />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput size="xs" value={it.quantity} decimalSeparator="," min={0} onChange={(q) => setItem(i, { quantity: Number(q) || 0 })} hideControls />
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" value={it.unit} onChange={(e) => setItem(i, { unit: e.currentTarget.value })} />
                  </Table.Td>
                  <Table.Td>
                    <MoneyInput size="xs" value={it.unitPrice} currency={v.currency} onChange={(p) => setItem(i, { unitPrice: p })} hideControls />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput size="xs" value={it.discountPct} min={0} max={100} decimalSeparator="," onChange={(d) => setItem(i, { discountPct: Number(d) || 0 })} hideControls />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput size="xs" value={it.vatRate} min={0} max={100} decimalSeparator="," onChange={(r) => setItem(i, { vatRate: Number(r) || 0 })} hideControls />
                  </Table.Td>
                  <Table.Td className="num">{formatMoney(lineNet(it), v.currency)}</Table.Td>
                  <Table.Td>
                    <ActionIcon variant="subtle" color="red" onClick={() => { setItems(items.filter((_, j) => j !== i)); setDirty(true); }}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Group justify="space-between" p="md" align="flex-start">
            <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={() => { setItems([...items, blankItem()]); setDirty(true); }}>
              Pridať položku
            </Button>
            <Stack gap={2} align="flex-end">
              <Text size="sm">Bez DPH: {formatMoney(totals.net, v.currency)}</Text>
              {totals.byRate.map((r) => (
                <Text size="sm" c="dimmed" key={r.rate}>
                  DPH {r.rate} %: {formatMoney(r.vat, v.currency)}
                </Text>
              ))}
              <Text fw={700} size="lg">
                Spolu s DPH: {formatMoney(totals.gross, v.currency)}
              </Text>
            </Stack>
          </Group>
        </Card>

        <Card withBorder>
          <Textarea label="Poznámka (v PDF pod položkami)" autosize minRows={2} value={v.note ?? ""} onChange={(e) => set({ note: e.currentTarget.value })} />
        </Card>

        {orders.length > 0 && (
          <Text size="sm" c="dimmed">
            Zákazky z tejto ponuky: {orders.map((o) => o.number).join(", ")}
          </Text>
        )}
        {!isNew && (
          <Group>
            <Button
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => confirmDelete(`ponuku ${quote?.number}`, () => void attempt(() => deleteQuote(id), "Ponuka zmazaná").then((ok) => ok && navigate("/quotes")))}
            >
              Zmazať ponuku
            </Button>
          </Group>
        )}
      </Stack>
    </>
  );
}
