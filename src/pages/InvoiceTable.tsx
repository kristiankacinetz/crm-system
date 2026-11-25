import { Table, Text } from "@mantine/core";
import type { InvoiceView } from "../db/repo/invoices";
import { formatDate } from "../domain/dates";
import { formatMoney } from "../domain/money";
import { InvoiceStatusBadge } from "../ui/fields";

export function InvoiceTable({
  invoices,
  onOpen,
  showCustomer = true,
  empty = "Žiadne faktúry.",
}: {
  invoices: InvoiceView[];
  onOpen: (inv: InvoiceView) => void;
  showCustomer?: boolean;
  empty?: string;
}) {
  return (
    <Table highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Číslo</Table.Th>
          {showCustomer && <Table.Th>Odberateľ</Table.Th>}
          <Table.Th>Vystavená</Table.Th>
          <Table.Th>Splatná</Table.Th>
          <Table.Th className="num">Suma s DPH</Table.Th>
          <Table.Th className="num">Zostáva</Table.Th>
          <Table.Th>Stav</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {invoices.map((i) => (
          <Table.Tr key={i.id} className="clickable-row" onClick={() => onOpen(i)}>
            <Table.Td fw={500}>{i.number}</Table.Td>
            {showCustomer && <Table.Td>{i.customerName}</Table.Td>}
            <Table.Td>{formatDate(i.issueDate)}</Table.Td>
            <Table.Td>
              {formatDate(i.dueDate)}
              {i.status === "overdue" && (
                <Text span c="red" size="xs" ml={6}>
                  ({i.daysOverdue} dní)
                </Text>
              )}
            </Table.Td>
            <Table.Td className="num">{formatMoney(i.totalGross, i.currency)}</Table.Td>
            <Table.Td className="num">{i.status === "cancelled" ? "" : formatMoney(i.remaining, i.currency)}</Table.Td>
            <Table.Td>
              <InvoiceStatusBadge status={i.status} />
            </Table.Td>
          </Table.Tr>
        ))}
        {invoices.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={showCustomer ? 7 : 6}>
              <Text c="dimmed" ta="center" py="lg">
                {empty}
              </Text>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
