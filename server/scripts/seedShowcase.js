/**
 * server/scripts/seedShowcase.js
 *
 * Comprehensive seeder for project showcase / evaluation.
 * 1. Seeds all Punjab cities, 19 categories, 135 departments, and 66 demo tickets.
 * 2. Creates the Super Admin account (superadmin@nivaran.gov).
 * 3. Creates universal demo accounts (admin@nivaran.gov, staff@nivaran.gov, citizen@nivaran.gov).
 * 4. Ensures ALL users in the database are verified and active (isVerified: true, isActive: true).
 * 5. Guarantees every account can log in immediately with 'Demo@123' or 'Admin@123456'.
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = fs.existsSync(path.join(__dirname, 'config', 'db.js'))
  ? __dirname
  : path.join(__dirname, '..')

dotenv.config({ path: path.join(rootDir, '.env') })

const { default: connectDB } = await import(path.join(rootDir, 'config', 'db.js'))
const { default: User } = await import(path.join(rootDir, 'models', 'User.js'))
const { default: Municipality } = await import(path.join(rootDir, 'models', 'Municipality.js'))
const { default: Department } = await import(path.join(rootDir, 'models', 'Department.js'))
const { seedDatabase } = await import(path.join(rootDir, 'seed.js'))

async function run() {
  console.log('========================================================')
  console.log('🌱 Nivaran Project Showcase Master Seeder Starting...')
  console.log('========================================================\n')

  await connectDB()

  // Step 1: Run core database seed (categories, cities, departments, reports)
  console.log('--- Step 1: Seeding Catalog, Departments & Tickets ---')
  await seedDatabase()

  // Step 2: Ensure Super Admin exists
  console.log('\n--- Step 2: Configuring Super Admin ---')
  const superPasswordHash = await bcrypt.hash('Admin@123456', 10)
  await User.findOneAndUpdate(
    { email: 'superadmin@nivaran.gov' },
    {
      $set: {
        name: 'Platform Super Admin',
        email: 'superadmin@nivaran.gov',
        passwordHash: superPasswordHash,
        role: 'superadmin',
        municipality: null,
        isVerified: true,
        isActive: true,
        tokenVersion: 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  console.log('✔ Super Admin ready: superadmin@nivaran.gov (Password: Admin@123456)')

  // Step 3: Fetch a live demo municipality (Jalandhar)
  const jalandhar = await Municipality.findOne({ name: 'Jalandhar' })
  if (!jalandhar) {
    throw new Error('Jalandhar municipality not found. Please verify seed data.')
  }

  const roadsDept = await Department.findOne({ municipality: jalandhar._id, key: 'roads' })

  // Universal password hash for all demo accounts
  const demoPasswordHash = await bcrypt.hash('Demo@123', 10)

  // Step 4: Create Universal Showcase Accounts (Easy to remember!)
  console.log('\n--- Step 3: Creating Universal Showcase Accounts ---')

  // Clear any existing primary admin for this municipality so we don't violate the partial unique index
  await User.updateMany(
    { municipality: jalandhar._id, role: 'admin', isPrimaryAdmin: true },
    { $set: { isPrimaryAdmin: false } }
  )

  // Universal City Admin
  await User.findOneAndUpdate(
    { email: 'admin@nivaran.gov' },
    {
      $set: {
        name: 'Jalandhar City Administrator',
        email: 'admin@nivaran.gov',
        passwordHash: demoPasswordHash,
        role: 'admin',
        municipality: jalandhar._id,
        city: jalandhar.name,
        state: jalandhar.state,
        isVerified: true,
        isActive: true,
        isPrimaryAdmin: true,
        tokenVersion: 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  console.log('✔ Universal City Admin: admin@nivaran.gov (Password: Demo@123)')

  // Universal Municipal Staff
  await User.findOneAndUpdate(
    { email: 'staff@nivaran.gov' },
    {
      $set: {
        name: 'Jalandhar Municipal Officer',
        email: 'staff@nivaran.gov',
        passwordHash: demoPasswordHash,
        role: 'staff',
        municipality: jalandhar._id,
        department: roadsDept?._id,
        city: jalandhar.name,
        state: jalandhar.state,
        employeeId: 'EMP-JAL-001',
        designation: 'Nodal Redressal Officer',
        applicationStatus: 'approved',
        isVerified: true,
        isActive: true,
        tokenVersion: 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  console.log('✔ Universal Staff Officer: staff@nivaran.gov (Password: Demo@123)')

  // Universal Citizen
  await User.findOneAndUpdate(
    { email: 'citizen@nivaran.gov' },
    {
      $set: {
        name: 'Sachin Sharma (Citizen)',
        email: 'citizen@nivaran.gov',
        passwordHash: demoPasswordHash,
        role: 'citizen',
        municipality: jalandhar._id,
        city: jalandhar.name,
        state: jalandhar.state,
        homeAddress: {
          text: 'Model Town, Jalandhar',
          lat: jalandhar.centroid.lat,
          lng: jalandhar.centroid.lng,
        },
        isVerified: true,
        isActive: true,
        tokenVersion: 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  console.log('✔ Universal Citizen: citizen@nivaran.gov (Password: Demo@123)')

  // Step 5: Auto-verify ALL existing users in the database
  console.log('\n--- Step 4: Ensuring All Users are Verified & Active ---')
  const updateResult = await User.updateMany(
    {},
    {
      $set: {
        isVerified: true,
        isActive: true,
      },
    }
  )
  console.log(`✔ Verified and activated ${updateResult.modifiedCount} accounts in database.`)

  console.log('\n========================================================')
  console.log('🎉 SHOWCASE DEMO ACCOUNTS READY TO USE!')
  console.log('========================================================')
  console.log('Super Admin:  superadmin@nivaran.gov       | Password: Admin@123456')
  console.log('City Admin:   admin@nivaran.gov            | Password: Demo@123')
  console.log('City Admin:   admin.jalandhar@nivaran.gov  | Password: Demo@123')
  console.log('Staff:        staff@nivaran.gov            | Password: Demo@123')
  console.log('Staff:        staff.roads.jalandhar@nivaran.gov | Password: Demo@123')
  console.log('Citizen:      citizen@nivaran.gov          | Password: Demo@123')
  console.log('Citizen:      citizen1.jalandhar@example.com | Password: Demo@123')
  console.log('========================================================\n')

  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error('Showcase seeding failed:', err)
  process.exit(1)
})
