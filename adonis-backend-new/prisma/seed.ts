import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@moringa.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@moringa.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      authProvider: 'LOCAL',
      isEmailVerified: true,
    },
  })

  console.log('Admin user created:', admin.email)

  // Create default store settings
  await prisma.storeSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      shippingCharge: 50,
      taxRate: 0.05,
      freeShippingThreshold: 999,
      codCharge: 0,
      expressShippingCharge: 150,
      handlingCharge: 0,
      sameDayShippingCharge: 300,
      codEnabled: true,
      autoCancelPendingMinutes: 30,
    },
  })

  console.log('Store settings created')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
