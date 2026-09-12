import React from "react";
import { router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationProps {
    links: PaginationLink[];
    current_page?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    className?: string;
}

export function PaginationNav({
    links,
    current_page,
    last_page,
    from,
    to,
    total,
    className = "",
}: PaginationProps) {
    const { t } = useTranslation();

    if (!links || links.length <= 1) {
        return null;
    }

    return (
        <div className={`p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground ${className}`}>
            <div>
                {total !== undefined && from !== undefined && to !== undefined && from !== null && to !== null ? (
                    <span>
                        {t("common.paginationRange", "Jami {{total}} tadan {{from}} - {{to}} ko'rsatilmoqda", {
                            total,
                            from,
                            to,
                        })}
                    </span>
                ) : current_page && last_page ? (
                    <span>
                        {t("calls.pageOf", "Sahifa {{current}} / {{last}}", {
                            current: current_page,
                            last: last_page,
                        })}
                    </span>
                ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-1">
                {links.map((link, idx) => {
                    const cleanLabel = link.label
                        .replace("&laquo; Previous", "«")
                        .replace("Next &raquo;", "»")
                        .replace("&laquo;", "«")
                        .replace("&raquo;", "»");

                    return (
                        <Button
                            key={idx}
                            variant={link.active ? "default" : "outline"}
                            size="sm"
                            className="h-8 min-w-[32px] px-2.5 text-xs font-medium"
                            disabled={!link.url}
                            onClick={() => {
                                if (link.url) {
                                    router.get(link.url);
                                }
                            }}
                        >
                            <span dangerouslySetInnerHTML={{ __html: cleanLabel }} />
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

export default PaginationNav;
