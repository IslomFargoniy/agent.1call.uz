import React from 'react';

export function AmoCrmIcon({ className = "h-6 w-6" }: { className?: string }) {
    return (
        <svg viewBox="0 0 36 36" fill="currentColor" className={`flex-shrink-0 ${className}`}>
            <circle cx="18" cy="18" r="18" fill="#167FFB" />
            <path d="M11 18c0-3.866 3.134-7 7-7s7 3.134 7 7-3.134 7-7 7-7-3.134-7-7zm7-3.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" fill="#FFFFFF" />
        </svg>
    );
}

export function MoySkladIcon({ className = "h-6 w-6" }: { className?: string }) {
    return (
        <svg viewBox="0 0 36 36" fill="currentColor" className={`flex-shrink-0 ${className}`}>
            <rect width="36" height="36" rx="8" fill="#F46738" />
            <path d="M10 12h5l3 6 3-6h5v12h-4v-7l-3 6h-2l-3-6v7h-4V12z" fill="#FFFFFF" />
        </svg>
    );
}

export function ClickIcon({ className = "h-6 w-6" }: { className?: string }) {
    return (
        <div className={`aspect-square rounded-lg bg-[#00A5FF] flex items-center justify-center p-1 text-white font-black text-xs shadow-xs flex-shrink-0 ${className}`}>
            C
        </div>
    );
}

export function PaymeIcon({ className = "h-6 w-6" }: { className?: string }) {
    return (
        <div className={`aspect-square rounded-lg bg-[#00CCCC] flex items-center justify-center p-1 text-white font-black text-xs shadow-xs flex-shrink-0 ${className}`}>
            P
        </div>
    );
}

export function LemonSqueezyIcon({ className = "h-6 w-6" }: { className?: string }) {
    return (
        <div className={`aspect-square rounded-lg bg-[#FFC233] flex items-center justify-center p-1 text-slate-900 font-black text-xs shadow-xs flex-shrink-0 ${className}`}>
            🍋
        </div>
    );
}

export function AmoCrmLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2.5 font-bold tracking-tight text-[#167FFB] ${className}`}>
            <AmoCrmIcon className="h-full aspect-square" />
            <span className="text-lg font-black text-slate-900 dark:text-white leading-none">amo<span className="text-[#167FFB]">CRM</span></span>
        </div>
    );
}

export function MoySkladLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2.5 font-bold text-[#F46738] ${className}`}>
            <MoySkladIcon className="h-full aspect-square" />
            <span className="text-lg font-black text-slate-900 dark:text-white leading-none">Мой<span className="text-[#F46738]">Склад</span></span>
        </div>
    );
}

export function ClickLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            <ClickIcon className="h-full" />
            <span className="text-base font-extrabold tracking-tight text-[#00A5FF] leading-none">CLICK</span>
        </div>
    );
}

export function PaymeLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            <PaymeIcon className="h-full" />
            <span className="text-base font-extrabold tracking-tight text-[#00CCCC] leading-none">payme</span>
        </div>
    );
}

export function LemonSqueezyLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            <LemonSqueezyIcon className="h-full" />
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">Lemon <span className="text-[#E0A800]">Squeezy</span></span>
        </div>
    );
}

export function UzcardLogo({ className = "h-6" }: { className?: string }) {
    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#102a5c] text-white font-bold text-xs ${className}`}>
            <span className="w-2 h-2 rounded-full bg-[#35b8e0] flex-shrink-0"></span>
            <span>UZCARD</span>
        </div>
    );
}

export function HumoLogo({ className = "h-6" }: { className?: string }) {
    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#f57c00] text-white font-bold text-xs ${className}`}>
            <span className="w-2 h-2 rounded-full bg-white flex-shrink-0"></span>
            <span>HUMO</span>
        </div>
    );
}

export function PaymentMethodLogo({ code, className = "h-6" }: { code: string; className?: string }) {
    switch (code) {
        case 'click':
            return <ClickLogo className={className} />;
        case 'payme':
            return <PaymeLogo className={className} />;
        case 'lemonsqueezy':
            return <LemonSqueezyLogo className={className} />;
        case 'card_transfer':
            return (
                <div className={`flex items-center gap-1.5 ${className}`}>
                    <UzcardLogo />
                    <HumoLogo />
                </div>
            );
        default:
            return (
                <div className={`font-semibold text-xs uppercase px-2 py-1 bg-secondary rounded ${className}`}>
                    {code}
                </div>
            );
    }
}

export function GoogleGLogo({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
        </svg>
    );
}
