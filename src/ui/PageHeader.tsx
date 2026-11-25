import { Group, Title } from "@mantine/core";
import type { ReactNode } from "react";

export function PageHeader({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <Group justify="space-between" mb="lg" wrap="nowrap">
      <Title order={2}>{title}</Title>
      <Group gap="sm">{children}</Group>
    </Group>
  );
}
