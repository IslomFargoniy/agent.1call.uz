<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        return \Illuminate\Support\Facades\DB::transaction(function () use ($input) {
            $name = trim($input['name']);
            $companyName = ! empty($input['company_name']) ? trim($input['company_name']) : "{$name} Kompaniyasi";

            $tenant = \App\Models\Tenant::create([
                'name' => $companyName,
                'email' => $input['email'],
                'slug' => \Illuminate\Support\Str::slug($companyName).'-'.\Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(4)),
                'is_active' => true,
                'allowed_devices_count' => 3,
                'audio_retention_days' => 30,
                'trial_ends_at' => \Illuminate\Support\Carbon::now()->addDays(14),
            ]);

            return User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
                'role' => 'admin',
                'tenant_id' => $tenant->id,
                'is_active' => true,
            ]);
        });
    }
}
