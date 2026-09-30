<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_customer_cannot_send_chat_first_without_admin_chat()
    {
        $order = Order::first();
        $customer = User::find($order->user_id);

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/orders/{$order->id}/chats", [
                'pesan' => 'Halo min, bisa kirim cepat?',
            ]);

        $response->assertStatus(403)
            ->assertJson(['success' => false]);
    }

    public function test_admin_can_send_chat_and_customer_can_reply()
    {
        $order = Order::first();
        $customer = User::find($order->user_id);
        $admin = User::where('peran', 'admin')->first();

        // 1. Admin sends chat first (e.g. out of stock notification)
        $adminResponse = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/orders/{$order->id}/chats", [
                'pesan' => 'Halo kak, stok produk kosong.',
            ]);

        $adminResponse->assertStatus(201)
            ->assertJson(['success' => true]);

        // 2. Customer can now reply
        $customerResponse = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/orders/{$order->id}/chats", [
                'pesan' => 'Bisa diganti varian lain kak?',
            ]);

        $customerResponse->assertStatus(201)
            ->assertJson(['success' => true]);

        // 3. Fetch chat history
        $getResponse = $this->actingAs($customer, 'sanctum')
            ->getJson("/api/orders/{$order->id}/chats");

        $getResponse->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }
}
