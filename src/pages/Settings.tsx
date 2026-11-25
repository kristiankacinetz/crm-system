import { ActionIcon, Alert, Button, Card, ColorSwatch, Grid, Group, Image, NumberInput, Select, Stack, Table, Text, TextInput, Textarea, Title } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconDatabaseExport, IconFolder, IconPlus, IconTrash, IconUpload } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getSettings, saveSettings, type AppSettings, type CompanyInfo } from "../db/repo/settings";
import { deleteStage, listStages, reorderStages, saveStage } from "../db/repo/stages";
import type { PipelineStage } from "../db/schema";
import { backupNow } from "../services/backup";
import { pickDirectory, pickFile } from "../services/files";
import { formatNumber } from "../domain/numbering";
import { attempt } from "../ui/notify";
import { PageHeader } from "../ui/PageHeader";

const COLORS = ["blue", "violet", "cyan", "teal", "green", "yellow", "orange", "red", "pink", "gray"];
const KIND_LABELS: Record<PipelineStage["kind"], string> = { open: "Otvorená", won: "Vyhraté", lost: "Prehraté" };

function toDataUrl(bytes: Uint8Array, fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop();
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${mime};base64,${btoa(bin)}`;
}

export default function Settings() {
  const [s, setS] = useState<AppSettings | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const loadStages = () => listStages().then(setStages);
  useEffect(() => {
    void getSettings().then(setS);
    void loadStages();
  }, []);
  if (!s) return null;
  const co = (k: keyof CompanyInfo) => ({
    value: (s.company[k] as string) ?? "",
    onChange: (e: { currentTarget: { value: string } }) => setS({ ...s, company: { ...s.company, [k]: e.currentTarget.value } }),
  });
  const save = () => attempt(() => saveSettings(s).then(setS), "Nastavenia uložené");
  const year = new Date().getFullYear();

  async function pickLogo() {
    const f = await pickFile("Obrázok", ["png", "jpg", "jpeg"]);
    if (!f) return;
    if (f.bytes.length > 1_500_000) return attempt(() => Promise.reject(new Error("Logo je príliš veľké (max 1,5 MB)")));
    setS({ ...s!, company: { ...s!.company, logoDataUrl: toDataUrl(f.bytes, f.fileName) } });
  }

  async function move(i: number, dir: -1 | 1) {
    const ids = stages.map((x) => x.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await attempt(() => reorderStages(ids));
    void loadStages();
  }

  return (
    <Stack>
      <PageHeader title="Nastavenia">
        <Button onClick={save}>Uložiť nastavenia</Button>
      </PageHeader>

      <Card withBorder>
        <Title order={4} mb="sm">
          Údaje firmy (do PDF ponúk)
        </Title>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Grid>
              <Grid.Col span={12}>
                <TextInput label="Obchodné meno" {...co("name")} />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label="Ulica" {...co("street")} />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput label="PSČ" {...co("zip")} />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput label="Mesto" {...co("city")} />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput label="Krajina" {...co("country")} />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput label="IČO" {...co("ico")} />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput label="DIČ" {...co("dic")} />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput label="IČ DPH" {...co("icDph")} />
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput label="Zápis v registri" placeholder="Zapísaná v OR Okresného súdu Bratislava I, oddiel Sro, vložka č. ..." {...co("registration")} />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label="IBAN" {...co("iban")} />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput label="Banka" {...co("bank")} />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput label="SWIFT" {...co("swift")} />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput label="E-mail" {...co("email")} />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput label="Telefón" {...co("phone")} />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput label="Web" {...co("web")} />
              </Grid.Col>
            </Grid>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Text size="sm" fw={500} mb={4}>
              Logo
            </Text>
            <Card withBorder h={140} p="xs">
              {s.company.logoDataUrl ? (
                <Image src={s.company.logoDataUrl} fit="contain" h={120} />
              ) : (
                <Text c="dimmed" size="sm" ta="center" mt={45}>
                  Bez loga. V PDF sa zobrazí názov firmy.
                </Text>
              )}
            </Card>
            <Group mt="xs">
              <Button size="xs" variant="light" leftSection={<IconUpload size={14} />} onClick={pickLogo}>
                Nahrať PNG/JPG
              </Button>
              {s.company.logoDataUrl && (
                <Button size="xs" variant="subtle" color="red" onClick={() => setS({ ...s, company: { ...s.company, logoDataUrl: null } })}>
                  Odstrániť
                </Button>
              )}
            </Group>
          </Grid.Col>
        </Grid>
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          Doklady a upozornenia
        </Title>
        <Grid>
          <Grid.Col span={3}>
            <Select label="Mena" data={["EUR", "CZK", "USD"]} value={s.currency} onChange={(v) => v && setS({ ...s, currency: v })} />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput label="Predvolená DPH %" value={s.defaultVatRate} min={0} max={100} onChange={(v) => setS({ ...s, defaultVatRate: Number(v) || 0 })} />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput label="Platnosť ponuky (dní)" value={s.quoteValidityDays} min={1} onChange={(v) => setS({ ...s, quoteValidityDays: Number(v) || 30 })} />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput label="Upozorniť pred splatnosťou (dní)" value={s.dueSoonDays} min={0} onChange={(v) => setS({ ...s, dueSoonDays: Number(v) || 0 })} />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Číslovanie ponúk"
              description={`Napr. ${formatNumber(s.quoteNumberPattern, year, 1)}. {YYYY} rok, {YY} krátky rok, {NNN} poradie`}
              value={s.quoteNumberPattern}
              onChange={(e) => setS({ ...s, quoteNumberPattern: e.currentTarget.value })}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Číslovanie zákaziek"
              description={`Napr. ${formatNumber(s.orderNumberPattern, year, 1)}`}
              value={s.orderNumberPattern}
              onChange={(e) => setS({ ...s, orderNumberPattern: e.currentTarget.value })}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea label="Záverečný text v PDF ponuke" autosize minRows={2} value={s.quoteFooterText} onChange={(e) => setS({ ...s, quoteFooterText: e.currentTarget.value })} />
          </Grid.Col>
        </Grid>
      </Card>

      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={4}>Fázy pipeline</Title>
          <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => void attempt(() => saveStage({ name: "Nová fáza", kind: "open", color: "gray" })).then(loadStages)}>
            Pridať fázu
          </Button>
        </Group>
        <Table>
          <Table.Tbody>
            {stages.map((st, i) => (
              <StageRow key={st.id} stage={st} first={i === 0} last={i === stages.length - 1} onMove={(d) => move(i, d)} onChanged={loadStages} />
            ))}
          </Table.Tbody>
        </Table>
        <Text size="xs" c="dimmed" mt="xs">
          Typ „Vyhraté“ určuje, kam sa ponuka presunie po vytvorení zákazky. Fázu s ponukami nemožno zmazať.
        </Text>
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          Zálohy
        </Title>
        <Alert mb="sm" color="blue">
          Vyberte priečinok, napríklad v OneDrive. Aplikácia tam raz denne pri spustení uloží kópiu databázy. Samotná databáza zostáva v počítači.
        </Alert>
        <Group align="flex-end">
          <TextInput label="Priečinok záloh" style={{ flex: 1 }} value={s.backupDir ?? ""} readOnly placeholder="Nevybraný" />
          <Button variant="default" leftSection={<IconFolder size={16} />} onClick={async () => {
            const dir = await pickDirectory();
            if (dir) await attempt(() => saveSettings({ backupDir: dir }).then(setS), "Priečinok uložený");
          }}>
            Vybrať
          </Button>
          <Button leftSection={<IconDatabaseExport size={16} />} disabled={!s.backupDir} onClick={() => void attempt(async () => {
            const path = await backupNow();
            setS(await getSettings());
            return path;
          }, "Záloha vytvorená")}>
            Zálohovať teraz
          </Button>
        </Group>
        {s.lastBackupAt && (
          <Text size="sm" c="dimmed" mt="xs">
            Posledná záloha: {new Date(s.lastBackupAt).toLocaleString("sk-SK")}
          </Text>
        )}
      </Card>
    </Stack>
  );
}

function StageRow({ stage, first, last, onMove, onChanged }: { stage: PipelineStage; first: boolean; last: boolean; onMove: (d: -1 | 1) => void; onChanged: () => void }) {
  const [name, setName] = useState(stage.name);
  useEffect(() => setName(stage.name), [stage.name]);
  const update = (patch: Partial<Pick<PipelineStage, "name" | "kind" | "color">>) =>
    void attempt(() => saveStage({ name: stage.name, kind: stage.kind, color: stage.color, ...patch }, stage.id)).then(onChanged);
  return (
    <Table.Tr>
      <Table.Td>
        <TextInput size="xs" value={name} onChange={(e) => setName(e.currentTarget.value)} onBlur={() => name !== stage.name && update({ name })} />
      </Table.Td>
      <Table.Td w={140}>
        <Select size="xs" data={Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label }))} value={stage.kind} onChange={(k) => k && update({ kind: k as PipelineStage["kind"] })} allowDeselect={false} />
      </Table.Td>
      <Table.Td w={140}>
        <Select
          size="xs"
          data={COLORS}
          value={stage.color}
          onChange={(c) => c && update({ color: c })}
          leftSection={<ColorSwatch size={12} color={`var(--mantine-color-${stage.color}-6)`} />}
          allowDeselect={false}
        />
      </Table.Td>
      <Table.Td w={110}>
        <Group gap={0}>
          <ActionIcon variant="subtle" disabled={first} onClick={() => onMove(-1)}>
            <IconArrowUp size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" disabled={last} onClick={() => onMove(1)}>
            <IconArrowDown size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => void attempt(() => deleteStage(stage.id), "Fáza zmazaná").then(onChanged)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
