import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
    const usersData = [
        { id: 'user-1', email: 'user1@example.com', password: 'password1' },
        { id: 'user-2', email: 'user2@example.com', password: 'password2' },
        { id: 'user-3', email: 'user3@example.com', password: 'password3' },
        { id: 'user-4', email: 'user4@example.com', password: 'password4' },
        { id: 'user-5', email: 'user5@example.com', password: 'password5' },
    ];

    for (const userData of usersData) {
        await prisma.user.upsert({
            where: { id: userData.id },
            update: {},
            create: userData,
        });
    }

    console.log('Test users created or updated');
}

async function clearDatabase() {
    await prisma.chapterProgress.deleteMany({
        where: {
            chapterKey: 'prologue'
        }
    });

    await prisma.user.deleteMany({});
    console.log('Database cleared');
}

if (process.argv.includes('--clear')) {
    clearDatabase()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
} else {
    main()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
