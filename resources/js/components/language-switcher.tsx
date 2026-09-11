import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
    { code: 'uz', displayCode: 'UZ', label: "O'zbekcha", flag: '🇺🇿' },
    { code: 'ru', displayCode: 'RU', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', displayCode: 'EN', label: 'English', flag: '🇬🇧' },
] as const;

interface LanguageSwitcherProps {
    className?: string;
    variant?: 'ghost' | 'outline';
}

export function LanguageSwitcher({ className, variant = 'ghost' }: LanguageSwitcherProps) {
    const { i18n } = useTranslation();

    const langCode = (i18n.language?.split('-')[0] || 'uz') as 'uz' | 'ru' | 'en';
    const currentLang =
        languages.find((l) => l.code === langCode) ?? languages[0];

    const handleLanguageChange = (code: string) => {
        i18n.changeLanguage(code);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size="sm"
                    className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-foreground shadow-2xs hover:bg-accent hover:text-accent-foreground ${className || ''}`}
                    title={currentLang.label}
                >
                    <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-xs font-semibold">
                        {currentLang.flag} {currentLang.displayCode}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px] z-50">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`cursor-pointer gap-2 ${
                            langCode === lang.code
                                ? 'bg-accent font-medium'
                                : ''
                        }`}
                    >
                        <span className="text-base leading-none">
                            {lang.flag}
                        </span>
                        <span>{lang.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default LanguageSwitcher;
