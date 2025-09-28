#!/usr/bin/env node

// Setup script to create admin users in the database
// Run with: node scripts/setup-admin-users.js

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcrypt')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdminUsers() {
  console.log('Setting up admin users...')

  const adminUsers = [
    {
      email: "iSellData.ltd@gmail.com",
      name: "Samuella", 
      role: "admin",
      password: "@tradysh!ps<3"
    }
  ]

  for (const user of adminUsers) {
    try {
      // Hash the password
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(user.password, saltRounds)
      
      // Insert user with hashed password (let database generate UUID)
      const { data, error } = await supabase
        .from('admin_users')
        .upsert(
          { 
            email: user.email, 
            name: user.name, 
            role: user.role,
            password_hash: hashedPassword
          }, 
          { onConflict: 'email' }
        )
        .select()
        .single()

      if (error) {
        console.error(`❌ Error creating user ${user.email}:`, error.message)
      } else {
        console.log(`✅ User created: ${user.email} (ID: ${data.id})`)
        console.log(`   Password hashed and stored securely`)
        console.log(`   Login: ${user.email} / ${user.password}`)
      }
    } catch (err) {
      console.error(`❌ Failed to create user ${user.email}:`, err.message)
    }
  }

  console.log('\n🎉 Admin user setup complete!')
  console.log('\nNext steps:')
  console.log('1. Update your login API to use database users instead of DEMO_USERS')
  console.log('2. Test login with: admin@demo.com / password123')
}

setupAdminUsers().catch(console.error)