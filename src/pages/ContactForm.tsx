import { Button, Checkbox, Grid, Group, Modal, TextInput, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";
import { saveContact, type ContactInput } from "../db/repo/customers";
import type { Contact } from "../db/schema";
import { nn } from "../ui/fields";
import { attempt } from "../ui/notify";

const empty = (): ContactInput => ({ name: "", role: null, email: null, phone: null, isPrimary: false, note: null });

export function ContactForm({
  opened,
  onClose,
  customerId,
  contact,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  customerId: string;
  contact: Contact | null;
  onSaved: () => void;
}) {
  const [v, setV] = useState<ContactInput>(empty());
  useEffect(() => {
    if (opened) setV(contact ? { name: contact.name, role: contact.role, email: contact.email, phone: contact.phone, isPrimary: contact.isPrimary, note: contact.note } : empty());
  }, [opened, contact]);
  async function submit() {
    const clean = { ...v, name: v.name.trim(), role: nn(v.role), email: nn(v.email), phone: nn(v.phone), note: nn(v.note) };
    if (await attempt(() => saveContact(customerId, clean, contact?.id), "Kontakt uložený")) {
      onSaved();
      onClose();
    }
  }
  return (
    <Modal opened={opened} onClose={onClose} title={contact ? "Upraviť kontakt" : "Nový kontakt"}>
      <Grid>
        <Grid.Col span={7}>
          <TextInput label="Meno" required value={v.name} onChange={(e) => setV({ ...v, name: e.currentTarget.value })} data-autofocus />
        </Grid.Col>
        <Grid.Col span={5}>
          <TextInput label="Funkcia" value={v.role ?? ""} onChange={(e) => setV({ ...v, role: e.currentTarget.value })} />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput label="E-mail" value={v.email ?? ""} onChange={(e) => setV({ ...v, email: e.currentTarget.value })} />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput label="Telefón" value={v.phone ?? ""} onChange={(e) => setV({ ...v, phone: e.currentTarget.value })} />
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea label="Poznámka" autosize minRows={2} value={v.note ?? ""} onChange={(e) => setV({ ...v, note: e.currentTarget.value })} />
        </Grid.Col>
        <Grid.Col span={12}>
          <Checkbox label="Hlavný kontakt" checked={v.isPrimary} onChange={(e) => setV({ ...v, isPrimary: e.currentTarget.checked })} />
        </Grid.Col>
      </Grid>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          Zrušiť
        </Button>
        <Button onClick={submit}>Uložiť</Button>
      </Group>
    </Modal>
  );
}
