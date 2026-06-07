export async function up({
  context,
}: {
  context: {
    firestore: FirebaseFirestore.Firestore;
    processDocuments: (...args: never[]) => unknown;
  };
}) {
  if (typeof context.processDocuments !== "function") {
    throw new Error("migration context is missing processDocuments");
  }

  await context.firestore
    .collection("_migration_effects")
    .doc("second")
    .set({ applied: true });
}

export async function down({
  context,
}: {
  context: { firestore: FirebaseFirestore.Firestore };
}) {
  await context.firestore
    .collection("_migration_effects")
    .doc("second")
    .delete();
}
