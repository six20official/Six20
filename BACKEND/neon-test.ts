import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.$queryRaw<
    Array<{
      current_database: string;
      current_user: string;
      version: string;
    }>
  >`
    SELECT
      current_database()::text AS current_database,
      current_user::text AS current_user,
      version()::text AS version
  `;

  console.log(result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });