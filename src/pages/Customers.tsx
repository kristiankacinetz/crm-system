import { Button, Card, Table, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listCustomers, normalizeName } from "../db/repo/customers";
import { listInvoices } from "../db/repo/invoices";
import { isOpen } from "../domain/invoiceStatus";
import { formatMoney } from "../domain/money";
import { PageHeader } from "../ui/PageHeader";
import { useAsync } from "../ui/useAsync";
import { CustomerForm } from "./CustomerForm";

export default function Customers() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [opened, { open, close }] = useDisclosure(false);
  const { data, reload } = useAsync(async () => {
    const [customers, invoices] = await Promise.all([listCustomers(), listInvoices()]);
    const open = new Map<string, { sum: number; overdue: number }>();
    for (const i of invoices) {
      if (!i.customerId || !isOpen(i.status)) continue;
      const cur = open.get(i.customerId) ?? { sum: 0, overdue: 0 };
      cur.sum += i.remaining;
      if (i.status === "overdue") cur.overdue += i.remaining;
      open.set(i.customerId, cur);
    }
    return { customers, open };
  });

  const rows = useMemo(() => {
    const n = normalizeName(q);
    return (data?.customers ?? []).filter(
      (c) => !n || normalizeName(c.name).includes(n) || (c.ico ?? "").includes(q.trim()) || (c.email ?? "").includes(q.trim()),
    );
  }, [data, q]);

  return (
    <>
      <PageHeader title="Zákazníci">
        <TextInput placeholder="Hľadať meno, IČO, e-mail" leftSection={<IconSearch size={16} />} value={q} onChange={(e) => setQ(e.currentTarget.value)} />
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Nový zákazník
        </Button>
      </PageHeader>
      <Card withBorder p={0}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Názov</Table.Th>
              <Table.Th>IČO</Table.Th>
              <Table.Th>Mesto</Table.Th>
              <Table.Th>E-mail</Table.Th>
              <Table.Th className="num">Neuhradené</Table.Th>
              <Table.Th className="num">Po splatnosti</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((c) => {
              const o = data?.open.get(c.id);
              return (
                <Table.Tr key={c.id} className="clickable-row" onClick={() => navigate(`/customers/${c.id}`)}>
                  <Table.Td fw={500}>{c.name}</Table.Td>
                  <Table.Td>{c.ico}</Table.Td>
                  <Table.Td>{c.city}</Table.Td>
                  <Table.Td>{c.email}</Table.Td>
                  <Table.Td className="num">{o?.sum ? formatMoney(o.sum) : ""}</Table.Td>
                  <Table.Td className="num">
                    {o?.overdue ? (
                      <Text c="red" fw={600} span>
                        {formatMoney(o.overdue)}
                      </Text>
                    ) : (
                      ""
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {data && rows.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center" py="lg">
                    {data.customers.length ? "Nič sa nenašlo." : "Zatiaľ žiadni zákazníci. Pridajte prvého alebo importujte faktúry z iDokladu."}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
      <CustomerForm opened={opened} onClose={close} onSaved={(id) => { void reload(); navigate(`/customers/${id}`); }} />
    </>
  );
}
