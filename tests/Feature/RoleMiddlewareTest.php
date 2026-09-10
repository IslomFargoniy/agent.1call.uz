<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::middleware(['web', 'role:admin'])->get('/test-admin-only', function () {
        return response()->json(['message' => 'Admin granted']);
    });

    Route::middleware(['web', 'role:admin,operator'])->get('/test-staff-only', function () {
        return response()->json(['message' => 'Staff granted']);
    });

    Route::middleware(['web', 'superadmin.bypass'])->get('/test-superadmin-only', function () {
        return response()->json(['message' => 'Superadmin granted']);
    });

    $this->tenant = Tenant::create([
        'name' => 'RBAC Tenant',
        'slug' => 'rbac-tenant',
    ]);
});

test('operator is forbidden from admin routes', function () {
    $operator = User::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Operator User',
        'email' => 'operator@test.uz',
        'password' => 'secret123',
        'role' => 'operator',
    ]);

    $this->actingAs($operator)
        ->getJson('/test-admin-only')
        ->assertStatus(403);
});

test('admin can access admin routes', function () {
    $admin = User::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Admin User',
        'email' => 'admin@test.uz',
        'password' => 'secret123',
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->getJson('/test-admin-only')
        ->assertStatus(200)
        ->assertJson(['message' => 'Admin granted']);
});

test('both admin and operator can access staff routes', function () {
    $operator = User::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Operator 2',
        'email' => 'op2@test.uz',
        'password' => 'secret123',
        'role' => 'operator',
    ]);

    $this->actingAs($operator)
        ->getJson('/test-staff-only')
        ->assertStatus(200);
});

test('superadmin can access all routes including superadmin-only', function () {
    $superadmin = User::create([
        'tenant_id' => null,
        'name' => 'Platform Superadmin',
        'email' => 'super@1call.uz',
        'password' => 'secret123',
        'role' => 'superadmin',
    ]);

    $this->actingAs($superadmin)
        ->getJson('/test-admin-only')
        ->assertStatus(200);

    $this->actingAs($superadmin)
        ->getJson('/test-superadmin-only')
        ->assertStatus(200)
        ->assertJson(['message' => 'Superadmin granted']);
});
