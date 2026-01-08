import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Delhi venues with coordinates
const venues = [
    { name: 'Feroz Shah Kotla Stadium', address: 'Bahadur Shah Zafar Marg, Delhi 110002', latitude: 28.6377, longitude: 77.2433, capacity: 35000 },
    { name: 'Jawaharlal Nehru Stadium', address: 'Lodhi Road, New Delhi 110003', latitude: 28.5839, longitude: 77.2320, capacity: 60000 },
    { name: 'Siri Fort Sports Complex', address: 'August Kranti Marg, New Delhi 110049', latitude: 28.5474, longitude: 77.2207, capacity: 8000 },
    { name: 'Thyagaraj Sports Complex', address: 'INA, New Delhi 110023', latitude: 28.5752, longitude: 77.1978, capacity: 5000 },
    { name: 'Major Dhyan Chand National Stadium', address: 'India Gate, New Delhi', latitude: 28.6118, longitude: 77.2372, capacity: 16000 },
    { name: 'Chhatrasal Stadium', address: 'Model Town, Delhi 110009', latitude: 28.7137, longitude: 77.1896, capacity: 10000 },
    { name: 'Indira Gandhi Indoor Stadium', address: 'ITO, New Delhi', latitude: 28.6358, longitude: 77.2441, capacity: 14000 },
    { name: 'Yamuna Sports Complex', address: 'Velodrome, Delhi 110031', latitude: 28.6321, longitude: 77.2806, capacity: 8000 },
    { name: 'DLTA Complex', address: 'Africa Avenue, New Delhi', latitude: 28.5734, longitude: 77.1919, capacity: 3000 },
    { name: 'SPM Swimming Pool Complex', address: 'RK Khanna Tennis Stadium, New Delhi', latitude: 28.5678, longitude: 77.1856, capacity: 2000 },
];

// Subscription plans
const plans = [
    { name: 'Free', slug: 'free', price: 0, roleAccess: 'athlete', features: ['Basic profile', '2 AI analyses/month', 'Browse free events', 'Basic stats'] },
    { name: 'Athlete Pro', slug: 'athlete_pro', price: 24900, roleAccess: 'athlete', features: ['Enhanced profile', 'Unlimited AI analyses', 'Advanced insights', 'Profile analytics', 'Featured in search', 'Priority registration', 'AI Coach chatbot'] },
    { name: 'Organizer Pro', slug: 'organizer_pro', price: 69900, roleAccess: 'organizer', features: ['Unlimited events', 'Reduced commission', 'Event analytics', 'Bulk messaging', 'Featured events', 'Custom branding', 'Priority support'] },
    { name: 'Coach Pro', slug: 'coach_pro', price: 99900, roleAccess: 'coach', features: ['Advanced search filters', 'Access top-ranked players', 'Direct athlete contact', 'Video comparison tools', 'Bulk analytics', 'Talent pipeline', 'Premium support'] },
];

// Sample events
const sampleEvents = [
    { title: 'Delhi Premier Cricket League 2026', sport: 'Cricket', description: 'Annual T20 cricket tournament featuring top teams from Delhi NCR.', date: '2026-02-15', time: '09:00 AM', price: 50000, isPaid: true, maxCapacity: 120, category: 'tournament', image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800' },
    { title: 'Football Fever Championship', sport: 'Football', description: 'Inter-college football championship with teams from all major universities.', date: '2026-02-20', time: '10:00 AM', price: 0, isPaid: false, maxCapacity: 200, category: 'tournament', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800' },
    { title: 'Badminton Masters Open', sport: 'Badminton', description: 'Open badminton tournament for all skill levels.', date: '2026-02-25', time: '08:00 AM', price: 30000, isPaid: true, maxCapacity: 64, category: 'tournament', image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800' },
    { title: 'Swimming Trials - State Level', sport: 'Swimming', description: 'State level swimming trials for selection to national team.', date: '2026-03-01', time: '06:00 AM', price: 20000, isPaid: true, maxCapacity: 100, category: 'tryout', image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800' },
    { title: 'Basketball 3x3 Street Tournament', sport: 'Basketball', description: 'Street basketball tournament with 3x3 format.', date: '2026-03-05', time: '04:00 PM', price: 0, isPaid: false, maxCapacity: 32, category: 'tournament', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800' },
    { title: 'Pro Tennis Academy Coaching Camp', sport: 'Tennis', description: '5-day intensive tennis coaching camp with professional coaches.', date: '2026-03-10', time: '07:00 AM', price: 250000, isPaid: true, maxCapacity: 20, category: 'training', image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800' },
    { title: 'Marathon Delhi 2026', sport: 'Athletics', description: 'Annual Delhi Marathon with 5K, 10K, 21K and full marathon categories.', date: '2026-03-15', time: '05:30 AM', price: 80000, isPaid: true, maxCapacity: 10000, category: 'tournament', image: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800' },
    { title: 'Kabaddi State Championship', sport: 'Kabaddi', description: 'State level Kabaddi championship featuring top teams.', date: '2026-03-20', time: '10:00 AM', price: 0, isPaid: false, maxCapacity: 200, category: 'tournament', image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800' },
    { title: 'Hockey Open Tournament', sport: 'Hockey', description: 'Open hockey tournament for club teams.', date: '2026-03-25', time: '09:00 AM', price: 40000, isPaid: true, maxCapacity: 16, category: 'tournament', image: 'https://images.unsplash.com/photo-1580748142437-c26c59e7e43b?w=800' },
    { title: 'Table Tennis Championship', sport: 'Table Tennis', description: 'Open table tennis championship for all ages.', date: '2026-04-01', time: '09:00 AM', price: 25000, isPaid: true, maxCapacity: 128, category: 'tournament', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' },
    { title: 'Volleyball Beach Tournament', sport: 'Volleyball', description: 'Beach volleyball tournament with 2v2 format.', date: '2026-04-05', time: '03:00 PM', price: 0, isPaid: false, maxCapacity: 32, category: 'tournament', image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800' },
    { title: 'Wrestling Championship', sport: 'Wrestling', description: 'State level wrestling championship with multiple weight categories.', date: '2026-04-10', time: '08:00 AM', price: 15000, isPaid: true, maxCapacity: 120, category: 'tournament', image: 'https://images.unsplash.com/photo-1580474628829-72d38ac0db3e?w=800' },
    { title: 'Boxing Training Camp', sport: 'Boxing', description: '7-day intensive boxing training camp.', date: '2026-04-15', time: '06:00 AM', price: 300000, isPaid: true, maxCapacity: 30, category: 'training', image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800' },
    { title: 'Golf Amateur Championship', sport: 'Golf', description: 'Amateur golf championship open to all handicap holders.', date: '2026-04-20', time: '07:00 AM', price: 500000, isPaid: true, maxCapacity: 60, category: 'tournament', image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800' },
    { title: 'Archery Open Competition', sport: 'Archery', description: 'Open archery competition for recurve and compound bow.', date: '2026-04-25', time: '08:00 AM', price: 35000, isPaid: true, maxCapacity: 50, category: 'tournament', image: 'https://images.unsplash.com/photo-1511719105906-89dfe3bb14c4?w=800' },
    { title: 'Esports Gaming Tournament', sport: 'Esports', description: 'Multi-game esports tournament featuring popular titles.', date: '2026-05-01', time: '11:00 AM', price: 0, isPaid: false, maxCapacity: 200, category: 'tournament', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800' },
];

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.eventRating.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.event.deleteMany();
    await prisma.venue.deleteMany();
    await prisma.aIUsageLog.deleteMany();
    await prisma.performanceData.deleteMany();
    await prisma.athleteProfile.deleteMany();
    await prisma.aICreditsWallet.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.user.deleteMany();

    // Create plans
    console.log('Creating subscription plans...');
    const createdPlans = await Promise.all(
        plans.map((plan) =>
            prisma.plan.create({
                data: {
                    name: plan.name,
                    slug: plan.slug,
                    price: plan.price,
                    roleAccess: plan.roleAccess as any,
                    features: plan.features,
                },
            })
        )
    );
    console.log(`Created ${createdPlans.length} plans`);

    // Create venues
    console.log('Creating venues...');
    const createdVenues = await Promise.all(
        venues.map((venue) =>
            prisma.venue.create({ data: venue })
        )
    );
    console.log(`Created ${createdVenues.length} venues`);

    // Create demo organizer
    console.log('Creating demo users...');
    const hashedPassword = await bcrypt.hash('password123', 12);

    const organizer = await prisma.user.create({
        data: {
            email: 'organizer@athleon.com',
            password: hashedPassword,
            name: 'Delhi Sports Federation',
            role: 'organizer',
            aadhaarVerified: true,
        },
    });

    // Create demo athlete
    const athlete = await prisma.user.create({
        data: {
            email: 'athlete@athleon.com',
            password: hashedPassword,
            name: 'Virat Singh',
            role: 'athlete',
            aadhaarVerified: true,
        },
    });

    // Create athlete profile
    await prisma.athleteProfile.create({
        data: {
            userId: athlete.id,
            sports: ['Cricket'],
            position: 'Batsman',
            location: 'Delhi, India',
            bio: 'Aggressive opening batsman with exceptional timing and footwork.',
            experience: '8 years',
            achievements: ['Delhi U-19 Captain', 'Ranji Trophy Winner', 'Best Batsman 2024'],
            certificates: [],
            videos: [],
            rating: 4.8,
            followers: 2450,
            following: 180,
        },
    });

    // Create athlete credits wallet
    await prisma.aICreditsWallet.create({
        data: {
            userId: athlete.id,
            balance: 50,
        },
    });

    // Subscribe athlete to pro plan
    const athleteProPlan = createdPlans.find((p) => p.slug === 'athlete_pro');
    if (athleteProPlan) {
        await prisma.subscription.create({
            data: {
                userId: athlete.id,
                planId: athleteProPlan.id,
                status: 'active',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
    }

    // Create demo coach
    const coach = await prisma.user.create({
        data: {
            email: 'coach@athleon.com',
            password: hashedPassword,
            name: 'Rahul Dravid',
            role: 'coach',
            aadhaarVerified: true,
        },
    });

    // Create demo viewer
    const viewer = await prisma.user.create({
        data: {
            email: 'viewer@athleon.com',
            password: hashedPassword,
            name: 'Sports Fan',
            role: 'viewer',
            aadhaarVerified: true,
        },
    });

    console.log('Created 4 demo users');

    // Create events
    console.log('Creating sample events...');
    const createdEvents = await Promise.all(
        sampleEvents.map((event, index) => {
            const venue = createdVenues[index % createdVenues.length];
            const rating = (3.5 + Math.random() * 1.5).toFixed(1);
            const spotsUsed = Math.floor(Math.random() * event.maxCapacity * 0.6);

            return prisma.event.create({
                data: {
                    title: event.title,
                    sport: event.sport,
                    description: event.description,
                    venueId: venue.id,
                    date: new Date(event.date),
                    time: event.time,
                    isPaid: event.isPaid,
                    price: event.price,
                    maxCapacity: event.maxCapacity,
                    spotsAvailable: event.maxCapacity - spotsUsed,
                    image: event.image,
                    category: event.category,
                    organizerId: organizer.id,
                    status: 'upcoming',
                    rating: parseFloat(rating),
                    ratingCount: Math.floor(Math.random() * 200) + 20,
                },
            });
        })
    );
    console.log(`Created ${createdEvents.length} events`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📧 Demo accounts:');
    console.log('   Athlete: athlete@athleon.com / password123');
    console.log('   Organizer: organizer@athleon.com / password123');
    console.log('   Coach: coach@athleon.com / password123');
    console.log('   Viewer: viewer@athleon.com / password123');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
