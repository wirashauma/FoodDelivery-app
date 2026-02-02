const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMerchantProfile() {
  try {
    // Cari user dengan role MERCHANT yang belum punya merchant profile
    const merchantUsers = await prisma.user.findMany({
      where: {
        role: 'MERCHANT',
        merchantProfile: null
      }
    });

    console.log(`Found ${merchantUsers.length} merchant users without profile`);

    for (const user of merchantUsers) {
      console.log(`\nCreating merchant profile for user: ${user.email}`);
      
      // Buat merchant profile
      const merchant = await prisma.merchant.create({
        data: {
          ownerId: user.id,
          businessName: user.email.split('@')[0] + "'s Restaurant",
          slug: user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-restaurant',
          description: 'Welcome to our restaurant! We serve delicious food with love.',
          phone: user.phone || '081234567890',
          email: user.email,
          address: 'Jakarta, Indonesia',
          latitude: -6.2088,
          longitude: 106.8456,
          city: 'Jakarta',
          district: 'Central Jakarta',
          postalCode: '10110',
          cuisineTypes: ['Indonesian', 'Asian'],
          minimumOrder: 20000,
          deliveryRadius: 5.0,
          preparationTime: 30,
          isOpen: true,
          isActive: true,
          verificationStatus: 'APPROVED',
          verifiedAt: new Date(),
          commissionRate: 10.0
        }
      });

      // Buat operational hours (Senin - Minggu)
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      
      for (const day of days) {
        await prisma.merchantOperationalHour.create({
          data: {
            merchantId: merchant.id,
            dayOfWeek: day,
            openTime: '08:00',
            closeTime: '22:00',
            isOpen: true
          }
        });
      }

      console.log(`✅ Created merchant profile: ${merchant.businessName} (ID: ${merchant.id})`);
    }

    console.log('\n✅ All merchant profiles created successfully!');

  } catch (error) {
    console.error('Error creating merchant profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMerchantProfile();
