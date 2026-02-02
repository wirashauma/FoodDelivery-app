const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMerchant() {
  try {
    // Cek user merchant
    const merchantUser = await prisma.user.findFirst({
      where: { email: 'merchant@gmail.com' },
      include: {
        merchantProfile: true
      }
    });

    console.log('Merchant User:', JSON.stringify(merchantUser, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMerchant();
