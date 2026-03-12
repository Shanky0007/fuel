const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create Countries and Regions
    console.log('Seeding countries and regions...');

    const usa = await prisma.country.upsert({
        where: { code: 'US' },
        update: {},
        create: {
            name: 'United States',
            code: 'US',
            regions: {
                create: [
                    { name: 'California', latitude: 36.7783, longitude: -119.4179 },
                    { name: 'Texas', latitude: 31.9686, longitude: -99.9018 },
                    { name: 'New York', latitude: 43.2994, longitude: -74.2179 },
                    { name: 'Florida', latitude: 27.6648, longitude: -81.5158 },
                ]
            }
        },
    });

    const india = await prisma.country.upsert({
        where: { code: 'IN' },
        update: {},
        create: {
            name: 'India',
            code: 'IN',
            regions: {
                create: [
                    { name: 'Maharashtra', latitude: 19.7515, longitude: 75.7139 },
                    { name: 'Karnataka', latitude: 15.3173, longitude: 75.7139 },
                    { name: 'Delhi', latitude: 28.7041, longitude: 77.1025 },
                    { name: 'Tamil Nadu', latitude: 11.1271, longitude: 78.6569 },
                ]
            }
        },
    });

    const uk = await prisma.country.upsert({
        where: { code: 'GB' },
        update: {},
        create: {
            name: 'United Kingdom',
            code: 'GB',
            regions: {
                create: [
                    { name: 'London', latitude: 51.5074, longitude: -0.1278 },
                    { name: 'Manchester', latitude: 53.4808, longitude: -2.2426 },
                    { name: 'Birmingham', latitude: 52.4862, longitude: -1.8904 },
                ]
            }
        },
    });

    const canada = await prisma.country.upsert({
        where: { code: 'CA' },
        update: {},
        create: {
            name: 'Canada',
            code: 'CA',
            regions: {
                create: [
                    { name: 'Ontario', latitude: 51.2538, longitude: -85.3232 },
                    { name: 'Quebec', latitude: 52.9399, longitude: -73.5491 },
                    { name: 'British Columbia', latitude: 53.7267, longitude: -127.6476 },
                ]
            }
        },
    });

    console.log('Countries and regions seeded.');

    // Create Fuel Types
    const petrol = await prisma.fuelType.upsert({
        where: { name: 'Petrol' },
        update: {},
        create: { name: 'Petrol', unitPrice: 101.5 },
    });

    const diesel = await prisma.fuelType.upsert({
        where: { name: 'Diesel' },
        update: {},
        create: { name: 'Diesel', unitPrice: 87.5 },
    });

    const ev = await prisma.fuelType.upsert({
        where: { name: 'EV' },
        update: {},
        create: { name: 'EV', unitPrice: 15.0 }, // Per kWh
    });

    const cng = await prisma.fuelType.upsert({
        where: { name: 'CNG' },
        update: {},
        create: { name: 'CNG', unitPrice: 75.0 },
    });

    console.log('Fuel Types seeded.');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@smartfuel.com' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'admin@smartfuel.com',
            password: adminPassword,
            role: 'ADMIN',
            phone: '9999999999',
            country: 'India',
            region: 'Maharashtra',
            vehicleType: 'Car',
            fuelType: 'Petrol',
        },
    });

    console.log('Admin user seeded:', admin.email);

    // Create Default Fuel Quotas
    const vehicleTypes = [
        { type: 'Car', weeklyLimit: 50.0 },           // 50 liters per week
        { type: 'Motorcycle', weeklyLimit: 20.0 },    // 20 liters per week
        { type: 'Truck', weeklyLimit: 200.0 },        // 200 liters per week
        { type: 'Bus', weeklyLimit: 300.0 },          // 300 liters per week
    ];

    for (const vt of vehicleTypes) {
        await prisma.fuelQuota.upsert({
            where: { vehicleType: vt.type },
            update: { weeklyLimit: vt.weeklyLimit },
            create: {
                vehicleType: vt.type,
                weeklyLimit: vt.weeklyLimit,
            },
        });
    }

    console.log('Fuel quotas seeded.');

    console.log('Database seeding completed. Stations will be created dynamically by admins.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
