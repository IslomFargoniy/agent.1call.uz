<?php

use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\User as SocialiteUser;

test('it redirects to google oauth page', function () {
    $response = $this->get('/auth/google');

    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('accounts.google.com');
});

test('abdurahmanislam304@gmail.com is automatically registered as superadmin', function () {
    $abstractUser = Mockery::mock(SocialiteUser::class);
    $abstractUser->shouldReceive('getId')->andReturn('google-123456');
    $abstractUser->shouldReceive('getName')->andReturn('Abdurahman Islam');
    $abstractUser->shouldReceive('getEmail')->andReturn('abdurahmanislam304@gmail.com');
    $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar.jpg');

    $provider = Mockery::mock(GoogleProvider::class);
    $provider->shouldReceive('user')->andReturn($abstractUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get('/auth/google/callback');

    $this->assertAuthenticated();

    $user = User::where('email', 'abdurahmanislam304@gmail.com')->first();
    expect($user)->not->toBeNull();
    expect($user->role)->toBe('superadmin');
    expect($user->google_id)->toBe('google-123456');
    expect($user->avatar)->toBe('https://lh3.googleusercontent.com/avatar.jpg');
});

test('new standard google user gets created with tenant and admin role', function () {
    $abstractUser = Mockery::mock(SocialiteUser::class);
    $abstractUser->shouldReceive('getId')->andReturn('google-987654');
    $abstractUser->shouldReceive('getName')->andReturn('Ali Valiyev');
    $abstractUser->shouldReceive('getEmail')->andReturn('alivaliyev@gmail.com');
    $abstractUser->shouldReceive('getAvatar')->andReturn(null);

    $provider = Mockery::mock(GoogleProvider::class);
    $provider->shouldReceive('user')->andReturn($abstractUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get('/auth/google/callback');

    $this->assertAuthenticated();

    $user = User::where('email', 'alivaliyev@gmail.com')->first();
    expect($user)->not->toBeNull();
    expect($user->role)->toBe('admin');
    expect($user->tenant_id)->not->toBeNull();
    expect($user->tenant->name)->toContain('Ali Valiyev');
    expect($user->tenant->isTrial())->toBeTrue();
});
