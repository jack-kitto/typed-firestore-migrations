export const MIGRATION_SLUG_PATTERN = /^[a-z\d]+(-[a-z\d]+)*$/;

export function validateMigrationSlug(slug: string): void {
  if (MIGRATION_SLUG_PATTERN.test(slug)) {
    return;
  }

  throw new Error(
    `Invalid migration slug "${slug}". Use kebab-case like add-order-status (lowercase letters, numbers, and hyphens only).`,
  );
}
