// backend/scripts/resetPassword.js
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("Usage: node scripts/resetPassword.js <email> <newPassword>");
    process.exit(1);
  }

  console.log(`Resetting password for ${email}...`);

  const hashed = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashed,
      mustChangePassword: true, // force them to change on next login
    },
  });

  console.log("✅ Password updated for:", user.email);
}

main()
  .catch((err) => {
    console.error("❌ resetPassword error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
