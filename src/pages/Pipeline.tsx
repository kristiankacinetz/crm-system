import { Badge, Button, Card, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { listQuotes, moveQuoteToStage } from "../db/repo/quotes";
import { listStages } from "../db/repo/stages";
import { formatDate } from "../domain/dates";
import { formatMoney } from "../domain/money";
import { attempt } from "../ui/notify";
import { PageHeader } from "../ui/PageHeader";
import { useAsync } from "../ui/useAsync";

/** Kanban board of quotes by stage. Drag a card to another column to change its stage. */
export default function Pipeline() {
  const navigate = useNavigate();
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const { data, reload } = useAsync(async () => {
    const [quotes, stages] = await Promise.all([listQuotes(), listStages()]);
    return { quotes, stages };
  }, []);
  if (!data) return null;

  async function drop(stageId: string, quoteId: string) {
    setDropTarget(null);
    const q = data!.quotes.find((x) => x.id === quoteId);
    if (!q || q.stageId === stageId) return;
    await attempt(() => moveQuoteToStage(quoteId, stageId));
    void reload();
  }

  return (
    <>
      <PageHeader title="Pipeline">
        <Button leftSection={<IconPlus size={16} />} onClick={() => navigate("/quotes/new")}>
          Nová ponuka
        </Button>
      </PageHeader>
      <ScrollArea>
        <Group align="flex-start" wrap="nowrap" gap="md" pb="md">
          {data.stages.map((s) => {
            const qs = data.quotes.filter((q) => q.stageId === s.id);
            return (
              <Card
                key={s.id}
                withBorder
                bg="gray.1"
                className={`pipeline-column${dropTarget === s.id ? " drop-target" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTarget(s.id);
                }}
                onDragLeave={() => setDropTarget((t) => (t === s.id ? null : t))}
                onDrop={(e) => {
                  e.preventDefault();
                  void drop(s.id, e.dataTransfer.getData("text/plain"));
                }}
              >
                <Group justify="space-between" mb="sm">
                  <Badge color={s.color} size="lg" variant="light">
                    {s.name}
                  </Badge>
                  <Text size="sm" c="dimmed">
                    {qs.length} · {formatMoney(qs.reduce((a, q) => a + q.totalNet, 0))}
                  </Text>
                </Group>
                <Stack gap="xs" mih={80}>
                  {qs.map((q) => (
                    <Card
                      key={q.id}
                      withBorder
                      shadow="xs"
                      p="sm"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", q.id)}
                      onClick={() => navigate(`/quotes/${q.id}`)}
                      style={{ cursor: "grab" }}
                    >
                      <Text fw={600} size="sm">
                        {q.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {q.customerName} · {q.number}
                      </Text>
                      <Group justify="space-between" mt={6}>
                        <Text size="sm" fw={500}>
                          {formatMoney(q.totalNet, q.currency)}
                        </Text>
                        {q.expectedCloseDate && (
                          <Text size="xs" c="dimmed">
                            do {formatDate(q.expectedCloseDate)}
                          </Text>
                        )}
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Card>
            );
          })}
        </Group>
      </ScrollArea>
      <Text size="xs" c="dimmed">
        Kartu presuniete do inej fázy potiahnutím. Fázy sa dajú upraviť v Nastaveniach. Sumy sú bez DPH.
      </Text>
    </>
  );
}
