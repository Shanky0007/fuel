const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create Countries and Regions
    console.log('Seeding countries and regions...');

    const southAfrica = await prisma.country.upsert({
        where: { code: 'ZA' },
        update: {},
        create: {
            name: 'South Africa',
            code: 'ZA',
            regions: {
                create: [
                    { 
                        name: 'Gauteng', 
                        latitude: -26.2708, 
                        longitude: 28.1123,
                        cities: {
                            create: [
                                { name: 'Johannesburg', latitude: -26.2041, longitude: 28.0473 },
                                { name: 'Pretoria', latitude: -25.7479, longitude: 28.2293 },
                                { name: 'Soweto', latitude: -26.2678, longitude: 27.8585 },
                                { name: 'Sandton', latitude: -26.1076, longitude: 28.0567 },
                                { name: 'Midrand', latitude: -25.9953, longitude: 28.1289 },
                                { name: 'Centurion', latitude: -25.8601, longitude: 28.1889 },
                                { name: 'Benoni', latitude: -26.1885, longitude: 28.3207 },
                                { name: 'Krugersdorp', latitude: -26.0853, longitude: 27.7745 },
                            ]
                        }
                    },
                    { 
                        name: 'Western Cape', 
                        latitude: -33.9249, 
                        longitude: 18.4241,
                        cities: {
                            create: [
                                { name: 'Cape Town', latitude: -33.9249, longitude: 18.4241 },
                                { name: 'Stellenbosch', latitude: -33.9321, longitude: 18.8602 },
                                { name: 'Paarl', latitude: -33.7341, longitude: 18.9645 },
                                { name: 'George', latitude: -33.9630, longitude: 22.4617 },
                                { name: 'Mossel Bay', latitude: -34.1817, longitude: 22.1460 },
                                { name: 'Somerset West', latitude: -34.0787, longitude: 18.8435 },
                                { name: 'Bellville', latitude: -33.8903, longitude: 18.6292 },
                            ]
                        }
                    },
                    { 
                        name: 'KwaZulu-Natal', 
                        latitude: -29.8587, 
                        longitude: 31.0218,
                        cities: {
                            create: [
                                { name: 'Durban', latitude: -29.8587, longitude: 31.0218 },
                                { name: 'Pietermaritzburg', latitude: -29.6007, longitude: 30.3794 },
                                { name: 'Richards Bay', latitude: -28.7830, longitude: 32.0378 },
                                { name: 'Newcastle', latitude: -27.7574, longitude: 29.9319 },
                                { name: 'Ladysmith', latitude: -28.5615, longitude: 29.7795 },
                                { name: 'Empangeni', latitude: -28.7626, longitude: 31.8971 },
                                { name: 'Pinetown', latitude: -29.8114, longitude: 30.8533 },
                            ]
                        }
                    },
                    { 
                        name: 'Eastern Cape', 
                        latitude: -32.2968, 
                        longitude: 26.4194,
                        cities: {
                            create: [
                                { name: 'Port Elizabeth', latitude: -33.9608, longitude: 25.6022 },
                                { name: 'East London', latitude: -33.0153, longitude: 27.9116 },
                                { name: 'Mthatha', latitude: -31.5890, longitude: 28.7842 },
                                { name: 'Grahamstown', latitude: -33.3042, longitude: 26.5328 },
                                { name: 'Uitenhage', latitude: -33.7577, longitude: 25.3971 },
                                { name: 'Queenstown', latitude: -31.8976, longitude: 26.8753 },
                            ]
                        }
                    },
                    { 
                        name: 'Limpopo', 
                        latitude: -23.4013, 
                        longitude: 29.4179,
                        cities: {
                            create: [
                                { name: 'Polokwane', latitude: -23.9045, longitude: 29.4689 },
                                { name: 'Tzaneen', latitude: -23.8333, longitude: 30.1667 },
                                { name: 'Thohoyandou', latitude: -22.9500, longitude: 30.4833 },
                                { name: 'Mokopane', latitude: -24.1942, longitude: 29.0089 },
                                { name: 'Musina', latitude: -22.3397, longitude: 30.0416 },
                                { name: 'Lebowakgomo', latitude: -24.2000, longitude: 29.5000 },
                            ]
                        }
                    },
                    { 
                        name: 'Mpumalanga', 
                        latitude: -25.5653, 
                        longitude: 30.5279,
                        cities: {
                            create: [
                                { name: 'Nelspruit', latitude: -25.4753, longitude: 30.9703 },
                                { name: 'Witbank', latitude: -25.8742, longitude: 29.2321 },
                                { name: 'Middelburg', latitude: -25.7753, longitude: 29.4649 },
                                { name: 'Secunda', latitude: -26.5500, longitude: 29.1667 },
                                { name: 'Standerton', latitude: -26.9333, longitude: 29.2500 },
                                { name: 'Ermelo', latitude: -26.5333, longitude: 29.9833 },
                            ]
                        }
                    },
                    { 
                        name: 'North West', 
                        latitude: -26.6708, 
                        longitude: 25.2837,
                        cities: {
                            create: [
                                { name: 'Mahikeng', latitude: -25.8601, longitude: 25.6447 },
                                { name: 'Rustenburg', latitude: -25.6672, longitude: 27.2420 },
                                { name: 'Klerksdorp', latitude: -26.8667, longitude: 26.6667 },
                                { name: 'Potchefstroom', latitude: -26.7167, longitude: 27.1000 },
                                { name: 'Brits', latitude: -25.6333, longitude: 27.7833 },
                                { name: 'Vryburg', latitude: -26.9564, longitude: 24.7284 },
                            ]
                        }
                    },
                    { 
                        name: 'Free State', 
                        latitude: -28.4541, 
                        longitude: 26.7968,
                        cities: {
                            create: [
                                { name: 'Bloemfontein', latitude: -29.0852, longitude: 26.1596 },
                                { name: 'Welkom', latitude: -27.9833, longitude: 26.7333 },
                                { name: 'Bethlehem', latitude: -28.2333, longitude: 28.3000 },
                                { name: 'Kroonstad', latitude: -27.6500, longitude: 27.2333 },
                                { name: 'Sasolburg', latitude: -26.8167, longitude: 27.8167 },
                                { name: 'Phuthaditjhaba', latitude: -28.5333, longitude: 28.8167 },
                            ]
                        }
                    },
                    { 
                        name: 'Northern Cape', 
                        latitude: -29.0467, 
                        longitude: 21.8569,
                        cities: {
                            create: [
                                { name: 'Kimberley', latitude: -28.7282, longitude: 24.7499 },
                                { name: 'Upington', latitude: -28.4478, longitude: 21.2561 },
                                { name: 'Springbok', latitude: -29.6647, longitude: 17.8856 },
                                { name: 'De Aar', latitude: -30.6500, longitude: 24.0167 },
                                { name: 'Kuruman', latitude: -27.4500, longitude: 23.4333 },
                            ]
                        }
                    },
                ]
            }
        },
    });

    console.log('Countries, regions, and cities seeded.');

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
            phone: '+27123456789',
            country: 'South Africa',
            region: 'Gauteng',
            city: 'Johannesburg',
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
