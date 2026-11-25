import { Badge, Button, Card, Group, Select, Table, Text, TextInput } from "@mantine/core";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeName } from "../db/repo/customers";
import { listQuotes } from "../db/repo/quotes";
import { listStages } from "../db/repo/stages";
import { formatDate } from "../domain/dates";
import { formatMoney } from "../domain/money";
import { PageHeader } from "../ui/PageHeader";
import { useAsync } from "../ui/useAsync";

export default function Quotes() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string | null>(null);
  const { data } = useAsync(async () => {
    const [quotes, stages] = await Promise.all([listQuotes(), listStages()]);
    return { quotes, stages };
  }, []);
  const stageMap = new Map((data?.stages ?? []).map((s) => [s.id, s]));
  const rows = useMemo(() => {
    const n = normalizeName(q);
    return (data?.quotes ?? []).filter(
      (x) => (!stage || x.stageId === stage) && (!n || normalizeName(`${x.number} ${x.title} ${x.customerName}`).includes(n)),
    );
  }, [data, q, stage]);

  return (
    <>
      <PageHeader title="Cenové ponuky">
        <Select placeholder="Všetky fázy" clearable data={(data?.stages ?? []).map((s) => ({ value: s.id, label: s.name }))} value={stage} onChange={setStage} />
        <TextInput placeholder="Hľadať" leftSection={<IconSearch size={16} />} value={q} onChange={(e) => setQ(e.currentTarget.value)} />
        <Button leftSection={<IconPlus size={16} />} onClick={() => navigate("/quotes/new")}>
          Nová ponuka
        </Button>
      </PageHeader>
      <Card withBorder p={0}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Číslo</Table.Th>
              <Table.Th>Zákazník</Table.Th>
              <Table.Th>Predmet</Table.Th>
              <Table.Th>Vystavená</Table.Th>
              <Table.Th>Platná do</Table.Th>
              <Table.Th className="num">Bez DPH</Table.Th>
              <Table.Th>Fáza</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((x) => {
              const st = stageMap.get(x.stageId);
              return (
                <Table.Tr key={x.id} className="clickable-row" onClick={() => navigate(`/quotes/${x.id}`)}>
                  <Table.Td fw={500}>{x.number}</Table.Td>
                  <Table.Td>{x.customerName}</Table.Td>
                  <Table.Td>{x.title}</Table.Td>
                  <Table.Td>{formatDate(x.issueDate)}</Table.Td>
                  <Table.Td>{formatDate(x.validUntil)}</Table.Td>
                  <Table.Td className="num">{formatMoney(x.totalNet, x.currency)}</Table.Td>
                  <Table.Td>{st && <Badge color={st.color} variant="light">{st.name}</Badge>}</Table.Td>
                </Table.Tr>
              );
            })}
            {data && rows.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text c="dimmed" ta="center" py="lg">
                    Žiadne ponuky.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
      <Group justify="flex-end" mt="sm">
        <Text size="sm">Spolu bez DPH: {formatMoney(rows.reduce((s, x) => s + x.totalNet, 0))}</Text>
      </Group>
    </>
  );
}
