<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->cookie('locale') ?? $request->header('X-Locale');

        if ($locale && in_array($locale, ['uz', 'ru', 'en'])) {
            App::setLocale($locale);
        } else {
            App::setLocale('uz');
        }

        return $next($request);
    }
}
