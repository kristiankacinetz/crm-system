import { Badge, Button, Card, Grid, Group, Modal, SegmentedControl, Select, Table, Text, TextInput, Textarea } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listCustomers } from "../db/repo/customers";
import { deleteOrder, listOrders, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, saveOrder, type OrderInput, type OrderView } from "../db/repo/orders";
import { getSettings } from "../db/repo/settings";
import { ORDER_STATUSES, type OrderStatus } from "../db/schema";
import { formatDate, todayIso } from "../domain/dates";
import { formatMoney } from "../domain/money";
import { CustomerSelect, DateField, MoneyInput, confirmDelete, nn } from "../ui/fields";
import { attempt } from "../ui/notify";
import { PageHeader } from "../ui/PageHeader";
import { useAsync } from "../ui/useAsync";

const empty = (): OrderInput => ({
  customerId: "",
  quoteId: null,
  title: "",
  status: "new",
  orderDate: todayIso(),
  deadline: null,
  currency: "EUR",
  totalNet: 0,
  totalGross: 0,
  note: null,
});

export default function Orders() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState("active");
  const [editing, setEditing] = useState<OrderView | null | undefined>(undefined);
  const { data, reload } = useAsync(async () => {
    const [orders, customers] = await Promise.all([listOrders(), listCustomers()]);
    return { orders, customers };
  }, []);

  useEffect(() => {
    const open = params.get("open");
    if (open && data) {
      setEditing(data.orders.find((o) => o.id === open) ?? undefined);
      setParams({}, { replace: true });
    }
  }, [params, data, setParams]);

  const rows = useMemo(
    () => (data?.orders ?? []).filter((o) => filter === "all" || (filter === "active" ? o.status === "new" || o.status === "in_progress" : o.status === filter)),
    [data, filter],
  );

  return (
    <>
      <PageHeader title="Zákazky">
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          data={[
            { value: "active", label: "Aktívne" },
            { value: "done", label: "Dokončené" },
            { value: "cancelled", label: "Zrušené" },
            { value: "all", label: "Všetky" },
          ]}
        />
        <Button leftSection={<IconPlus size={16} />} onClick={() => setEditing(null)}>
          Nová zákazka
        </Button>
      </PageHeader>
      <Card withBorder p={0}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Číslo</Table.Th>
              <Table.Th>Zákazník</Table.Th>
              <Table.Th>Názov</Table.Th>
              <Table.Th>Objednané</Table.Th>
              <Table.Th>Termín</Table.Th>
              <Table.Th className="num">Bez DPH</Table.Th>
              <Table.Th>Stav</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((o) => (
              <Table.Tr key={o.id} className="clickable-row" onClick={() => setEditing(o)}>
                <Table.Td fw={500}>{o.number}</Table.Td>
                <Table.Td>{o.customerName}</Table.Td>
                <Table.Td>{o.title}</Table.Td>
                <Table.Td>{formatDate(o.orderDate)}</Table.Td>
                <Table.Td c={o.deadline && o.deadline < todayIso() && o.status !== "done" && o.status !== "cancelled" ? "red" : undefined}>{formatDate(o.deadline)}</Table.Td>
                <Table.Td className="num">{formatMoney(o.totalNet, o.currency)}</Table.Td>
                <Table.Td>
                  <Badge color={ORDER_STATUS_COLORS[o.status]} variant="light">
                    {ORDER_STATUS_LABELS[o.status]}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
            {data && rows.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text c="dimmed" ta="center" py="lg">
                    Žiadne zákazky. Zákazka vznikne aj z vyhratej ponuky tlačidlom Vytvoriť zákazku.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
      <OrderForm
        order={editing}
        customers={data?.customers ?? []}
        onClose={() => setEditing(undefined)}
        onSaved={reload}
        onOpenQuote={(qid) => navigate(`/quotes/${qid}`)}
      />
    </>
  );
}

function OrderForm({
  order,
  customers,
  onClose,
  onSaved,
  onOpenQuote,
}: {
  order: OrderView | null | undefined;
  customers: Parameters<typeof CustomerSelect>[0]["customers"];
  onClose: () => void;
  onSaved: () => void;
  onOpenQuote: (id: string) => void;
}) {
  const [v, setV] = useState<OrderInput>(empty());
  const [vatRate, setVatRate] = useState(23);
  useEffect(() => {
    if (order === undefined) return;
    void getSettings().then((s) => setVatRate(s.defaultVatRate));
    if (order) {
      const { customerId, quoteId, title, status, orderDate, deadline, currency, totalNet, totalGross, note } = order;
      setV({ customerId, quoteId, title, status, orderDate, deadline, currency, totalNet, totalGross, note });
    } else setV(empty());
  }, [order]);

  async function submit() {
    if (await attempt(() => saveOrder({ ...v, title: v.title.trim(), note: nn(v.note) }, order?.id), "Zákazka uložená")) {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal opened={order !== undefined} onClose={onClose} title={order ? `Zákazka ${order.number}` : "Nová zákazka"} size="lg">
      <Grid>
        <Grid.Col span={12}>
          <CustomerSelect customers={customers} value={v.customerId || null} onChange={(c) => setV({ ...v, customerId: c ?? "" })} required />
        </Grid.Col>
        <Grid.Col span={8}>
          <TextInput label="Názov" required value={v.title} onChange={(e) => setV({ ...v, title: e.currentTarget.value })} />
        </Grid.Col>
        <Grid.Col span={4}>
          <Select label="Stav" data={ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] }))} value={v.status} onChange={(s) => s && setV({ ...v, status: s as OrderStatus })} allowDeselect={false} />
        </Grid.Col>
        <Grid.Col span={6}>
          <DateField label="Dátum objednania" required value={v.orderDate} onChange={(d) => d && setV({ ...v, orderDate: d })} />
        </Grid.Col>
        <Grid.Col span={6}>
          <DateField label="Termín dodania" value={v.deadline} onChange={(d) => setV({ ...v, deadline: d })} />
        </Grid.Col>
        <Grid.Col span={6}>
          <MoneyInput label="Suma bez DPH" value={v.totalNet} onChange={(n) => setV({ ...v, totalNet: n, totalGross: n + Math.round((n * vatRate) / 100) })} />
        </Grid.Col>
        <Grid.Col span={6}>
          <MoneyInput label="Suma s DPH" value={v.totalGross} onChange={(g) => setV({ ...v, totalGross: g })} />
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea label="Poznámka" autosize minRows={2} value={v.note ?? ""} onChange={(e) => setV({ ...v, note: e.currentTarget.value })} />
        </Grid.Col>
      </Grid>
      <Group justify="space-between" mt="lg">
        <Group gap="xs">
          {order && (
            <Button
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => confirmDelete(`zákazku ${order.number}`, () => void attempt(() => deleteOrder(order.id), "Zákazka zmazaná").then((ok) => { if (ok) { onSaved(); onClose(); } }))}
            >
              Zmazať
            </Button>
          )}
          {order?.quoteId && (
            <Button variant="subtle" onClick={() => onOpenQuote(order.quoteId!)}>
              Otvoriť ponuku
            </Button>
          )}
        </Group>
        <Group>
          <Button variant="default" onClick={onClose}>
            Zrušiť
          </Button>
          <Button onClick={submit}>Uložiť</Button>
        </Group>
      </Group>
    </Modal>
  );
}
