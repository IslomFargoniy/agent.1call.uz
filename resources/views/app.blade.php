<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="1Call Agent — Korporativ telefoniya, aqlli call tracking va Android qo‘ng‘iroqlar yozuvi. amoCRM va MoySklad bilan to‘liq integratsiya.">
        <meta name="keywords" content="1call, telefoniya, call tracking uzbekistan, amocrm uzbekistan, moysklad telefoniya, qo'ng'iroqlarni yozib olish, android telefoniya">
        <meta name="author" content="1Call Agent Team">
        <meta name="robots" content="index, follow">

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://agent.1call.uz/">
        <meta property="og:title" content="1Call Agent — Smart Call Tracking & Telefoniya">
        <meta property="og:description" content="Android smartfonlardagi korporativ qo‘ng‘iroqlarni avtomatlashtiring, audio fayllarni saqlang va amoCRM hamda MoySklad bilan sinxronlang.">
        <meta property="og:image" content="https://agent.1call.uz/images/1call_logo.png">

        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="https://agent.1call.uz/">
        <meta property="twitter:title" content="1Call Agent — Smart Call Tracking & Telefoniya">
        <meta property="twitter:description" content="Android smartfonlardagi korporativ qo‘ng‘iroqlarni avtomatlashtiring, audio fayllarni saqlang va amoCRM hamda MoySklad bilan sinxronlang.">
        <meta property="twitter:image" content="https://agent.1call.uz/images/1call_logo.png">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', '1Call Agent') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
