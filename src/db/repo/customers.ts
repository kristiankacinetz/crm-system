import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "../proxy";
import { contacts, customers, type Contact, type Customer } from "../schema";
import { newId, nowIso } from "../../domain/ids";
import { created, logAudit, touched } from "./audit";

export type CustomerInput = Omit<
  Customer,
  "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "deletedAt"
>;
export type ContactInput = Omit<
  Contact,
  "id" | "customerId" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "deletedAt"
>;

export const emptyCustomer = (): CustomerInput => ({
  name: "",
  ico: null,
  dic: null,
  icDph: null,
  street: null,
  city: null,
  zip: null,
  country: "SK",
  email: null,
  phone: null,
  web: null,
  note: null,
});

/** Normalizes IČO for matching: digits only, leading zeros kept, 8 digits for SK. */
export function normalizeIco(ico: string | null | undefined): string | null {
  if (!ico) return null;
  const d = String(ico).replace(/\D/g, "");
  if (!d) return null;
  return d.length < 8 ? d.padStart(8, "0") : d;
}

export function normalizeName(name: string): string {
  return name
    .toLocaleLowerCase("sk")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[,.]/g, " ")
    .replace(/\b(s\s*r\s*o|a\s*s|spol|k\s*s|v\s*o\s*s)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function listCustomers(): Promise<Customer[]> {
  return getDb().select().from(customers).where(isNull(customers.deletedAt)).orderBy(asc(customers.name)).all();
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  return getDb().select().from(customers).where(eq(customers.id, id)).get();
}

export async function findCustomerByIco(ico: string): Promise<Customer | undefined> {
  const n = normalizeIco(ico);
  if (!n) return undefined;
  const all = await listCustomers();
  return all.find((c) => normalizeIco(c.ico) === n);
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const name = input.name.trim();
  if (!name) throw new Error("Názov zákazníka je povinný");
  const ico = normalizeIco(input.ico);
  if (ico && (await findCustomerByIco(ico))) throw new Error(`Zákazník s IČO ${ico} už existuje`);
  const row = { ...input, name, ico, id: newId(), ...created() };
  await getDb().insert(customers).values(row);
  await logAudit("customer", row.id, "create", { name });
  return (await getCustomer(row.id))!;
}

export async function updateCustomer(id: string, input: Partial<CustomerInput>): Promise<Customer> {
  const patch = { ...input };
  if (patch.name !== undefined) {
    patch.name = patch.name.trim();
    if (!patch.name) throw new Error("Názov zákazníka je povinný");
  }
  if (patch.ico !== undefined) {
    patch.ico = normalizeIco(patch.ico);
    const other = patch.ico ? await findCustomerByIco(patch.ico) : undefined;
    if (other && other.id !== id) throw new Error(`Zákazník s IČO ${patch.ico} už existuje`);
  }
  await getDb().update(customers).set({ ...patch, ...touched() }).where(eq(customers.id, id));
  await logAudit("customer", id, "update", patch);
  return (await getCustomer(id))!;
}

export async function deleteCustomer(id: string) {
  await getDb().update(customers).set({ deletedAt: nowIso(), ...touched() }).where(eq(customers.id, id));
  await logAudit("customer", id, "delete");
}

export async function listContacts(customerId?: string): Promise<Contact[]> {
  const where = customerId
    ? and(isNull(contacts.deletedAt), eq(contacts.customerId, customerId))
    : isNull(contacts.deletedAt);
  return getDb().select().from(contacts).where(where).orderBy(asc(contacts.name)).all();
}

async function clearPrimary(customerId: string, exceptId: string) {
  const all = await listContacts(customerId);
  for (const c of all) {
    if (c.id !== exceptId && c.isPrimary) {
      await getDb().update(contacts).set({ isPrimary: false, ...touched() }).where(eq(contacts.id, c.id));
    }
  }
}

export async function saveContact(customerId: string, input: ContactInput, id?: string): Promise<string> {
  if (!input.name.trim()) throw new Error("Meno kontaktu je povinné");
  const db = getDb();
  let contactId = id;
  if (contactId) {
    await db.update(contacts).set({ ...input, ...touched() }).where(eq(contacts.id, contactId));
    await logAudit("contact", contactId, "update", input);
  } else {
    contactId = newId();
    const isFirst = (await listContacts(customerId)).length === 0;
    await db.insert(contacts).values({ ...input, isPrimary: input.isPrimary || isFirst, customerId, id: contactId, ...created() });
    await logAudit("contact", contactId, "create", { name: input.name });
  }
  if (input.isPrimary) await clearPrimary(customerId, contactId);
  return contactId;
}

export async function deleteContact(id: string) {
  await getDb().update(contacts).set({ deletedAt: nowIso(), ...touched() }).where(eq(contacts.id, id));
  await logAudit("contact", id, "delete");
}
