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
    links?: PaginationLink[];
    current_page?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    per_page?: number | string;
    onPerPageChange?: (perPage: string) => void;
    className?: string;
}

export function PaginationNav({
    links,
    current_page,
    last_page,
    from,
    to,
    total,
    per_page,
    onPerPageChange,
    className = "",
}: PaginationProps) {
    const { t } = useTranslation();

    // If total is 0 or undefined without links, return null
    if (total === 0 || (!links && total === undefined)) {
        return null;
    }

    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const currentPerPage = per_page !== undefined
        ? String(per_page)
        : (urlParams?.get("per_page") || "10");

    const handlePerPageChange = (val: string) => {
        if (onPerPageChange) {
            onPerPageChange(val);
            return;
        }

        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("per_page", val);
            url.searchParams.set("page", "1"); // Reset to first page
            router.get(url.pathname + url.search, {}, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const hasMultiplePages = Boolean(links && links.length > 3);

    return (
        <div className={`p-3.5 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground ${className}`}>
            <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
                <div>
                    {total !== undefined && from !== undefined && to !== undefined && from !== null && to !== null ? (
                        <span>
                            {t("common.paginationRange", "Jami {{total}} tadan {{from}} - {{to}} ko'rsatilmoqda", {
                                total,
                                from,
                                to,
                            })}
                        </span>
                    ) : total !== undefined ? (
                        <span>Jami: <strong className="text-foreground">{total}</strong> ta</span>
                    ) : current_page && last_page ? (
                        <span>
                            {t("calls.pageOf", "Sahifa {{current}} / {{last}}", {
                                current: current_page,
                                last: last_page,
                            })}
                        </span>
                    ) : null}
                </div>

                {/* Per Page Selector Buttons [10, 30, 50, All] */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground/80">{t("common.perPage", "Qatorlar")}:</span>
                    <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-muted/40 shadow-2xs">
                        {(["10", "30", "50", "all"] as const).map((opt) => {
                            const isSelected =
                                currentPerPage.toLowerCase() === opt ||
                                (opt === "all" && (currentPerPage.toLowerCase() === "all" || Number(currentPerPage) >= 5000));

                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handlePerPageChange(opt)}
                                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                                        isSelected
                                            ? "bg-background text-foreground shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {opt === "all" ? "All" : opt}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Pagination Links */}
            {hasMultiplePages && (
                <div className="flex flex-wrap items-center gap-1">
                    {links!.map((link, idx) => {
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
                                className="h-7 min-w-[28px] px-2 text-xs font-medium"
                                disabled={!link.url}
                                onClick={() => {
                                    if (link.url) {
                                        router.get(link.url, {}, { preserveState: true, preserveScroll: true });
                                    }
                                }}
                            >
                                <span dangerouslySetInnerHTML={{ __html: cleanLabel }} />
                            </Button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default PaginationNav;
