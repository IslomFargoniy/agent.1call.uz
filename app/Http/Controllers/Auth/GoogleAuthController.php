<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    public const SUPERADMIN_EMAIL = 'abdurahmanislam304@gmail.com';

    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            Log::error('Google OAuth callback failed: '.$e->getMessage());

            return redirect()->route('login')->withErrors(['email' => 'Google orqali tizimga kirishda xatolik yuz berdi.']);
        }

        $email = strtolower(trim($googleUser->getEmail()));
        $isSuperAdmin = ($email === self::SUPERADMIN_EMAIL);

        // Check if user exists by email or google_id
        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $email)
            ->first();

        if ($user) {
            $user->google_id = $googleUser->getId();
            $user->avatar = $googleUser->getAvatar();
            if ($isSuperAdmin) {
                $user->role = 'superadmin';
                if (! $user->tenant_id) {
                    $systemTenant = Tenant::firstOrCreate(
                        ['slug' => '1call-main'],
                        [
                            'name' => 'Agent1Call Asosiy Kompaniya',
                            'allowed_devices_count' => 100,
                            'audio_retention_days' => 365,
                            'is_active' => true,
                            'trial_ends_at' => null,
                            'subscription_expires_at' => now()->addYears(50),
                        ]
                    );
                    $user->tenant_id = $systemTenant->id;
                }
            }
            if (! $user->email_verified_at) {
                $user->email_verified_at = now();
            }
            $user->save();
        } else {
            // New user registration
            if ($isSuperAdmin) {
                $systemTenant = Tenant::firstOrCreate(
                    ['slug' => '1call-main'],
                    [
                        'name' => 'Agent1Call Asosiy Kompaniya',
                        'allowed_devices_count' => 100,
                        'audio_retention_days' => 365,
                        'is_active' => true,
                        'trial_ends_at' => null,
                        'subscription_expires_at' => now()->addYears(50),
                    ]
                );

                $user = User::create([
                    'tenant_id' => $systemTenant->id,
                    'name' => $googleUser->getName() ?? 'Abdurahman Islam',
                    'email' => $email,
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'role' => 'superadmin',
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);
            } else {
                // Auto create a tenant for new company admins with 14 days free trial
                $companyName = ($googleUser->getName() ? $googleUser->getName().' kompaniyasi' : 'Yangi Kompaniya');
                $tenant = Tenant::create([
                    'name' => $companyName,
                    'slug' => Str::slug($googleUser->getName() ?: 'company').'-'.Str::lower(Str::random(4)),
                    'allowed_devices_count' => 3,
                    'audio_retention_days' => 30,
                    'trial_ends_at' => now()->addDays(14),
                    'subscription_expires_at' => null,
                    'grace_period_ends_at' => null,
                    'is_active' => true,
                ]);

                $user = User::create([
                    'tenant_id' => $tenant->id,
                    'name' => $googleUser->getName() ?? 'Foydalanuvchi',
                    'email' => $email,
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'role' => 'admin',
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);
            }
        }

        Auth::login($user, remember: true);

        request()->session()->regenerate();

        if ($user->isSuperAdmin()) {
            return redirect()->intended(route('admin.tenants.index'));
        }

        return redirect()->intended(route('dashboard'));
    }
}
