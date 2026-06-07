export const irreversible = true;

export async function up({
  context,
}: {
  context: { firestore: FirebaseFirestore.Firestore };
}) {
  await context.firestore
    .collection("_migration_effects")
    .doc("irreversible")
    .set({ applied: true });
}
