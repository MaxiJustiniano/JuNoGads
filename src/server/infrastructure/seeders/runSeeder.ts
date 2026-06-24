import { seedAuth } from "./authSeeder.js";

seedAuth()
  .then(() => {
    console.log("Seeder execution completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeder execution failed:", err);
    process.exit(1);
  });
