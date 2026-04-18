#!/bin/sh

set -eu

echo "[bootstrap] Generating Prisma client..."
npx prisma generate

sync_mode="${PRISMA_DB_SYNC_MODE:-migrate}"

if [ "$sync_mode" = "push" ]; then
  echo "[bootstrap] Applying schema with prisma db push (dev-only mode)..."
  npx prisma db push --skip-generate
else
  echo "[bootstrap] Applying migrations with prisma migrate deploy..."
  npx prisma migrate deploy
fi

if [ "${PRISMA_SEED_ON_START:-true}" = "true" ]; then
  echo "[bootstrap] Seeding database..."
  npm run prisma:seed
fi

echo "[bootstrap] Starting backend..."
exec npm run dev
