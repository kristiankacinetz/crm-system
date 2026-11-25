import { ActionIcon, Anchor, Badge, Button, Card, Grid, Group, SimpleGrid, Stack, Table, Tabs, Text } from "@mantine/core";
import { IconArrowLeft, IconPencil, IconPlus, IconStar, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteContact, deleteCustomer, getCustomer, listContacts } from "../db/repo/customers";
import { invoicesForCustomer } from "../db/repo/invoices";
import { listOrders, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "../db/repo/orders";
import { listQuotes } from "../db/repo/quotes";
import { listStages } from "../db/repo/stages";
import type { Contact } from "../db/schema";
import { formatDate } from "../domain/dates";
import { isOpen } from "../domain/invoiceStatus";
import { formatMoney } from "../domain/money";
import { confirmDelete } from "../ui/fields";
import { attempt } from "../ui/notify";
import { PageHeader } from "../ui/PageHeader";
import { useAsync } from "../ui/useAsync";
import { ContactForm } from "./ContactForm";
import { CustomerForm } from "./CustomerForm";
import { InvoiceDetail } from "./InvoiceDetail";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceTable } from "./InvoiceTable";

export default function CustomerDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [contact, setContact] = useState<Contact | null | undefined>(undefined);
  const [invoiceDetail, setInvoiceDetail] = useState<string | null>(null);
  const [newInvoice, setNewInvoice] = useState(false);
  const { data, reload } = useAsync(async () => {
    const [customer, contacts, invoices, quotes, orders, stages] = await Promise.all([
      getCustomer(id),
      listContacts(id),
      invoicesForCustomer(id),
      listQuotes(),
      listOrders(),
      listStages(),
    ]);
    return {
      customer,
      contacts,
      invoices,
      quotes: quotes.filter((q) => q.customerId === id),
      orders: orders.filter((o) => o.customerId === id),
      stages: new Map(stages.map((s) => [s.id, s])),
    };
  }, [id]);
  if (!data) return null;
  const c = data.customer;
  if (!c || c.deletedAt) return <Text>Zákazník neexistuje.</Text>;
  const open = data.invoices.filter((i) => isOpen(i.status));
  const address = [c.street, [c.zip, c.city].filter(Boolean).join(" "), c.country !== "SK" ? c.country : null].filter(Boolean).join(", ");

  return (
    <>
      <Anchor size="sm" onClick={() => navigate("/customers")}>
        <Group gap={4}>
          <IconArrowLeft size={14} /> Zákazníci
        </Group>
      </Anchor>
      <PageHeader title={c.name}>
        <Button variant="default" leftSection={<IconPencil size={16} />} onClick={() => setEditing(true)}>
          Upraviť
        </Button>
        <Button
          variant="subtle"
          color="red"
          leftSection={<IconTrash size={16} />}
          onClick={() =>
            confirmDelete(`zákazníka ${c.name}`, () =>
              void attempt(() => deleteCustomer(c.id), "Zákazník zmazaný").then((ok) => ok && navigate("/customers")),
            )
          }
        >
          Zmazať
        </Button>
      </PageHeader>
      <Grid>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder>
            <SimpleGrid cols={2} spacing="sm">
              <Field label="IČO" value={c.ico} />
              <Field label="DIČ" value={c.dic} />
              <Field label="IČ DPH" value={c.icDph} />
              <Field label="Adresa" value={address} />
              <Field label="E-mail" value={c.email} />
              <Field label="Telefón" value={c.phone} />
              <Field label="Web" value={c.web} />
              <Field label="Neuhradené" value={open.length ? formatMoney(open.reduce((s, i) => s + i.remaining, 0)) : "—"} />
            </SimpleGrid>
            {c.note && (
              <Text size="sm" mt="md" style={{ whiteSpace: "pre-wrap" }}>
                {c.note}
              </Text>
            )}
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Kontaktné osoby</Text>
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => setContact(null)}>
                Pridať
              </Button>
            </Group>
            <Table>
              <Table.Tbody>
                {data.contacts.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      <Group gap={4}>
                        {p.isPrimary && <IconStar size={14} color="var(--mantine-color-yellow-6)" />}
                        <Text size="sm" fw={500}>
                          {p.name}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {p.role}
                      </Text>
                    </Table.Td>
                    <Table.Td>{p.email}</Table.Td>
                    <Table.Td>{p.phone}</Table.Td>
                    <Table.Td w={80}>
                      <Group gap={0}>
                        <ActionIcon variant="subtle" onClick={() => setContact(p)}>
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => confirmDelete(`kontakt ${p.name}`, () => void attempt(() => deleteContact(p.id)).then(reload))}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {data.contacts.length === 0 && (
                  <Table.Tr>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        Žiadne kontakty.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder mt="md" p={0}>
        <Tabs defaultValue="invoices">
          <Tabs.List px="md" pt="xs">
            <Tabs.Tab value="invoices">Faktúry ({data.invoices.length})</Tabs.Tab>
            <Tabs.Tab value="quotes">Ponuky ({data.quotes.length})</Tabs.Tab>
            <Tabs.Tab value="orders">Zákazky ({data.orders.length})</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="invoices">
            <Group justify="flex-end" p="xs">
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => setNewInvoice(true)}>
                Zadať faktúru ručne
              </Button>
            </Group>
            <InvoiceTable invoices={data.invoices} showCustomer={false} onOpen={(i) => setInvoiceDetail(i.id)} />
          </Tabs.Panel>
          <Tabs.Panel value="quotes">
            <Group justify="flex-end" p="xs">
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => navigate(`/quotes/new?customer=${c.id}`)}>
                Nová ponuka
              </Button>
            </Group>
            <Table highlightOnHover>
              <Table.Tbody>
                {data.quotes.map((q) => {
                  const st = data.stages.get(q.stageId);
                  return (
                    <Table.Tr key={q.id} className="clickable-row" onClick={() => navigate(`/quotes/${q.id}`)}>
                      <Table.Td fw={500}>{q.number}</Table.Td>
                      <Table.Td>{q.title}</Table.Td>
                      <Table.Td>{formatDate(q.issueDate)}</Table.Td>
                      <Table.Td className="num">{formatMoney(q.totalNet, q.currency)}</Table.Td>
                      <Table.Td>{st && <Badge color={st.color} variant="light">{st.name}</Badge>}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>
          <Tabs.Panel value="orders">
            <Table highlightOnHover>
              <Table.Tbody>
                {data.orders.map((o) => (
                  <Table.Tr key={o.id} className="clickable-row" onClick={() => navigate(`/orders?open=${o.id}`)}>
                    <Table.Td fw={500}>{o.number}</Table.Td>
                    <Table.Td>{o.title}</Table.Td>
                    <Table.Td>{formatDate(o.orderDate)}</Table.Td>
                    <Table.Td className="num">{formatMoney(o.totalNet, o.currency)}</Table.Td>
                    <Table.Td>
                      <Badge color={ORDER_STATUS_COLORS[o.status]} variant="light">
                        {ORDER_STATUS_LABELS[o.status]}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>
        </Tabs>
      </Card>

      <CustomerForm opened={editing} onClose={() => setEditing(false)} customer={c} onSaved={reload} />
      <ContactForm opened={contact !== undefined} onClose={() => setContact(undefined)} customerId={c.id} contact={contact ?? null} onSaved={reload} />
      <InvoiceDetail invoiceId={invoiceDetail} onClose={() => setInvoiceDetail(null)} onChanged={reload} />
      <InvoiceForm opened={newInvoice} onClose={() => setNewInvoice(false)} customerId={c.id} onSaved={reload} />
    </>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Stack gap={0}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm">{value || "—"}</Text>
    </Stack>
  );
}
