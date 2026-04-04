const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { Country, State, City } = require('country-state-city');

const prisma = new PrismaClient();

const WEST_AFRICA_CODES = [
    'NG', 'GH', 'SN', 'CI', 'ML', 'BF', 'NE', 'GN',
    'SL', 'LR', 'TG', 'BJ', 'MR', 'GM', 'GW', 'CV',
];

async function main() {
    console.log('Seeding database...');

    // Seed West African countries, states, and cities
    console.log('Seeding West African countries...');

    for (const code of WEST_AFRICA_CODES) {
        const countryData = Country.getCountryByCode(code);
        if (!countryData) {
            console.log(`  Skipping unknown code: ${code}`);
            continue;
        }

        const states = State.getStatesOfCountry(code);
        console.log(`  ${countryData.name} — ${states.length} states`);

        // Build region + city creates
        const regionCreates = states.map(state => {
            const cities = City.getCitiesOfState(code, state.isoCode);
            return {
                name: state.name,
                latitude: parseFloat(state.latitude) || 0,
                longitude: parseFloat(state.longitude) || 0,
                cities: {
                    create: cities.map(city => ({
                        name: city.name,
                        latitude: parseFloat(city.latitude) || 0,
                        longitude: parseFloat(city.longitude) || 0,
                    })),
                },
            };
        });

        await prisma.country.upsert({
            where: { code },
            update: { name: countryData.name },
            create: {
                name: countryData.name,
                code,
                regions: { create: regionCreates },
            },
        });
    }

    const totalCountries = await prisma.country.count();
    const totalRegions = await prisma.region.count();
    const totalCities = await prisma.city.count();
    console.log(`Seeded: ${totalCountries} countries, ${totalRegions} states/regions, ${totalCities} cities.`);

    // Fuel Types
    await prisma.fuelType.upsert({ where: { name: 'Petrol' }, update: {}, create: { name: 'Petrol', unitPrice: 101.5 } });
    await prisma.fuelType.upsert({ where: { name: 'Diesel' }, update: {}, create: { name: 'Diesel', unitPrice: 87.5 } });
    await prisma.fuelType.upsert({ where: { name: 'EV' }, update: {}, create: { name: 'EV', unitPrice: 15.0 } });
    await prisma.fuelType.upsert({ where: { name: 'CNG' }, update: {}, create: { name: 'CNG', unitPrice: 75.0 } });
    console.log('Fuel Types seeded.');

    // Admin User (default to Nigeria/Lagos)
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@smartfuel.com' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'admin@smartfuel.com',
            password: adminPassword,
            role: 'ADMIN',
            phone: '+2341234567890',
            country: 'Nigeria',
            region: 'Lagos',
            city: 'Lagos',
            vehicleType: 'Car',
            fuelType: 'Petrol',
        },
    });
    console.log('Admin user seeded: admin@smartfuel.com');

    // Default Fuel Quotas
    const quotas = [
        { type: 'Car', weeklyLimit: 50.0 },
        { type: 'Motorcycle', weeklyLimit: 20.0 },
        { type: 'Truck', weeklyLimit: 200.0 },
        { type: 'Bus', weeklyLimit: 300.0 },
    ];
    for (const q of quotas) {
        await prisma.fuelQuota.upsert({
            where: { vehicleType: q.type },
            update: { weeklyLimit: q.weeklyLimit },
            create: { vehicleType: q.type, weeklyLimit: q.weeklyLimit },
        });
    }
    console.log('Fuel quotas seeded.');

    console.log('Database seeding completed.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
