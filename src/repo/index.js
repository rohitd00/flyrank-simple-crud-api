let repo;
if (process.env.DATABASE_URL) {
  repo = await import("./postgres.js");
} else {
  repo = await import("./sqlite.js");
}
export default repo;
