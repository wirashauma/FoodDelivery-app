const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMerchantQuery() {
  try {
    const userId = 7; // merchant@gmail.com user ID
    
    console.log('Testing merchant query with ownerId:', userId);
    
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: userId },
      select: { 
        id: true, 
        businessName: true, 
        averageRating: true, 
        totalRatings: true,
        ownerId: true
      }
    });
    
    console.log('\nResult:', JSON.stringify(merchant, null, 2));

    if (!merchant) {
      console.log('\n❌ Merchant not found!');
    } else {
      console.log('\n✅ Merchant found successfully!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMerchantQuery();
