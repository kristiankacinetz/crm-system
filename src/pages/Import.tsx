import { Alert, Badge, Button, Card, Group, List, ScrollArea, Select, Stack, Table, Text, Title } from "@mantine/core";
import { IconCheck, IconFileUpload, IconInfoCircle } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { getSettings, saveSettings, type ImportField } from "../db/repo/settings";
import { formatDate } from "../domain/dates";
import { formatMoney } from "../domain/money";
import { applyImport, listImportBatches, planImport, type ImportPlan, type ImportResult, type PlanAction } from "../import/apply";
import { detectHeaderRow, IMPORT_FIELD_LABELS, mappingToSaved, missingRequired, suggestMapping, type Mapping } from "../import/mapping";
import { normalizeRows } from "../import/normalize";
import { readGrid } from "../import/read";
import { pickFile } from "../services/files";
import { notifyError } from "../ui/notify";
import { PageHeader } from "../ui/PageHeader";
import { useAsync } from "../ui/useAsync";

const ACTION_LABEL: Record<PlanAction, { label: string; color: string }> = {
  create: { label: "Nová", color: "green" },
  update: { label: "Zmena", color: "blue" },
  unchanged: { label: "Bez zmeny", color: "gray" },
  deleted: { label: "Zmazaná v CRM, preskočí sa", color: "orange" },
};

interface Loaded {
  fileName: string;
  grid: unknown[][];
  headerRow: number;
}

const fieldOptions = [
  { value: "", label: "— nepoužiť —" },
  ...Object.entries(IMPORT_FIELD_LABELS).map(([value, label]) => ({ value, label })),
];

export default function ImportPage() {
  const [file, setFile] = useState<Loaded | null>(null);
  const [mapping, setMapping] = useState<Mapping>([]);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const history = useAsync(listImportBatches, []);

  const headers = file ? file.grid[file.headerRow] ?? [] : [];
  const missing = useMemo(() => missingRequired(mapping), [mapping]);

  async function choose() {
    try {
      const picked = await pickFile("Export z iDokladu", ["xlsx", "csv", "txt"]);
      if (!picked) return;
      const grid = await readGrid(picked.fileName, picked.bytes);
      if (!grid.length) throw new Error("Súbor je prázdny");
      const headerRow = detectHeaderRow(grid);
      const s = await getSettings();
      setFile({ fileName: picked.fileName, grid, headerRow });
      setMapping(suggestMapping(grid[headerRow], s.importMapping));
      setPlan(null);
      setResult(null);
    } catch (e) {
      notifyError(e);
    }
  }

  async function preview(m = mapping) {
    if (!file) return;
    setBusy(true);
    try {
      const s = await getSettings();
      const { rows, errors } = normalizeRows(file.grid, file.headerRow, m, s.currency);
      setPlan(await planImport(rows, errors));
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!file || !plan) return;
    setBusy(true);
    try {
      await saveSettings({ importMapping: mappingToSaved(headers, mapping) });
      setResult(await applyImport(plan, file.fileName));
      setPlan(null);
      void history.reload();
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy(false);
    }
  }

  const setField = (i: number, f: string | null) => {
    const next = [...mapping];
    // One column per field.
    if (f) next.forEach((x, j) => x === f && j !== i && (next[j] = ""));
    next[i] = (f ?? "") as ImportField | "";
    setMapping(next);
    setPlan(null);
  };

  const sample = file ? file.grid.slice(file.headerRow + 1, file.headerRow + 4) : [];

  return (
    <Stack>
      <PageHeader title="Import faktúr z iDokladu">
        <Button leftSection={<IconFileUpload size={16} />} onClick={choose}>
          Vybrať súbor
        </Button>
      </PageHeader>

      {!file && !result && (
        <Alert icon={<IconInfoCircle />} title="Ako na to">
          <List size="sm">
            <List.Item>V iDoklade otvorte Vydané faktúry, vyberte obdobie a zvoľte Export do Excelu (.xlsx) alebo CSV.</List.Item>
            <List.Item>Tu vyberte stiahnutý súbor. Stĺpce sa priradia automaticky, skontrolujte ich.</List.Item>
            <List.Item>Import môžete kedykoľvek zopakovať. Faktúry sa spárujú podľa čísla, nič sa nezduplikuje a ručne zadané úhrady zostanú.</List.Item>
          </List>
        </Alert>
      )}

      {result && (
        <Alert color="green" icon={<IconCheck />} title="Import dokončený">
          Nové: {result.created}, zmenené: {result.updated}, bez zmeny: {result.unchanged}
          {result.skipped ? `, preskočené: ${result.skipped}` : ""}, nových zákazníkov: {result.newCustomers}
          {result.errors.length ? `, chybné riadky: ${result.errors.length}` : ""}.
        </Alert>
      )}

      {file && (
        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Text fw={600}>{file.fileName}</Text>
            <Text size="sm" c="dimmed">
              Hlavička na riadku {file.headerRow + 1}, {file.grid.length - file.headerRow - 1} riadkov dát
            </Text>
          </Group>
          <ScrollArea>
            <Table withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  {headers.map((h, i) => (
                    <Table.Th key={i} miw={160}>
                      <Text size="xs" c="dimmed" mb={4}>
                        {String(h ?? "")}
                      </Text>
                      <Select size="xs" data={fieldOptions} value={mapping[i] ?? ""} onChange={(f) => setField(i, f)} allowDeselect={false} />
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sample.map((r, ri) => (
                  <Table.Tr key={ri}>
                    {headers.map((_, i) => (
                      <Table.Td key={i}>
                        <Text size="xs">{r[i] instanceof Date ? formatDate((r[i] as Date).toISOString()) : String(r[i] ?? "")}</Text>
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          {missing.length > 0 && (
            <Text c="red" size="sm" mt="sm">
              Priraďte povinné stĺpce: {missing.map((f) => IMPORT_FIELD_LABELS[f]).join(", ")}
            </Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button onClick={() => preview()} disabled={missing.length > 0} loading={busy && !plan}>
              Zobraziť náhľad
            </Button>
          </Group>
        </Card>
      )}

      {plan && (
        <Card withBorder>
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <Badge color="green">Nové: {plan.counts.create}</Badge>
              <Badge color="blue">Zmenené: {plan.counts.update}</Badge>
              <Badge color="gray">Bez zmeny: {plan.counts.unchanged}</Badge>
              {plan.counts.deleted > 0 && <Badge color="orange">Preskočené: {plan.counts.deleted}</Badge>}
              {plan.errors.length > 0 && <Badge color="red">Chyby: {plan.errors.length}</Badge>}
            </Group>
            <Button onClick={confirm} loading={busy} disabled={plan.counts.create + plan.counts.update === 0}>
              Importovať
            </Button>
          </Group>
          {plan.errors.length > 0 && (
            <Alert color="red" mb="sm" title="Tieto riadky sa nenačítajú">
              <List size="sm">
                {plan.errors.map((e) => (
                  <List.Item key={e.rowNumber}>
                    Riadok {e.rowNumber}: {e.message}
                  </List.Item>
                ))}
              </List>
            </Alert>
          )}
          <ScrollArea h={420}>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Číslo</Table.Th>
                  <Table.Th>Odberateľ</Table.Th>
                  <Table.Th>Splatná</Table.Th>
                  <Table.Th className="num">Suma</Table.Th>
                  <Table.Th className="num">Uhradené</Table.Th>
                  <Table.Th>Akcia</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {plan.entries.map((e) => (
                  <Table.Tr key={e.row.number}>
                    <Table.Td>{e.row.number}</Table.Td>
                    <Table.Td>
                      {e.customer.name ?? "—"}
                      {e.customer.kind === "new" && (
                        <Badge size="xs" ml={6} variant="outline">
                          nový zákazník
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>{formatDate(e.row.dueDate)}</Table.Td>
                    <Table.Td className="num">{formatMoney(e.row.totalGross, e.row.currency)}</Table.Td>
                    <Table.Td className="num">{formatMoney(e.row.paid, e.row.currency)}</Table.Td>
                    <Table.Td>
                      <Badge color={ACTION_LABEL[e.action].color} variant="light">
                        {ACTION_LABEL[e.action].label}
                      </Badge>
                      {e.changes.length > 0 && (
                        <Text size="xs" c="dimmed">
                          {e.changes.join(", ")}
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      {(history.data?.length ?? 0) > 0 && (
        <Card withBorder>
          <Title order={5} mb="sm">
            História importov
          </Title>
          <Table>
            <Table.Tbody>
              {history.data!.slice(0, 20).map((b) => (
                <Table.Tr key={b.id}>
                  <Table.Td>{new Date(b.importedAt).toLocaleString("sk-SK")}</Table.Td>
                  <Table.Td>{b.fileName}</Table.Td>
                  <Table.Td>
                    nové {b.createdCount}, zmenené {b.updatedCount}, bez zmeny {b.unchangedCount}
                    {b.errorCount ? `, chyby ${b.errorCount}` : ""}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
}
