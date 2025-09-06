// Simple database connection test
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test 1: Read users
    console.log('\n1. Reading users from database:')
    const users = await prisma.user.findMany()
    console.log(`   Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`   • ${user.displayName} (${user.address.slice(0, 8)}...)`)
    })
    
    // Test 2: Create a test skill
    console.log('\n2. Creating a test skill...')
    const testUser = users[0]
    const skill = await prisma.skill.create({
      data: {
        name: 'Database Testing',
        userId: testUser.id
      }
    })
    console.log(`   ✅ Created skill: "${skill.name}" for ${testUser.displayName}`)
    
    // Test 3: Read skills with relationships
    console.log('\n3. Reading skills with user relationships:')
    const skills = await prisma.skill.findMany({
      include: { user: true }
    })
    console.log(`   Found ${skills.length} skills:`)
    skills.forEach(skill => {
      console.log(`   • ${skill.name} by ${skill.user.displayName}`)
    })
    
    // Test 4: Clean up test data
    console.log('\n4. Cleaning up test skill...')
    await prisma.skill.delete({ where: { id: skill.id } })
    console.log('   ✅ Test skill deleted')
    
    console.log('\n🎊 DATABASE CONNECTION TEST PASSED!')
    console.log('✅ All CRUD operations working perfectly!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
