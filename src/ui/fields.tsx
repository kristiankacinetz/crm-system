import { Badge, NumberInput, Select, type NumberInputProps } from "@mantine/core";
import { DateInput, type DateInputProps } from "@mantine/dates";
import { modals } from "@mantine/modals";
import { Text } from "@mantine/core";
import type { Customer } from "../db/schema";
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS, type InvoiceStatus } from "../domain/invoiceStatus";

/** Amount input: shows euros, stores integer cents. */
export function MoneyInput({
  value,
  onChange,
  currency = "EUR",
  ...rest
}: Omit<NumberInputProps, "value" | "onChange"> & { value: number; onChange: (cents: number) => void; currency?: string }) {
  return (
    <NumberInput
      {...rest}
      value={value / 100}
      onChange={(v) => onChange(Math.round(Number(v || 0) * 100))}
      decimalScale={2}
      fixedDecimalScale
      decimalSeparator=","
      thousandSeparator=" "
      suffix={currency === "EUR" ? " €" : ` ${currency}`}
    />
  );
}

/** Date input working with "YYYY-MM-DD" strings. */
export function DateField({
  value,
  onChange,
  ...rest
}: Omit<DateInputProps, "value" | "onChange"> & { value: string | null; onChange: (v: string | null) => void }) {
  return <DateInput {...rest} value={value} onChange={(v) => onChange(v ? String(v).slice(0, 10) : null)} valueFormat="D. M. YYYY" clearable={!rest.required} />;
}

export function CustomerSelect({
  customers,
  value,
  onChange,
  ...rest
}: {
  customers: Customer[];
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  required?: boolean;
  clearable?: boolean;
  error?: string;
}) {
  return (
    <Select
      label="Zákazník"
      placeholder="Vyberte zákazníka"
      searchable
      nothingFoundMessage="Nič sa nenašlo"
      data={customers.map((c) => ({ value: c.id, label: c.ico ? `${c.name} (${c.ico})` : c.name }))}
      value={value}
      onChange={onChange}
      {...rest}
    />
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge color={INVOICE_STATUS_COLORS[status]} variant="light">
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  );
}

export function confirmDelete(what: string, onConfirm: () => void) {
  modals.openConfirmModal({
    title: "Potvrdiť zmazanie",
    children: <Text size="sm">Naozaj zmazať {what}?</Text>,
    labels: { confirm: "Zmazať", cancel: "Zrušiť" },
    confirmProps: { color: "red" },
    onConfirm,
  });
}

/** Turns "" into null for optional text fields. */
export const nn = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);
