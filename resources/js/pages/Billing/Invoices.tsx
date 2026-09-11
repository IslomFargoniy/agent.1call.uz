import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Receipt,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowLeft,
    Upload,
    FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InvoiceItem {
    id: number;
    invoice_number: string;
    amount: number;
    amount_usd?: number;
    payment_method: string;
    status: string;
    receipt_image_path?: string;
    created_at: string;
    admin_notes?: string;
}

interface InvoicesProps {
    invoices: {
        data: InvoiceItem[];
        current_page: number;
        last_page: number;
    };
}

export default function InvoicesIndex({ invoices }: InvoicesProps) {
    const { t } = useTranslation();
    const [uploadingInvoice, setUploadingInvoice] = useState<InvoiceItem | null>(null);

    const { data, setData, post, processing, reset } = useForm({
        receipt_image: null as File | null,
    });

    const openUpload = (inv: InvoiceItem) => {
        setUploadingInvoice(inv);
        reset();
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadingInvoice || !data.receipt_image) return;

        post(`/billing/invoices/${uploadingInvoice.id}/upload-receipt`, {
            onSuccess: () => {
                setUploadingInvoice(null);
                reset();
            },
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <Head title={t("billing.invoicesTitle", "Hisob-fakturalar (Invoices)")} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("billing.invoicesTitle", "Hisob-fakturalar va Cheklar")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("billing.invoicesDesc", "Barcha shakllantirilgan invoyslar va to'lov holatlari tarixi")}
                    </p>
                </div>

                <Button asChild variant="outline" size="sm">
                    <Link href="/billing">
                        <ArrowLeft className="h-4 w-4 mr-1.5" /> {t("billing.backToTariffs", "Tariflarga qaytish")}
                    </Link>
                </Button>
            </div>

            {/* Invoices Table */}
            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-medium">
                        <tr>
                            <th className="py-3 px-4">{t("billing.invoiceNumber", "Invoys raqami")}</th>
                            <th className="py-3 px-4">{t("billing.amount", "Summa")}</th>
                            <th className="py-3 px-4">{t("billing.paymentMethod", "To'lov usuli")}</th>
                            <th className="py-3 px-4">{t("billing.status", "Holati")}</th>
                            <th className="py-3 px-4">{t("billing.date", "Sana")}</th>
                            <th className="py-3 px-4 text-right">{t("billing.receiptScreenshot", "Chek / Skrinshot")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {invoices.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                                    {t("billing.noInvoices", "Hozircha hech qanday invoys mavjud emas.")}
                                </td>
                            </tr>
                        ) : (
                            invoices.data.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="py-3.5 px-4 font-mono font-bold text-xs">
                                        {invoice.invoice_number}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span className="font-mono font-bold">
                                            {Number(invoice.amount).toLocaleString("uz-UZ")} UZS
                                        </span>
                                        {invoice.amount_usd && (
                                            <span className="text-xs text-muted-foreground block">
                                                (${invoice.amount_usd})
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs capitalize font-medium">
                                        {invoice.payment_method.replace("_", " ")}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        {invoice.status === "paid" && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                                                <CheckCircle2 className="h-3 w-3" /> {t("billing.paid", "To'langan")}
                                            </span>
                                        )}
                                        {invoice.status === "pending" && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                                                <Clock className="h-3 w-3" /> {t("billing.pending", "Kutilmoqda")}
                                            </span>
                                        )}
                                        {invoice.status === "rejected" && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold" title={invoice.admin_notes || ""}>
                                                <XCircle className="h-3 w-3" /> {t("billing.rejected", "Rad etilgan")}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                                        {new Date(invoice.created_at).toLocaleDateString("uz-UZ")}
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                        {invoice.payment_method === "card_transfer" && invoice.status === "pending" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs gap-1"
                                                onClick={() => openUpload(invoice)}
                                            >
                                                <Upload className="h-3.5 w-3.5" />
                                                {invoice.receipt_image_path ? t("billing.updateReceipt", "Chekni yangilash") : t("billing.uploadReceipt", "Chek yuklash")}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Receipt Upload Modal */}
            {uploadingInvoice && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleUploadSubmit} className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
                        <h3 className="text-lg font-bold">{t("billing.uploadReceiptModalTitle", "To'lov chekini yuklash")}</h3>
                        <p className="text-xs text-muted-foreground">
                            {t("billing.invoiceLabel", "Invoys")}: <b>{uploadingInvoice.invoice_number}</b> • {t("billing.amountLabel", "Summa")}: <b>{Number(uploadingInvoice.amount).toLocaleString("uz-UZ")} UZS</b>
                        </p>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold">{t("billing.receiptScreenshotLabel", "Chek skrinshoti (JPG, PNG yoki PDF):")}</label>
                            <Input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => setData("receipt_image", e.target.files?.[0] || null)}
                                required
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setUploadingInvoice(null)}>
                                {t("billing.cancel", "Bekor qilish")}
                            </Button>
                            <Button type="submit" className="flex-1" disabled={processing || !data.receipt_image}>
                                {processing ? t("billing.loading", "Yuklanmoqda...") : t("billing.submit", "Yuborish")}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
