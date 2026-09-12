import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    Receipt,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowLeft,
    Upload,
    FileText,
    Eye,
    X,
    ExternalLink,
    CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginationNav, PaginationLink } from "@/components/ui/pagination-nav";
import { formatDate } from "@/lib/datetime";

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
    tenant?: { id: number; name: string };
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

export default function InvoicesIndex({ invoices }: InvoicesProps) {
    const { t } = useTranslation();
    const { auth, superadmin } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.role === "superadmin";
    const isAllTenants = isSuperAdmin && !superadmin?.selected_tenant;
    const [uploadingInvoice, setUploadingInvoice] = useState<InvoiceItem | null>(null);
    const [viewingReceipt, setViewingReceipt] = useState<InvoiceItem | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, reset } = useForm<{
        receipt_image: File | null;
        invoice_id: number | null;
    }>({
        receipt_image: null,
        invoice_id: null,
    });

    const openUpload = (inv: InvoiceItem) => {
        setUploadingInvoice(inv);
        setData({
            receipt_image: null,
            invoice_id: inv.id,
        });
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const closeUpload = () => {
        setUploadingInvoice(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        reset();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setData("receipt_image", file);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const clearSelectedFile = () => {
        setData("receipt_image", null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadingInvoice || !data.receipt_image) return;

        post(`/billing/invoices/${uploadingInvoice.id}/upload-receipt`, {
            forceFormData: true,
            onSuccess: () => {
                closeUpload();
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
                            <th className="py-3 px-4 w-12 text-center">№</th>
                            <th className="py-3 px-4">{t("billing.invoiceNumber", "Invoys raqami")}</th>
                            {isAllTenants && <th className="py-3 px-4">{t("billing.company", "Kompaniya")}</th>}
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
                                <td colSpan={isAllTenants ? 8 : 7} className="py-8 text-center text-muted-foreground text-sm">
                                    {t("billing.noInvoices", "Hozircha hech qanday invoys mavjud emas.")}
                                </td>
                            </tr>
                        ) : (
                            invoices.data.map((invoice, idx) => {
                                const rowNum = ((invoices.current_page - 1) * (invoices.per_page || 10)) + idx + 1;
                                return (
                                    <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground">
                                            {rowNum}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-bold text-xs">
                                            {invoice.invoice_number}
                                        </td>
                                        {isAllTenants && (
                                            <td className="py-3.5 px-4 text-xs font-medium">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                    {invoice.tenant?.name || "-"}
                                                </span>
                                            </td>
                                        )}
                                        <td className="py-3.5 px-4">
                                            <span className="font-mono font-bold">
                                                {Number(invoice.amount).toLocaleString("uz-UZ")} UZS
                                            </span>
                                            {invoice.amount_usd && (
                                                <span className="text-xs text-muted-foreground block font-mono">
                                                    (${invoice.amount_usd})
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs capitalize font-medium">
                                            {invoice.payment_method.replace("_", " ")}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {invoice.status === "paid" && (
                                                <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> {t("billing.paid", "To'langan")}
                                                </span>
                                            )}
                                            {invoice.status === "pending" && (
                                                <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-semibold">
                                                    <Clock className="h-3.5 w-3.5" /> {t("billing.pending", "Kutilmoqda")}
                                                </span>
                                            )}
                                            {invoice.status === "rejected" && (
                                                <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 px-2.5 py-0.5 rounded-full font-semibold" title={invoice.admin_notes || ""}>
                                                    <XCircle className="h-3.5 w-3.5" /> {t("billing.rejected", "Rad etilgan")}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                                            {formatDate(invoice.created_at)}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {invoice.receipt_image_path ? (
                                                    <button
                                                        type="button"
                                                        className="group relative h-11 w-11 rounded-lg border border-border overflow-hidden bg-muted/40 shrink-0 hover:ring-2 hover:ring-primary transition-all cursor-pointer shadow-xs"
                                                        onClick={() => setViewingReceipt(invoice)}
                                                        title="Chekni kattalashtirib ko'rish"
                                                    >
                                                        <img
                                                            src={`/billing/invoices/${invoice.id}/receipt`}
                                                            alt="Chek"
                                                            className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                                                        />
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                                            <Eye className="h-4 w-4" />
                                                        </div>
                                                    </button>
                                                ) : null}

                                                {['click', 'payme'].includes(invoice.payment_method) && invoice.status === "pending" && (
                                                    <a
                                                        href={`/pay/${invoice.payment_method}/${invoice.id}`}
                                                        className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-8 px-3 text-xs gap-1.5"
                                                    >
                                                        <CreditCard className="h-3.5 w-3.5 text-primary" />
                                                        {t("billing.payNow", "To\x27lash")}
                                                    </a>
                                                )}

                                                {invoice.payment_method === "card_transfer" && invoice.status === "pending" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs gap-1.5"
                                                        onClick={() => openUpload(invoice)}
                                                    >
                                                        <Upload className="h-3.5 w-3.5" />
                                                        {invoice.receipt_image_path
                                                            ? t("billing.updateReceipt", "Chekni yangilash")
                                                            : t("billing.uploadReceipt", "Chek yuklash")}
                                                    </Button>
                                                )}
                                            </div>
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

            {/* Receipt Upload Modal with Large Image Preview */}
            {uploadingInvoice && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
                    onClick={closeUpload}
                >
                    <form
                        onSubmit={handleUploadSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
                    >
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    {t("billing.uploadReceiptModalTitle", "To'lov chekini yuklash")}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Invoys: <b className="text-foreground font-mono">{uploadingInvoice.invoice_number}</b> • Summa: <b className="text-foreground font-mono">{Number(uploadingInvoice.amount).toLocaleString("uz-UZ")} UZS</b>
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                                onClick={closeUpload}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {/* Large Image Preview or Upload Selector */}
                        {previewUrl ? (
                            <div className="space-y-3">
                                <div className="relative rounded-2xl border border-border/80 bg-muted/20 p-2 overflow-hidden flex items-center justify-center min-h-[220px] max-h-[360px]">
                                    <img
                                        src={previewUrl}
                                        alt="Tanlangan chek"
                                        className="max-h-[340px] max-w-full object-contain rounded-xl shadow-md"
                                    />
                                    <button
                                        type="button"
                                        className="absolute top-3 right-3 p-1.5 rounded-full bg-background/90 text-muted-foreground hover:text-destructive hover:bg-background transition-colors shadow-sm"
                                        onClick={clearSelectedFile}
                                        title="Boshqa rasm tanlash"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                                    <span className="truncate max-w-[280px] font-mono text-[11px]">
                                        {data.receipt_image?.name}
                                    </span>
                                    <button
                                        type="button"
                                        className="text-primary hover:underline font-semibold text-xs"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Boshqa fayl tanlash
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all rounded-2xl p-8 text-center cursor-pointer space-y-2.5"
                            >
                                <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-1">
                                    <Upload className="h-6 w-6" />
                                </div>
                                <div className="text-sm font-bold text-foreground">
                                    {t("billing.clickToSelectFile", "Chek rasmini yuklash uchun bosing")}
                                </div>
                                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                    To'lov amalga oshirilganini tasdiqlovchi kvitansiya yoki skrinshot (JPG, PNG, WEBP)
                                </p>
                                <div className="pt-2">
                                    <span className="inline-block px-3 py-1 rounded-full bg-secondary text-[11px] font-medium text-secondary-foreground">
                                        Fayl tanlash (maks. 10 MB)
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2.5 pt-2 border-t border-border">
                            <Button type="button" variant="outline" className="flex-1" onClick={closeUpload}>
                                {t("billing.cancel", "Bekor qilish")}
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={processing || !data.receipt_image}
                            >
                                {processing ? (
                                    t("billing.loading", "Yuklanmoqda...")
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-1.5" />
                                        {t("billing.submit", "Yuborish")}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lightbox Modal for Full-Size Receipt */}
            {viewingReceipt && (
                <div
                    className="fixed inset-0 bg-background/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
                    onClick={() => setViewingReceipt(null)}
                >
                    <div
                        className="bg-card border border-border rounded-2xl p-5 max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-primary" />
                                <div>
                                    <h3 className="text-base font-bold text-foreground">
                                        To'lov cheki #{viewingReceipt.invoice_number}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Summa: <span className="font-semibold text-foreground font-mono">{Number(viewingReceipt.amount).toLocaleString("uz-UZ")} UZS</span> • {formatDate(viewingReceipt.created_at)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <a
                                    href={`/billing/invoices/${viewingReceipt.id}/receipt`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center h-8 px-2.5 rounded-lg text-xs font-medium border border-border hover:bg-muted gap-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" /> Ochish
                                </a>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                                    onClick={() => setViewingReceipt(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto rounded-xl bg-muted/20 border border-border p-2 flex items-center justify-center min-h-[300px]">
                            <img
                                src={`/billing/invoices/${viewingReceipt.id}/receipt`}
                                alt={`Chek ${viewingReceipt.invoice_number}`}
                                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm"
                            />
                        </div>

                        <div className="flex justify-end pt-1">
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-xs font-medium"
                                onClick={() => setViewingReceipt(null)}
                            >
                                Yopish
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
