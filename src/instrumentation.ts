export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { closeDb } = await import(
      "@/infrastructure/sqlite/sqlite-client"
    );

    const shutdown = () => {
      closeDb();
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  }
}
