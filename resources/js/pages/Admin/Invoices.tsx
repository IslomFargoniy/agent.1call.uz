import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Head, router } from "@inertiajs/react";
import {
    Receipt,
    CheckCircle2,
    Clock,
    XCircle,
    Check,
    X,
    Eye,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginationNav, PaginationLink } from "@/components/ui/pagination-nav";

interface InvoiceItem {
    id: number;
    tenant_id: number;
    tenant?: { id: number; name: string };
    invoice_number: string;
    amount: number;
    payment_method: string;
    status: string;
    receipt_image_path?: string;
    created_at: string;
    approved_at?: string;
    approver?: { id: number; name: string };
    admin_notes?: string;
}

interface InvoicesProps {
    invoices: {
        data: InvoiceItem[];
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
        per_page: number;
        links: PaginationLink[];
    };
}

export default function AdminInvoices({ invoices }: InvoicesProps) {
    const { t } = useTranslation();
    const [viewingReceipt, setViewingReceipt] = useState<InvoiceItem | null>(null);
    const [rejectingInvoice, setRejectingInvoice] = useState<InvoiceItem | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const handleApprove = (invoice: InvoiceItem) => {
        if (!confirm(t("admin.confirmApproveInvoice", "Rostdan ham bu invoysni tasdiqlamoqchimisiz? Tenant obunasi avtomatik faollashadi."))) {
            return;
        }

        router.post(`/admin/invoices/${invoice.id}/approve`, {}, {
            preserveScroll: true,
        });
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectingInvoice) return;

        router.post(`/admin/invoices/${rejectingInvoice.id}/reject`, {
            reason: rejectReason,
        }, {
            onSuccess: () => {
                setRejectingInvoice(null);
                setRejectReason("");
            },
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <Head title={t("admin.invoicesTitle", "Invoyslar va To'lov Cheklari")} />

            <div>
                <h2 className="text-2xl font-bold tracking-tight">{t("admin.invoicesTitle", "Invoyslar va To'lov Cheklari")}</h2>
                <p className="text-sm text-muted-foreground">
                    {t("admin.invoicesDesc", "Mijozlar tomonidan to'langan cheklarni tekshirish va obunalarni tasdiqlash")}
                </p>
            </div>

            {/* Invoices Table */}
            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                        <tr>
                            <th className="py-3 px-4 w-12 text-center">№</th>
                            <th className="py-3 px-4">{t("admin.invoiceNumber", "Invoys #")}</th>
                            <th className="py-3 px-4">{t("admin.company", "Kompaniya (Tenant)")}</th>
                            <th className="py-3 px-4">{t("billing.amount", "Summa")}</th>
                            <th className="py-3 px-4">{t("billing.paymentMethod", "To'lov usuli")}</th>
                            <th className="py-3 px-4">{t("billing.status", "Holati")}</th>
                            <th className="py-3 px-4">{t("admin.receiptScreenshot", "Chek / Skrinshot")}</th>
                            <th className="py-3 px-4 text-right">{t("devices.actions", "Amallar")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {invoices.data.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-8 text-center text-muted-foreground text-sm">
                                    {t("billing.noInvoices", "Hozircha hech qanday invoys mavjud emas.")}
                                </td>
                            </tr>
                        ) : (
                            invoices.data.map((inv, idx) => {
                                const rowNum = ((invoices.current_page - 1) * (invoices.per_page || 10)) + idx + 1;
                                return (
                                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground">
                                            {rowNum}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-bold text-xs">
                                            {inv.invoice_number}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold">{inv.tenant?.name || `Tenant #${inv.tenant_id}`}</div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                {new Date(inv.created_at).toLocaleDateString("uz-UZ")}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-bold">
                                            {Number(inv.amount).toLocaleString("uz-UZ")} UZS
                                        </td>
                                        <td className="py-3.5 px-4 text-xs capitalize">
                                            {inv.payment_method.replace('_', ' ')}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {inv.status === 'paid' && (
                                                <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                                                    <CheckCircle2 className="h-3 w-3" /> {t("billing.paid", "To'langan")}
                                                </span>
                                            )}
                                            {inv.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                                                    <Clock className="h-3 w-3" /> {t("billing.pending", "Kutilmoqda")}
                                                </span>
                                            )}
                                            {inv.status === 'rejected' && (
                                                <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold" title={inv.admin_notes || ""}>
                                                    <XCircle className="h-3 w-3" /> {t("billing.rejected", "Rad etilgan")}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {inv.receipt_image_path ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        className="group relative h-11 w-11 rounded-lg border border-border overflow-hidden bg-muted/40 shrink-0 hover:ring-2 hover:ring-primary transition-all cursor-pointer shadow-xs"
                                                        onClick={() => setViewingReceipt(inv)}
                                                        title="Chekni kattalashtirib ko'rish"
                                                    >
                                                        <img
                                                            src={`/admin/invoices/${inv.id}/receipt`}
                                                            alt="Chek"
                                                            className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                                                        />
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                                            <Eye className="h-4 w-4" />
                                                        </div>
                                                    </button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 text-[11px] gap-1"
                                                        onClick={() => setViewingReceipt(inv)}
                                                    >
                                                        <Eye className="h-3 w-3" /> {t("admin.view", "Ko'rish")}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">{t("admin.notUploaded", "Yuklanmagan")}</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {inv.status === 'pending' && (
                                                <div className="flex justify-end gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                                        onClick={() => handleApprove(inv)}
                                                    >
                                                        <Check className="h-3.5 w-3.5" /> {t("admin.approve", "Tasdiqlash")}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                                                        onClick={() => setRejectingInvoice(inv)}
                                                    >
                                                        <X className="h-3.5 w-3.5" /> {t("admin.reject", "Rad etish")}
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <PaginationNav
                    links={invoices.links}
                    current_page={invoices.current_page}
                    last_page={invoices.last_page}
                    from={invoices.from}
                    to={invoices.to}
                    total={invoices.total}
                    per_page={invoices.per_page}
                />
            </div>

            {/* View Receipt Image Modal */}
            {viewingReceipt && (
                <div
                    className="fixed inset-0 bg-background/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
                    onClick={() => setViewingReceipt(null)}
                >
                    <div
                        className="bg-card border border-border rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-primary" />
                                <div>
                                    <h3 className="text-base font-bold text-foreground">
                                        To'lov cheki #{viewingReceipt.invoice_number}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Kompaniya: <b>{viewingReceipt.tenant?.name}</b> • Summa: <b className="font-mono text-foreground">{Number(viewingReceipt.amount).toLocaleString("uz-UZ")} UZS</b>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <a
                                    href={`/admin/invoices/${viewingReceipt.id}/receipt`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center h-8 px-2.5 rounded-lg text-xs font-medium border border-border hover:bg-muted gap-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" /> Yangi oynada
                                </a>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setViewingReceipt(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto rounded-xl bg-muted/20 border border-border p-2 flex items-center justify-center min-h-[320px]">
                            <img
                                src={`/admin/invoices/${viewingReceipt.id}/receipt`}
                                alt="To'lov cheki"
                                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-sm"
                            />
                        </div>

                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                            <span>Sana: {new Date(viewingReceipt.created_at).toLocaleString("uz-UZ")}</span>
                            <Button variant="outline" size="sm" onClick={() => setViewingReceipt(null)}>
                                {t("devices.closeBtn", "Yopish")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectingInvoice && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
                    onClick={() => setRejectingInvoice(null)}
                >
                    <form
                        onSubmit={handleRejectSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
                    >
                        <h3 className="text-lg font-bold">{t("admin.rejectReasonTitle", "Invoysni rad etish sababi")}</h3>
                        <p className="text-xs text-muted-foreground">Invoys: <b>{rejectingInvoice.invoice_number}</b></p>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">{t("admin.reasonLabel", "Sabab:")}</label>
                            <textarea
                                className="w-full h-24 rounded-md border border-input bg-transparent p-3 text-xs focus:ring-1 focus:ring-primary"
                                placeholder={t("admin.rejectReasonPlaceholder", "To'lov summasi kam yoki chek soxta...")}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setRejectingInvoice(null)}>
                                {t("admin.cancel", "Bekor qilish")}
                            </Button>
                            <Button type="submit" variant="destructive" className="flex-1">
                                {t("admin.reject", "Rad etish")}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
