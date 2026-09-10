#!/usr/bin/env bash
set -e

echo "🚀 [agent.1call.uz] Boshlanmoqda: Yangi versiyani deploy qilish..."

# Loyiha katalogiga o'tish
PROJECT_DIR="/var/www/agent_1call__usr/data/www/agent.1call.uz"
cd "$PROJECT_DIR"

# 1. Git orqali eng so'nggi kodni tortib olish
echo "📥 Git-dan yangi o'zgarishlar tortib olinmoqda..."
git pull origin main

# 2. PHP bog'liqliklarini o'rnatish
echo "📦 Composer paketlari o'rnatilmoqda..."
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# 3. Baza migratsiyalarini ishga tushirish
echo "🗄️ Baza migratsiyalari tekshirilmoqda..."
php artisan migrate --force

# 4. Keshlar va optimallash
echo "⚡ Laravel keshlarini yangilash..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 5. Frontend assetlarini qurish
if [ -f "package.json" ]; then
    echo "🎨 Frontend assetlari qurilmoqda..."
    npm ci --prefer-offline || npm install
    npm run build
fi

# 6. Supervisor xizmatlarini qayta yuklash (agar sozlangan bo'lsa)
if command -v supervisorctl >/dev/null 2>&1; then
    echo "🔄 Supervisor xizmatlari qayta yuklanmoqda..."
    sudo supervisorctl reread 2>/dev/null || true
    sudo supervisorctl update 2>/dev/null || true
    sudo supervisorctl restart agent-1call-worker:* 2>/dev/null || true
    sudo supervisorctl restart agent-1call-reverb:* 2>/dev/null || true
fi

# 7. Huquqlarni to'g'rilash
echo "🔒 Papka huquqlari sozlanmoqda..."
chmod -R 775 storage bootstrap/cache || true
chown -R agent_1call__usr:agent_1call__usr storage bootstrap/cache || true

echo "✅ [agent.1call.uz] Deploy muvaffaqiyatli yakunlandi!"
