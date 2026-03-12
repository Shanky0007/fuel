/**
 * Property-Based Test for User Location Persistence
 * Feature: location-based-stations, Property 2: User location persistence
 * Validates: Requirements 1.3
 * 
 * Property: For any user registration with valid country and region,
 * storing the user then retrieving it should return the same country and region values.
 */

const fc = require('fast-check');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('Property 2: User location persistence', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-location-'
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  /**
   * Arbitrary generator for valid country names
   */
  const countryArbitrary = fc.oneof(
    fc.constant('United States'),
    fc.constant('India'),
    fc.constant('United Kingdom'),
    fc.constant('Canada'),
    fc.constant('Australia'),
    fc.constant('Germany'),
    fc.constant('France'),
    fc.constant('Japan'),
    fc.constant('Brazil'),
    fc.constant('South Africa')
  );

  /**
   * Arbitrary generator for valid region names
   */
  const regionArbitrary = fc.oneof(
    fc.constant('California'),
    fc.constant('Maharashtra'),
    fc.constant('London'),
    fc.constant('Ontario'),
    fc.constant('New South Wales'),
    fc.constant('Bavaria'),
    fc.constant('Île-de-France'),
    fc.constant('Tokyo'),
    fc.constant('São Paulo'),
    fc.constant('Gauteng')
  );

  /**
   * Arbitrary generator for user data with location
   */
  const userWithLocationArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    email: fc.emailAddress().map(email => `test-location-${Date.now()}-${Math.random()}-${email}`),
    password: fc.string({ minLength: 6, maxLength: 20 }),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
    country: countryArbitrary,
    region: regionArbitrary,
    role: fc.constant('CUSTOMER')
  });

  test('Property: User location data persists correctly through save and retrieve', async () => {
    await fc.assert(
      fc.asyncProperty(userWithLocationArbitrary, async (userData) => {
        // Use a simpler password hash for testing performance
        const hashedPassword = await bcrypt.hash(userData.password, 1);

        // Create user with location data
        const createdUser = await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            phone: userData.phone,
            country: userData.country,
            region: userData.region,
            role: userData.role
          }
        });

        // Retrieve the user from database
        const retrievedUser = await prisma.user.findUnique({
          where: { id: createdUser.id }
        });

        // Verify location data persisted correctly
        expect(retrievedUser).not.toBeNull();
        expect(retrievedUser.country).toBe(userData.country);
        expect(retrievedUser.region).toBe(userData.region);
        
        // Also verify other fields persisted
        expect(retrievedUser.name).toBe(userData.name);
        expect(retrievedUser.email).toBe(userData.email);
        expect(retrievedUser.phone).toBe(userData.phone);
        expect(retrievedUser.role).toBe(userData.role);

        // Clean up this specific test user
        await prisma.user.delete({
          where: { id: createdUser.id }
        });

        return true;
      }),
      { 
        numRuns: 100, // Run 100 iterations as specified in design
        verbose: true
      }
    );
  }, 120000); // Increase timeout to 120 seconds

  test('Property: Location data round-trip preserves exact values', async () => {
    await fc.assert(
      fc.asyncProperty(
        countryArbitrary,
        regionArbitrary,
        fc.emailAddress(),
        async (country, region, emailBase) => {
          const email = `test-location-${Date.now()}-${Math.random()}-${emailBase}`;
          const hashedPassword = await bcrypt.hash('testpass123', 1);

          // Create user
          const created = await prisma.user.create({
            data: {
              name: 'Test User',
              email: email,
              password: hashedPassword,
              country: country,
              region: region,
              role: 'CUSTOMER'
            }
          });

          // Retrieve user
          const retrieved = await prisma.user.findUnique({
            where: { id: created.id }
          });

          // Assert exact match for location fields
          const locationMatches = 
            retrieved.country === country && 
            retrieved.region === region;

          // Clean up
          await prisma.user.delete({
            where: { id: created.id }
          });

          return locationMatches;
        }
      ),
      { 
        numRuns: 100,
        verbose: true
      }
    );
  }, 120000); // Increase timeout to 120 seconds
});
