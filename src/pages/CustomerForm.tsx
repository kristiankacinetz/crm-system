import { Button, Grid, Group, Modal, TextInput, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";
import { createCustomer, emptyCustomer, updateCustomer, type CustomerInput } from "../db/repo/customers";
import type { Customer } from "../db/schema";
import { nn } from "../ui/fields";
import { attempt } from "../ui/notify";

export function CustomerForm({
  opened,
  onClose,
  customer,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSaved: (id: string) => void;
}) {
  const [v, setV] = useState<CustomerInput>(emptyCustomer());
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (opened) setV(customer ? { ...customer } : emptyCustomer());
  }, [opened, customer]);
  const set = (k: keyof CustomerInput) => (e: { currentTarget: { value: string } }) => setV({ ...v, [k]: e.currentTarget.value });

  async function submit() {
    setBusy(true);
    const clean: CustomerInput = {
      ...v,
      ico: nn(v.ico),
      dic: nn(v.dic),
      icDph: nn(v.icDph),
      street: nn(v.street),
      city: nn(v.city),
      zip: nn(v.zip),
      email: nn(v.email),
      phone: nn(v.phone),
      web: nn(v.web),
      note: nn(v.note),
      country: v.country?.trim() || "SK",
    };
    let id = customer?.id ?? "";
    const ok = await attempt(async () => {
      id = customer ? (await updateCustomer(customer.id, clean)).id : (await createCustomer(clean)).id;
    }, "Zákazník uložený");
    setBusy(false);
    if (ok) {
      onSaved(id);
      onClose();
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={customer ? "Upraviť zákazníka" : "Nový zákazník"} size="lg">
      <Grid>
        <Grid.Col span={12}>
          <TextInput label="Obchodné meno" required value={v.name} onChange={set("name")} data-autofocus />
        </Grid.Col>
        <Grid.Col span={4}>
          <TextInput label="IČO" value={v.ico ?? ""} onChange={set("ico")} />
        </Grid.Col>
        <Grid.Col span={4}>
          <TextInput label="DIČ" value={v.dic ?? ""} onChange={set("dic")} />
        </Grid.Col>
        <Grid.Col span={4}>
          <TextInput label="IČ DPH" value={v.icDph ?? ""} onChange={set("icDph")} />
        </Grid.Col>
        <Grid.Col span={12}>
          <TextInput label="Ulica" value={v.street ?? ""} onChange={set("street")} />
        </Grid.Col>
        <Grid.Col span={5}>
          <TextInput label="Mesto" value={v.city ?? ""} onChange={set("city")} />
        </Grid.Col>
        <Grid.Col span={3}>
          <TextInput label="PSČ" value={v.zip ?? ""} onChange={set("zip")} />
        </Grid.Col>
        <Grid.Col span={4}>
          <TextInput label="Krajina" value={v.country ?? ""} onChange={set("country")} />
        </Grid.Col>
        <Grid.Col span={4}>
          <TextInput label="E-mail" value={v.email ?? ""} onChange={set("email")} />
        </Grid.Col>
        <Grid.Col span={4}>
          <TextInput label="Telefón" value={v.phone ?? ""} onChange={set("phone")} />
        </Grid.Col>
        <Grid.Col span={4}>
          <TextInput label="Web" value={v.web ?? ""} onChange={set("web")} />
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea label="Poznámka" autosize minRows={2} value={v.note ?? ""} onChange={set("note")} />
        </Grid.Col>
      </Grid>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          Zrušiť
        </Button>
        <Button onClick={submit} loading={busy}>
          Uložiť
        </Button>
      </Group>
    </Modal>
  );
}
