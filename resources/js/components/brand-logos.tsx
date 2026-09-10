import React from 'react';

/**
 * Official amoCRM Circle Icon (dialogue/contact emblem)
 */
export function AmoCrmIcon({ className = "h-6 w-6" }: { className?: string }) {
    return (
        <svg viewBox="0 0 36 36" fill="none" className={`flex-shrink-0 ${className}`}>
            <circle cx="18" cy="18" r="18" fill="#167FFB" />
            <path d="M11 18c0-3.866 3.134-7 7-7s7 3.134 7 7-3.134 7-7 7-7-3.134-7-7zm7-3.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" fill="#FFFFFF" />
        </svg>
    );
}

/**
 * Official amoCRM Brand Logo
 */
export function AmoCrmLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className={`inline-flex items-center gap-2.5 font-bold tracking-tight text-[#167FFB] ${className}`}>
            <AmoCrmIcon className="h-full aspect-square flex-shrink-0" />
            <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                amo<span className="text-[#167FFB]">CRM</span>
            </span>
        </div>
    );
}

/**
 * Official MoySklad Dual-Color Ribbon Icon (from moysklad.ru)
 */
export function MoySkladIcon({ className = "h-6 w-6" }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 120" fill="none" className={`flex-shrink-0 ${className}`}>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M17.433 104.544c14.99 0 26.329-19.522 36.496-40.835 4.886-10.335 9.447-21.164 14.011-30.342C72.948 23.191 78.088 16 84.371 16c5.334 0 10.35 4.306 15.337 11.05C110.057 41.047 119 64.755 119 80.308c0 13.028-6.706 24.236-20.449 24.236H17.433Z"
                fill="#64CDFF"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M53.927 63.707C43.626 42.941 38.965 27.706 29.849 27.706c-5.654 0-12.03 5.938-17.804 15.668C5.863 53.694 1 68.263 1 83.934c0 12.375 6.053 20.607 16.431 20.607 14.996 0 26.334-19.522 36.496-40.835"
                fill="#2855AF"
            />
        </svg>
    );
}

/**
 * Official MoySklad Horizontal Logo (from moysklad.ru)
 */
export function MoySkladLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <MoySkladIcon className="h-full aspect-square flex-shrink-0" />
            <span className="text-lg font-bold tracking-tight text-[#2855AF] dark:text-[#64CDFF] leading-none">
                Мой<span className="font-extrabold text-slate-900 dark:text-white">Склад</span>
            </span>
        </div>
    );
}

/**
 * Official Click.uz Oval Emblem (from click.uz)
 */
export function ClickIcon({ className = "h-6 w-6" }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 40" fill="none" className={`flex-shrink-0 ${className}`}>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M39.3739 20.1572C39.3739 27.7941 27.2594 40.0006 19.6797 40.0006C12.1 40.0006 -0.0146637 27.7941 -0.0146637 20.1572C-0.0146637 12.5203 12.1 0.313477 19.6797 0.313477C27.2594 0.313477 39.3739 12.5203 39.3739 20.1572ZM27.5573 20.1572C27.5573 23.212 22.7113 28.0945 19.6797 28.0945C16.6477 28.0945 11.8019 23.212 11.8019 20.1572C11.8019 17.1025 16.6479 12.2197 19.6797 12.2197C22.7113 12.2197 27.5573 17.1025 27.5573 20.1572Z"
                fill="#0065FF"
            />
        </svg>
    );
}

/**
 * Official Click.uz Vector Logo (from click.uz)
 */
export function ClickLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}>
            <svg viewBox="0 0 157 40" fill="none" className="h-full w-auto aspect-[157/40] block">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M39.3739 20.1572C39.3739 27.7941 27.2594 40.0006 19.6797 40.0006C12.1 40.0006 -0.0146637 27.7941 -0.0146637 20.1572C-0.0146637 12.5203 12.1 0.313477 19.6797 0.313477C27.2594 0.313477 39.3739 12.5203 39.3739 20.1572ZM27.5573 20.1572C27.5573 23.212 22.7113 28.0945 19.6797 28.0945C16.6477 28.0945 11.8019 23.212 11.8019 20.1572C11.8019 17.1025 16.6479 12.2197 19.6797 12.2197C22.7113 12.2197 27.5573 17.1025 27.5573 20.1572Z"
                    fill="#0065FF"
                />
                <path
                    className="text-slate-900 dark:text-white"
                    fill="currentColor"
                    d="M60.8212 39.9981C68.1709 39.9981 72.7769 35.3571 74.1744 29.2556H66.1004C65.1172 31.3415 63.5644 32.906 60.8212 32.906C57.5088 32.906 55.0764 30.5073 55.0764 26.3874C55.0764 22.2678 57.5088 19.8687 60.8212 19.8687C63.5644 19.8687 65.1172 21.4332 66.1004 23.5194H74.1744C72.7769 17.4179 68.1709 12.7766 60.8212 12.7766C52.9541 12.7766 47.2093 18.826 47.2093 26.3874C47.2093 33.9491 52.9541 39.9981 60.8212 39.9981ZM76.9305 39.4246H84.7459V0.313209H76.9305V39.4246ZM93.2986 9.80409C96.0417 9.80409 98.2155 7.61389 98.2155 4.90212C98.2155 2.19056 96.0417 0.000366211 93.2986 0.000366211C90.6592 0.000366211 88.4334 2.19056 88.4334 4.90212C88.4334 7.61389 90.6592 9.80409 93.2986 9.80409ZM89.4169 39.4246H97.2323V13.3504H89.4169V39.4246ZM113.963 39.9981C121.312 39.9981 125.918 35.3571 127.316 29.2556H119.242C118.258 31.3415 116.706 32.906 113.963 32.906C110.65 32.906 108.218 30.5073 108.218 26.3874C108.218 22.2678 110.65 19.8687 113.963 19.8687C116.706 19.8687 118.258 21.4332 119.242 23.5194H127.316C125.918 17.4179 121.312 12.7766 113.963 12.7766C106.096 12.7766 100.351 18.826 100.351 26.3874C100.351 33.9491 106.096 39.9981 113.963 39.9981ZM147.514 39.4246H156.985L145.185 25.136L154.708 13.3504H145.443L137.887 22.6849V0.313209H130.072V39.4246H137.887V27.7954L147.514 39.4246Z"
                />
            </svg>
        </div>
    );
}

/**
 * Official Payme.uz Cyan Card Logo (from cdn.payme.uz)
 */
export function PaymeLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}>
            <svg viewBox="0 0 58 20" fill="none" className="h-full w-auto aspect-[58/20] block">
                <path
                    d="M3.71606 0.0010583H51.5962C52.1477 0.0010583 52.6347 0.229062 52.9105 0.669159L57.7641 8.57076C58.137 9.19007 58.0726 9.93878 57.5368 10.5581L50.7036 18.4597C50.3305 18.8828 49.8435 19.1437 49.2909 19.1437H1.55448C0.597303 19.1437 -0.101038 18.3939 0.012006 17.4491L1.81544 1.69464C1.92954 0.733847 2.75677 0 3.715 0L3.71606 0.0010583Z"
                    fill="#25E8FF"
                />
                <path
                    d="M32.7359 13.5417L33.4881 7.53621C33.9952 7.19155 34.5668 6.91264 35.058 6.91264C35.6951 6.91264 36.0058 7.38882 35.9086 8.20856L35.2546 13.5417H37.5599L38.2793 7.71649L38.2953 7.55212C38.8023 7.20747 39.3908 6.91264 39.8809 6.91264C40.518 6.91264 40.8287 7.38882 40.7314 8.20856L40.0775 13.5417H42.3828L43.1022 7.71649C43.2988 6.09184 42.464 5.10773 40.9775 5.10773C39.9475 5.10773 38.852 5.69842 38.1166 6.24031C37.806 5.51813 37.1194 5.10773 36.1548 5.10773C35.1902 5.10773 34.2583 5.58388 33.5229 6.07594L33.6212 5.33784H31.4639L30.4339 13.5428H32.7392L32.7359 13.5417ZM46.3668 8.68471C46.596 7.60195 47.38 6.96143 48.3446 6.96143C49.3092 6.96143 49.832 7.50333 49.832 8.37293C49.832 8.47155 49.832 8.58609 49.8162 8.68471H46.3668ZM43.9475 9.78442C43.9147 11.8354 45.4023 13.7389 48.4427 13.7389C49.5215 13.7389 50.4375 13.5258 51.2541 13.0168L51.4179 11.0803C50.748 11.4907 49.7339 11.7696 48.8516 11.7696C47.6905 11.7696 46.6447 11.2606 46.3509 10.0792H52.0074C52.0886 9.86609 52.1543 9.35706 52.1543 8.865C52.1543 6.69951 50.9603 5.12364 48.5084 5.12364C46.0562 5.12364 43.9801 6.58391 43.9475 9.78336V9.78442ZM15.8817 11.1461C15.8817 10.2595 16.9118 9.93184 17.9736 9.93184H19.0523L18.8885 11.2606C18.431 11.6212 17.6133 11.9987 16.9266 11.9987C16.3054 11.9987 15.8807 11.654 15.8807 11.145L15.8817 11.1461ZM13.5765 11.3274C13.5596 12.6562 14.6393 13.74 16.2895 13.74C17.4506 13.74 18.3 13.2479 18.7903 12.706L18.692 13.5428H20.9148L21.4547 9.09618C21.7168 6.89781 20.9973 5.10879 18.1849 5.10879C17.0407 5.10879 15.6514 5.37178 14.8992 5.86385L14.6699 7.70164C15.2753 7.3729 16.4522 6.9731 17.5309 6.9731C18.822 6.9731 19.2805 7.62 19.2308 8.30931H17.8574C15.8627 8.30931 13.5902 9.08026 13.5744 11.3285L13.5765 11.3274ZM7.1847 11.5406L7.69181 7.5044C8.18203 7.11097 8.73774 6.94658 9.22796 6.9625C10.2084 6.97841 10.7482 7.76635 10.7482 8.99755C10.7482 10.5893 9.91466 11.951 8.50849 11.951C8.06686 11.951 7.56081 11.8036 7.1847 11.5406ZM4.32373 16.2501H6.61208L6.98819 13.1493C7.34739 13.4282 8.01827 13.74 8.86769 13.74C11.5163 13.74 13.1348 11.3932 13.1348 8.83425C13.1348 6.65178 12.1048 5.12575 10.1756 5.12575C9.25966 5.12575 8.42608 5.42057 7.78902 5.94655L7.87036 5.33997H5.6475L4.32373 16.2523V16.2501ZM28.3874 5.33784L25.9026 11.0156L24.6114 5.33784H22.0612L24.3336 13.5587L23.01 16.2501H25.5274L30.8733 5.33784H28.3885H28.3874Z"
                    fill="#000000"
                />
            </svg>
        </div>
    );
}

/**
 * Official Lemon Squeezy Logo (from lemonsqueezy.com)
 */
export function LemonSqueezyLogo({ className = "h-7" }: { className?: string }) {
    return (
        <div className={`inline-flex items-center gap-2.5 ${className}`}>
            <svg viewBox="0 0 24 28" fill="none" className="h-full aspect-square flex-shrink-0">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.92833 17.1851L14.4396 20.6578C15.3706 21.0885 16.0278 21.8111 16.3826 22.6401C17.2803 24.7394 16.0535 26.8864 14.1276 27.6586C12.2014 28.4304 10.1486 27.9337 9.2152 25.7506L5.94628 18.0861C5.69297 17.492 6.32931 16.9082 6.92833 17.1851"
                    fill="#FFC233"
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7.37955 14.9381L15.1332 12.0071C17.7101 11.033 20.525 12.8761 20.487 15.5541C20.4864 15.5891 20.4858 15.624 20.4849 15.6593C20.4292 18.2671 17.6926 20.0199 15.1723 19.0973L7.38689 16.2478C6.76584 16.0206 6.76126 15.1718 7.37955 14.9381"
                    fill="#FFC233"
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.94499 13.9224L14.5671 10.6837C17.0999 9.60736 17.7427 6.37695 15.759 4.51043C15.733 4.48585 15.707 4.46156 15.6807 4.43728C13.7358 2.63207 10.5208 3.26767 9.41358 5.64539L5.99323 12.9915C5.72033 13.5773 6.3371 14.1806 6.94499 13.9224"
                    fill="#FFC233"
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4.98349 12.6426L7.75465 5.04415C8.09822 4.102 8.03458 3.1412 7.67939 2.3122C6.77994 0.21378 4.34409 -0.463579 2.41853 0.309741C0.493284 1.08336 -0.594621 2.84029 0.340622 5.02253L3.63095 12.6787C3.8861 13.272 4.76261 13.2486 4.98349 12.6426"
                    fill="#FFC233"
                />
            </svg>
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                Lemon <span className="text-[#FFC233]">Squeezy</span>
            </span>
        </div>
    );
}

/**
 * Official UZCARD Logo (from uzcard.uz)
 */
export function UzcardLogo({ className = "h-6" }: { className?: string }) {
    return (
        <div className={`inline-flex items-center px-2.5 py-1 rounded-md bg-[#0f244a] text-white font-bold text-xs ${className}`}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5c00] mr-1.5 flex-shrink-0"></span>
            <span className="tracking-wider">UZCARD</span>
        </div>
    );
}

/**
 * Official HUMO Logo (from humocard.uz)
 */
export function HumoLogo({ className = "h-6" }: { className?: string }) {
    return (
        <div className={`inline-flex items-center px-2.5 py-1 rounded-md bg-[#f57c00] text-white font-bold text-xs ${className}`}>
            <span className="w-2.5 h-2.5 rounded-full bg-white mr-1.5 flex-shrink-0"></span>
            <span className="tracking-wider">HUMO</span>
        </div>
    );
}

/**
 * Unified Payment Method Logo Resolver
 */
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

/**
 * Official Google G Logo
 */
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
