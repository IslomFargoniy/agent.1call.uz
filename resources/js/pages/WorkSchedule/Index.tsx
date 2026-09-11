import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Head, useForm } from "@inertiajs/react";
import {
    Clock,
    Shield,
    Plus,
    Trash2,
    Send,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WorkScheduleProps {
    workSchedule?: {
        enabled?: boolean;
        start_time?: string;
        end_time?: string;
        days?: number[];
    };
    privacyBlacklist?: string[];
    telegramChatId?: string;
}

export default function WorkScheduleSettings({ workSchedule, privacyBlacklist, telegramChatId }: WorkScheduleProps) {
    const { t } = useTranslation();
    const [blacklist, setBlacklist] = useState<string[]>(privacyBlacklist || []);
    const [newPhone, setNewPhone] = useState("");

    const { data, setData, put, processing } = useForm({
        work_schedule: {
            enabled: workSchedule?.enabled ?? true,
            start_time: workSchedule?.start_time || "09:00",
            end_time: workSchedule?.end_time || "18:00",
            days: workSchedule?.days || [1, 2, 3, 4, 5],
        },
        privacy_blacklist: privacyBlacklist || [],
        telegram_chat_id: telegramChatId || "",
    });

    const addPhoneToBlacklist = () => {
        if (!newPhone.trim()) return;
        const updated = [...blacklist, newPhone.trim()];
        setBlacklist(updated);
        setData("privacy_blacklist", updated);
        setNewPhone("");
    };

    const removePhoneFromBlacklist = (index: number) => {
        const updated = blacklist.filter((_, i) => i !== index);
        setBlacklist(updated);
        setData("privacy_blacklist", updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put("/settings/work-schedule");
    };

    const dayLabels = [
        { id: 1, label: t("workSchedule.dayMon", "Dush") },
        { id: 2, label: t("workSchedule.dayTue", "Sesh") },
        { id: 3, label: t("workSchedule.dayWed", "Chor") },
        { id: 4, label: t("workSchedule.dayThu", "Pay") },
        { id: 5, label: t("workSchedule.dayFri", "Jum") },
        { id: 6, label: t("workSchedule.daySat", "Shan") },
        { id: 7, label: t("workSchedule.daySun", "Yak") },
    ];

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto">
            <Head title={t("workSchedule.title", "Ish Grafigi va Maxfiylik")} />

            <div>
                <h2 className="text-2xl font-bold tracking-tight">{t("workSchedule.title", "Ish Grafigi va Maxfiylik")}</h2>
                <p className="text-sm text-muted-foreground">
                    {t("workSchedule.subtitle", "Ish vaqtini sozlash va shaxsiy qo'ng'iroqlarni yozib olishdan himoyalash")}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Chap tomonda: Shaxsiy raqamlar qora ro'yxati (Blacklist) */}
                    <div className="space-y-6">
                        <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-red-500/10 text-red-600 rounded-xl">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base">{t("workSchedule.blacklistTitle", "Shaxsiy raqamlar qora ro'yxati (Blacklist)")}</h3>
                                    <p className="text-xs text-muted-foreground">{t("workSchedule.blacklistDesc", "Ushbu raqamlar bilan suhbatlar HECH QACHON yozilmaydi va saqlanmaydi")}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="+998901234567"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addPhoneToBlacklist();
                                        }
                                    }}
                                    className="font-mono text-sm"
                                />
                                <Button type="button" onClick={addPhoneToBlacklist} variant="secondary">
                                    <Plus className="h-4 w-4 mr-1" /> {t("workSchedule.addBtn", "Qo'shish")}
                                </Button>
                            </div>

                            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden min-h-[220px] max-h-[380px] overflow-y-auto">
                                {blacklist.length === 0 ? (
                                    <div className="h-[220px] flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground space-y-2">
                                        <Shield className="h-8 w-8 text-muted-foreground/30" />
                                        <p>{t("workSchedule.blacklistEmpty", "Qora ro'yxat bo'sh. Istalgan raqamni kiritishingiz mumkin.")}</p>
                                    </div>
                                ) : (
                                    blacklist.map((phone, idx) => (
                                        <div key={idx} className="p-3 flex justify-between items-center bg-card hover:bg-muted/40 transition-colors">
                                            <span className="font-mono text-xs font-semibold">{phone}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                onClick={() => removePhoneFromBlacklist(idx)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* O'ng tomonda: Kompaniya ish vaqti va Telegram Bildirishnomalar Guruxi */}
                    <div className="space-y-6">
                        {/* Work Schedule Card */}
                        <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base">{t("workSchedule.companyScheduleTitle", "Kompaniya ish vaqti")}</h3>
                                        <p className="text-xs text-muted-foreground">{t("workSchedule.companyScheduleDesc", "Ish vaqtidan tashqaridagi suhbatlar avtomatik filtrlanadi")}</p>
                                    </div>
                                </div>

                                <input
                                    type="checkbox"
                                    checked={data.work_schedule.enabled}
                                    onChange={(e) => setData("work_schedule", { ...data.work_schedule, enabled: e.target.checked })}
                                    className="rounded text-primary focus:ring-primary h-5 w-5 cursor-pointer"
                                />
                            </div>

                            {data.work_schedule.enabled && (
                                <div className="space-y-4 pt-2 border-t border-border">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold">{t("workSchedule.startTimeLabel", "Ish boshlanishi:")}</label>
                                            <Input
                                                type="time"
                                                value={data.work_schedule.start_time}
                                                onChange={(e) => setData("work_schedule", { ...data.work_schedule, start_time: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold">{t("workSchedule.endTimeLabel", "Ish yakuni:")}</label>
                                            <Input
                                                type="time"
                                                value={data.work_schedule.end_time}
                                                onChange={(e) => setData("work_schedule", { ...data.work_schedule, end_time: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">{t("workSchedule.workDaysLabel", "Ish kunlari:")}</label>
                                        <div className="flex gap-2">
                                            {dayLabels.map((day) => (
                                                <button
                                                    key={day.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const currentDays = data.work_schedule.days;
                                                        const updatedDays = currentDays.includes(day.id)
                                                            ? currentDays.filter((d: number) => d !== day.id)
                                                            : [...currentDays, day.id].sort();
                                                        setData("work_schedule", { ...data.work_schedule, days: updatedDays });
                                                    }}
                                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                                        data.work_schedule.days.includes(day.id)
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-secondary/50 border-border text-muted-foreground"
                                                    }`}
                                                >
                                                    {day.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Telegram Bot Alert Chat ID */}
                        <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
                                    <Send className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base">{t("workSchedule.telegramTitle", "Telegram Bildirishnomalar Guruxi")}</h3>
                                    <p className="text-xs text-muted-foreground">{t("workSchedule.telegramDesc", "Qoldirilgan qo'ng'iroqlar kelib tushadigan Telegram Chat ID")}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">{t("workSchedule.telegramChatIdLabel", "Telegram Chat ID (-100... yoki shaxsiy ID):")}</label>
                                    <Input
                                        placeholder="-1001234567890"
                                        value={data.telegram_chat_id}
                                        onChange={(e) => setData("telegram_chat_id", e.target.value)}
                                        className="font-mono"
                                    />
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                                    <span>{t("workSchedule.telegramHint", "Chat ID ni bilish uchun botga /start yuboring yoki guruhga qo'shing:")}</span>
                                    <a
                                        href="https://t.me/Agent1CallBot"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                                    >
                                        @Agent1CallBot
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={processing}>
                    {processing ? t("workSchedule.saving", "Saqlanmoqda...") : t("workSchedule.saveAllSettings", "Barcha sozlamalarni saqlash")}
                </Button>
            </form>
        </div>
    );
}
