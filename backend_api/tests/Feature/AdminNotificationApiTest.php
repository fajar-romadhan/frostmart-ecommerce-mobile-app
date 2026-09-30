<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Notifikasi;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AdminNotificationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_returns_notification_metadata()
    {
        $admin = User::factory()->create(['peran' => 'admin']);

        $notif = Notifikasi::create([
            'pengguna_id' => null,
            'judul' => 'Pesanan Baru Masuk 🛒',
            'pesan' => 'Pesanan baru #ORD-TEST-001 dari Pelanggan sebesar Rp 50.000',
            'jenis' => 'pesanan_baru',
            'apakah_dibaca' => false,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/dashboard');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'latest_notification_id' => $notif->id,
                    'unread_notifications_count' => 1,
                ]
            ]);
    }

    public function test_admin_can_fetch_and_mark_read_notifications()
    {
        $admin = User::factory()->create(['peran' => 'admin']);

        $notif = Notifikasi::create([
            'pengguna_id' => null,
            'judul' => 'Bukti Pembayaran Diunggah 💳',
            'pesan' => 'Pelanggan telah mengunggah bukti pembayaran untuk pesanan #ORD-TEST-002.',
            'jenis' => 'bukti_pembayaran',
            'apakah_dibaca' => false,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/notifications');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $markRes = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/notifications/mark-read');

        $markRes->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('notifikasi', [
            'id' => $notif->id,
            'apakah_dibaca' => true,
        ]);
    }
}
