import '@/i18n';
import { createInertiaApp, router } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { getUserTimezone } from '@/lib/datetime';

// Synchronize browser detected timezone with Laravel backend via cookie & Inertia header
const userTimezone = getUserTimezone();
try {
    document.cookie = `app_timezone=${encodeURIComponent(userTimezone)}; path=/; max-age=31536000; SameSite=Lax`;
} catch {
    // Ignore in non-browser environments
}

router.on('before', (event) => {
    if (event?.detail?.visit?.headers) {
        event.detail.visit.headers['X-Timezone'] = userTimezone;
    }
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
