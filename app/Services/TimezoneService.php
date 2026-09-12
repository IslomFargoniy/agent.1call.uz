<?php

namespace App\Services;

use DateTimeZone;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TimezoneService
{
    public const DEFAULT_TIMEZONE = 'Asia/Tashkent';

    /**
     * Resolves the user's timezone from request header, cookie, or fallback default.
     */
    public static function resolveTimezone(?Request $request = null): string
    {
        $request = $request ?? request();
        if (! $request) {
            return self::DEFAULT_TIMEZONE;
        }

        $tz = $request->header('X-Timezone') ?: $request->cookie('app_timezone');

        if (! empty($tz) && in_array($tz, DateTimeZone::listIdentifiers(), true)) {
            return $tz;
        }

        return self::DEFAULT_TIMEZONE;
    }

    /**
     * Converts a user's local date start boundary (00:00:00) into UTC Carbon instance.
     */
    public static function localStartOfDayToUtc(string $date, ?string $timezone = null): Carbon
    {
        $tz = $timezone ?: self::resolveTimezone();
        try {
            return Carbon::parse($date, $tz)->startOfDay()->setTimezone('UTC');
        } catch (\Throwable) {
            return Carbon::parse($date)->startOfDay();
        }
    }

    /**
     * Converts a user's local date end boundary (23:59:59) into UTC Carbon instance.
     */
    public static function localEndOfDayToUtc(string $date, ?string $timezone = null): Carbon
    {
        $tz = $timezone ?: self::resolveTimezone();
        try {
            return Carbon::parse($date, $tz)->endOfDay()->setTimezone('UTC');
        } catch (\Throwable) {
            return Carbon::parse($date)->endOfDay();
        }
    }

    /**
     * Returns UTC Carbon instance for start of today in the user's local timezone.
     */
    public static function localTodayStartToUtc(?string $timezone = null): Carbon
    {
        $tz = $timezone ?: self::resolveTimezone();
        try {
            return Carbon::now($tz)->startOfDay()->setTimezone('UTC');
        } catch (\Throwable) {
            return Carbon::today();
        }
    }
}
