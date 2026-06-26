const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed staff users (mirrors mockUsers in mockData.js)
  const staff = [
    { firstName: "Muon",    lastName: "Sokea",      email: "muonsokea@gmail.com",     password: "sokea123",      role: "Supervisor" },
    { firstName: "San",     lastName: "Sotheayuth", email: "sansotheayuth@gmail.com", password: "sotheayuth123", role: "Admin" },
    { firstName: "Proeung", lastName: "Sivly",      email: "proeungsivly@gmail.com",  password: "sivly123",      role: "Organizer" },
  ];

  let organizer;
  for (const u of staff) {
    const hash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hash },
    });
    if (u.role === "Organizer") organizer = user;
    console.log(`  ✓ ${u.role}: ${u.email}`);
  }

  // Seed a handful of sample events
  const sampleEvents = [
    { title: "Tech Innovation Summit 2026",  category: "Technology",    date: new Date("2026-03-15"), location: "Phnom Penh Convention Centre", capacity: 500, price: 25 },
    { title: "Startup Pitch Night",           category: "Business",      date: new Date("2026-04-10"), location: "Factory Phnom Penh",          capacity: 200, price: 10 },
    { title: "Khmer Digital Arts Festival",  category: "Entertainment", date: new Date("2026-05-20"), location: "National Museum, Phnom Penh",  capacity: 800, price: 0  },
    { title: "Leadership Workshop Series",   category: "Workshop",      date: new Date("2026-06-05"), location: "Rosewood Hotel, Phnom Penh",  capacity: 50,  price: 50 },
  ];

  for (const e of sampleEvents) {
    await prisma.event.upsert({
      where: { id: sampleEvents.indexOf(e) + 1 },
      update: {},
      create: { ...e, organizerId: organizer.id, published: true },
    });
    console.log(`  ✓ Event: ${e.title}`);
  }

  console.log("\nSeed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
