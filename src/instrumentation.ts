export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { closeDb } = await import(
      "@/infrastructure/sqlite/sqlite-client"
    );

    process.on("SIGTERM", () => {
      closeDb();
      process.exit(0);
    });
  }
}
