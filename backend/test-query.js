const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQueries() {
  try {
    console.log('Testing getTopDeliverers query...');
    
    // Test 1: Get deliverers
    const deliverers = await prisma.user.findMany({
      where: { role: 'DELIVERER' },
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePicture: true
      }
    });
    console.log('Deliverers found:', deliverers.length);
    
    // Test 2: Count orders
    if (deliverers.length > 0) {
      const d = deliverers[0];
      const count = await prisma.order.count({
        where: {
          driverId: d.id,
          status: 'COMPLETED'
        }
      });
      console.log('Order count for first deliverer:', count);
      
      // Test 3: Aggregate earnings
      const earnings = await prisma.order.aggregate({
        _sum: { driverEarnings: true },
        where: {
          driverId: d.id,
          status: 'COMPLETED',
          driverEarnings: { not: null }
        }
      });
      console.log('Earnings:', earnings);
    }
    
    console.log('\nTesting getDeliverersOverview query...');
    
    // Test total deliverers
    const totalDeliverers = await prisma.user.count({
      where: { role: 'DELIVERER' }
    });
    console.log('Total deliverers:', totalDeliverers);
    
    // Test active deliverers query
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeDelivererIds = await prisma.order.findMany({
      where: {
        driverId: { not: null },
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { driverId: true },
      distinct: ['driverId']
    });
    console.log('Active deliverers:', activeDelivererIds.length);
    
    console.log('\nTesting getEarningsSummary query...');
    
    const totalEarnings = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: {
        status: 'COMPLETED',
        totalAmount: { not: null }
      }
    });
    console.log('Total earnings:', totalEarnings);
    
    console.log('\nTesting getAllDeliverers query...');
    
    const whereClause = {
      role: 'DELIVERER',
    };
    
    const allDeliverers = await prisma.user.findMany({
      where: whereClause,
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        profilePicture: true,
        isActive: true,
        createdAt: true,
        driverProfile: {
          select: {
            id: true,
            vehicleType: true,
            plateNumber: true,
            status: true
          }
        },
        _count: {
          select: {
            driverOrders: true
          }
        }
      }
    });
    console.log('All deliverers with profile:', allDeliverers.length);
    console.log('Sample deliverer:', JSON.stringify(allDeliverers[0], null, 2));
    
    console.log('\n✅ All queries passed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQueries();
