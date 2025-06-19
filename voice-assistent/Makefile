### Serve frontend and start backend
up-frontend:
	@echo "\n\033[01;33m Serve frontend... \033[0m"
	@cd apps/frontend && npm run start

up-backend:
	@echo "\n\033[01;33m Generate Prisma Client... \033[0m"
	@cd apps/backend && npx prisma generate
	@echo "\n\033[01;33m Start Backend... \033[0m"
	@cd apps/backend && npm run start


# Makefile для управления seed-скриптами Prisma

# Путь к ts-node
TS_NODE=npx ts-node

# Путь к seed-файлу относительно backend
SEED_SCRIPT=prisma/seed.ts

# Команда для запуска seed (создание/обновление пользователей)
seed:
	@echo "\n\033[01;32m Seeding database... \033[0m"
	@cd apps/backend && $(TS_NODE) $(SEED_SCRIPT)

# Команда для очистки базы данных (удаление пользователей и прогресса)
clear-db:
	@echo "\n\033[01;31m Clearing database... \033[0m"
	@cd apps/backend && $(TS_NODE) $(SEED_SCRIPT) --clear
