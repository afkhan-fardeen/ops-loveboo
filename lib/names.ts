const GENERIC = new Set(["finance", "info", "team", "admin", "accounts", "accounting", "sales", "ops", "hello", "support", "office", "reports", "noreply", "no-reply"]);

/** Best first name for greeting someone: saved name, else the part of their email before any . _ - or +. */
export function firstName(email: string, name?: string | null) {
  const saved = name?.trim().split(/\s+/)[0];
  if (saved) return saved;
  const local = email.split("@")[0].split(/[._+-]/)[0].replace(/\d+$/, "");
  if (!local || GENERIC.has(local.toLowerCase())) return "there";
  return local[0].toUpperCase() + local.slice(1).toLowerCase();
}
