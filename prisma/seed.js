const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Create sample users from the existing userData
  const users = [
    {
      address: '0x1234567890123456789012345678901234567890',
      ensName: 'deanpierce.eth',
      displayName: 'deanpierce.eth',
      farcasterHandle: 'deanpierce',
      bio: 'Building the future of work on Base'
    },
    {
      address: '0x2345678901234567890123456789012345678901',
      baseName: 'alice.base.eth',
      displayName: 'alice.base.eth',
      farcasterHandle: 'alicebuilds',
      bio: 'Smart contract developer and DeFi enthusiast'
    },
    {
      address: '0x3456789012345678901234567890123456789012',
      displayName: '0x3456...9012',
      bio: 'Web3 designer and UI/UX specialist'
    }
  ]

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { address: userData.address },
      update: {},
      create: userData
    })
    console.log(`Created/found user: ${user.displayName}`)
  }

  console.log('Database seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
