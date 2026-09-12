import React from "react";
import { useTranslation } from "react-i18next";
import { Link, usePage } from "@inertiajs/react";
import { Home, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
    const { t } = useTranslation();
    const { url } = usePage();

    const isHomeActive = url === "/dashboard" || url === "/";
    const isCallsActive = url.startsWith("/calls");
    const isProfileActive = url.startsWith("/settings");

    const navItems = [
        {
            name: t("nav.home", "Asosiy"),
            href: "/dashboard",
            icon: Home,
            isActive: isHomeActive,
        },
        {
            name: t("nav.calls", "Qo'ng'iroqlar"),
            href: "/calls",
            icon: Phone,
            isActive: isCallsActive,
        },
        {
            name: t("nav.profile", "Profil"),
            href: "/settings/profile",
            icon: User,
            isActive: isProfileActive,
        },
    ];

    return (
        <nav
            aria-label="Mobile Bottom Navigation"
            className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/80 dark:bg-[#121214]/85 backdrop-blur-2xl border-t border-black/[0.08] dark:border-white/[0.12] shadow-[0_-1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_-1px_3px_rgba(0,0,0,0.3)] pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 transition-all duration-200"
        >
            <div className="grid grid-cols-3 items-center h-[49px] max-w-md mx-auto px-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            className={cn(
                                "flex flex-col items-center justify-center h-full text-center select-none active:scale-90 transition-all duration-150 ease-out group focus-visible:outline-none",
                                item.isActive
                                    ? "text-[#007AFF] dark:text-[#0A84FF]"
                                    : "text-[#8E8E93] dark:text-[#98989D] hover:text-foreground"
                            )}
                        >
                            <div className="relative flex items-center justify-center h-6 w-6">
                                <Icon
                                    className={cn(
                                        "h-[22px] w-[22px] transition-all duration-200",
                                        item.isActive
                                            ? "stroke-[2.2px] fill-[#007AFF]/15 dark:fill-[#0A84FF]/25 text-[#007AFF] dark:text-[#0A84FF]"
                                            : "stroke-[1.75px] fill-transparent"
                                    )}
                                />
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] tracking-tight leading-none mt-1 transition-colors duration-200",
                                    item.isActive
                                        ? "font-semibold text-[#007AFF] dark:text-[#0A84FF]"
                                        : "font-normal text-[#8E8E93] dark:text-[#98989D]"
                                )}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
