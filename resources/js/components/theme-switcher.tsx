import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';

export function ThemeSwitcher() {
    const { appearance, updateAppearance } = useAppearance();
    const { t } = useTranslation();

    const Icon = appearance === 'dark' ? Moon : appearance === 'system' ? Monitor : Sun;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    title={t('appearance.title', 'Mavzu / Ko\'rinish')}
                >
                    <Icon className="h-4 w-4 shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
                <DropdownMenuItem onClick={() => updateAppearance('light')} className="cursor-pointer gap-2">
                    <Sun className="h-4 w-4 text-gray-500" />
                    <span>{t('appearance.light', 'Yorug\'')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateAppearance('dark')} className="cursor-pointer gap-2">
                    <Moon className="h-4 w-4 text-gray-400" />
                    <span>{t('appearance.dark', 'Qorong\'u')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateAppearance('system')} className="cursor-pointer gap-2">
                    <Monitor className="h-4 w-4 text-gray-500" />
                    <span>{t('appearance.system', 'Tizim')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default ThemeSwitcher;
