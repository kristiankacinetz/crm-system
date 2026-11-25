import { Alert, Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconAlertTriangle, IconClock } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { listInvoices } from "../db/repo/invoices";
import { listOrders } from "../db/repo/orders";
import { listQuotes } from "../db/repo/quotes";
import { listStages } from "../db/repo/stages";
import { isOpen } from "../domain/invoiceStatus";
import { formatMoney } from "../domain/money";
import { plural } from "../domain/dates";
import { useAsync } from "../ui/useAsync";
import { InvoiceDetail } from "./InvoiceDetail";
import { InvoiceTable } from "./InvoiceTable";

function Stat({ label, value, sub, color, onClick }: { label: string; value: string; sub?: string; color?: string; onClick?: () => void }) {
  return (
    <Card withBorder onClick={onClick} style={{ cursor: onClick ? "pointer" : undefined }}>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="xl" fw={700} c={color}>
        {value}
      </Text>
      {sub && (
        <Text size="xs" c="dimmed">
          {sub}
        </Text>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<string | null>(null);
  const { data, reload } = useAsync(async () => {
    const [invoices, quotes, stages, orders] = await Promise.all([listInvoices(), listQuotes(), listStages(), listOrders()]);
    return { invoices, quotes, stages, orders };
  }, []);
  if (!data) return null;

  const open = data.invoices.filter((i) => isOpen(i.status));
  const overdue = open.filter((i) => i.status === "overdue").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const soon = open.filter((i) => i.status === "due_soon").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const sum = (xs: { remaining: number }[]) => xs.reduce((s, i) => s + i.remaining, 0);
  const openStageIds = new Set(data.stages.filter((s) => s.kind === "open").map((s) => s.id));
  const pipeline = data.quotes.filter((q) => openStageIds.has(q.stageId));
  const activeOrders = data.orders.filter((o) => o.status === "new" || o.status === "in_progress");

  return (
    <Stack>
      <Title order={2}>Prehľad</Title>
      {overdue.length > 0 && (
        <Alert color="red" icon={<IconAlertTriangle />} title={`${plural(overdue.length, "faktúra je", "faktúry sú", "faktúr je")} po splatnosti`}>
          Spolu {formatMoney(sum(overdue))} neuhradené. Upozornenie vidíte len vy, zákazníkom sa nič neposiela.
        </Alert>
      )}
      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <Stat label="Po splatnosti" value={formatMoney(sum(overdue))} sub={plural(overdue.length, "faktúra", "faktúry", "faktúr")} color={overdue.length ? "red" : undefined} onClick={() => navigate("/invoices?f=overdue")} />
        <Stat label="Neuhradené spolu" value={formatMoney(sum(open))} sub={plural(open.length, "faktúra", "faktúry", "faktúr")} onClick={() => navigate("/invoices?f=open")} />
        <Stat label="Otvorené ponuky" value={formatMoney(pipeline.reduce((s, q) => s + q.totalNet, 0))} sub={`${plural(pipeline.length, "ponuka", "ponuky", "ponúk")}, bez DPH`} onClick={() => navigate("/pipeline")} />
        <Stat label="Aktívne zákazky" value={String(activeOrders.length)} sub={formatMoney(activeOrders.reduce((s, o) => s + o.totalNet, 0)) + " bez DPH"} onClick={() => navigate("/orders")} />
      </SimpleGrid>

      <Card withBorder p={0}>
        <Group p="md" pb={0} gap="xs">
          <IconAlertTriangle size={18} color="var(--mantine-color-red-6)" />
          <Text fw={600}>Po splatnosti</Text>
        </Group>
        <InvoiceTable invoices={overdue} onOpen={(i) => setDetail(i.id)} empty="Žiadna faktúra nie je po splatnosti." />
      </Card>
      <Card withBorder p={0}>
        <Group p="md" pb={0} gap="xs">
          <IconClock size={18} color="var(--mantine-color-yellow-7)" />
          <Text fw={600}>Blíži sa splatnosť</Text>
        </Group>
        <InvoiceTable invoices={soon} onOpen={(i) => setDetail(i.id)} empty="V najbližších dňoch nič nie je splatné." />
      </Card>

      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={600}>Pipeline</Text>
          <Button variant="subtle" size="xs" onClick={() => navigate("/pipeline")}>
            Otvoriť
          </Button>
        </Group>
        <Group>
          {data.stages.map((s) => {
            const qs = data.quotes.filter((q) => q.stageId === s.id);
            return (
              <Badge key={s.id} color={s.color} variant="light" size="lg">
                {s.name}: {qs.length} · {formatMoney(qs.reduce((a, q) => a + q.totalNet, 0))}
              </Badge>
            );
          })}
        </Group>
      </Card>
      <InvoiceDetail invoiceId={detail} onClose={() => setDetail(null)} onChanged={reload} />
    </Stack>
  );
}
