// backend/scripts/hardDeleteUser.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function hardDeleteUser(userId) {
  console.log("Hard deleting user:", userId);

  // 1) Delete vendor commissions for this vendor
  await prisma.vendorCommission.deleteMany({
    where: { vendorId: userId },
  });

  // 2) Delete cart leads for this vendor
  await prisma.cartLead.deleteMany({
    where: { vendorId: userId },
  });

  // 3) Find products for this vendor
  const products = await prisma.product.findMany({
    where: { vendorId: userId },
    select: { id: true },
  });
  const productIds = products.map((p) => p.id);

  // 4) Delete order items referencing those products
  if (productIds.length) {
    await prisma.orderItem.deleteMany({
      where: { productId: { in: productIds } },
    });
  }

  // 5) Delete products themselves
  await prisma.product.deleteMany({
    where: { id: { in: productIds } },
  });

  // 6) Delete orders where this user is customer (if any)
  await prisma.order.deleteMany({
    where: { customerId: userId },
  });

  // 7) Finally delete user
  await prisma.user.delete({
    where: { id: userId },
  });

  console.log("Done.");
}

const id = Number(process.argv[2]);
if (!id) {
  console.error("Usage: node scripts/hardDeleteUser.js <userId>");
  process.exit(1);
}

hardDeleteUser(id)
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
