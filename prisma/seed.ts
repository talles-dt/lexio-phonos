// Optional maintenance for an existing database. The student app uses the bundled catalogue.
import { PrismaClient } from "@prisma/client";
import catalog from "../src/data/catalog.json";
const prisma = new PrismaClient();
async function main() {
  await prisma.$transaction(async (tx) => {
    for (const phoneme of catalog.phonemes)
      await tx.phoneme.upsert({
        where: { id: phoneme.id },
        create: phoneme,
        update: phoneme,
      });
    for (const { phonemeSequence, ...drill } of catalog.drills) {
      const { accentNote, referenceSourceUrl, ...databaseDrill } =
        drill as typeof drill & {
          accentNote?: string;
          referenceSourceUrl?: string;
        };
      void accentNote;
      void referenceSourceUrl;
      const create = phonemeSequence.map(
        ({ phonemeId, position, startTimeMs, endTimeMs }) => ({
          phonemeId,
          position,
          startTimeMs,
          endTimeMs,
        }),
      );
      await tx.drill.upsert({
        where: { id: drill.id },
        create: { ...databaseDrill, phonemeSequence: { create } },
        update: {
          ...databaseDrill,
          phonemeSequence: { deleteMany: {}, create },
        },
      });
    }
  });
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
