export async function up({
  context,
}: {
  context: { firestore: FirebaseFirestore.Firestore };
}) {
  await context.firestore
    .collection("_migration_effects")
    .doc("first")
    .set({ applied: true });
}

export async function down({
  context,
}: {
  context: { firestore: FirebaseFirestore.Firestore };
}) {
  await context.firestore
    .collection("_migration_effects")
    .doc("first")
    .delete();
}
