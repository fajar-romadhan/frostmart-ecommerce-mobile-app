<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PesanChat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function index($orderId)
    {
        $order = Order::findOrFail($orderId);

        $user = Auth::user();
        if ($user->role === 'pelanggan' && $order->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Tidak memiliki akses'], 403);
        }

        // Tandai pesan sebagai sudah dibaca untuk penerima
        if (in_array($user->peran, ['admin', 'owner']) || in_array($user->role, ['admin', 'owner'])) {
            PesanChat::where('pesanan_id', $orderId)
                ->where('is_read', false)
                ->whereHas('pengirim', function ($q) {
                    $q->where('peran', 'pelanggan');
                })
                ->update(['is_read' => true]);
        } else {
            PesanChat::where('pesanan_id', $orderId)
                ->where('penerima_id', $user->id)
                ->where('is_read', false)
                ->update(['is_read' => true]);
        }

        $chats = PesanChat::with(['pengirim', 'penerima'])
            ->where('pesanan_id', $orderId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $chats,
        ]);
    }

    public function store(Request $request, $orderId)
    {
        $request->validate([
            'pesan' => 'required|string',
        ]);

        $order = Order::findOrFail($orderId);
        $sender = Auth::user();
        $isPelanggan = $sender->role === 'pelanggan' || $sender->peran === 'pelanggan';

        if ($isPelanggan) {
            $hasAdminMessage = PesanChat::where('pesanan_id', $orderId)
                ->whereHas('pengirim', function ($q) {
                    $q->whereIn('peran', ['admin', 'owner']);
                })->exists();

            if (!$hasAdminMessage) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fitur chat hanya dapat aktif setelah Admin Toko memulai percakapan.',
                ], 403);
            }

            $recipientId = 1;
        } else {
            $recipientId = $order->user_id;
        }

        $chat = PesanChat::create([
            'pesanan_id' => $orderId,
            'pengirim_id' => $sender->id,
            'penerima_id' => $recipientId,
            'pesan' => $request->pesan,
            'is_read' => false,
        ]);

        // Buat notifikasi real-time di database
        try {
            if (!$isPelanggan) {
                // Admin kirim ke Pelanggan
                \App\Models\Notifikasi::create([
                    'pengguna_id' => $order->user_id,
                    'judul' => '💬 Pesan Baru dari Admin Toko',
                    'pesan' => "Admin Toko: \"{$request->pesan}\" (Pesanan #{$order->kode_pesanan})",
                    'jenis' => 'chat',
                    'apakah_dibaca' => false,
                ]);
            } else {
                // Pelanggan balas ke Admin
                \App\Models\Notifikasi::create([
                    'pengguna_id' => null,
                    'judul' => '💬 Pesan Chat dari Pelanggan',
                    'pesan' => "{$sender->nama}: \"{$request->pesan}\" (Pesanan #{$order->kode_pesanan})",
                    'jenis' => 'chat',
                    'apakah_dibaca' => false,
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Gagal membuat notifikasi chat: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Pesan berhasil dikirim',
            'data' => $chat->load(['pengirim', 'penerima']),
        ], 201);
    }
}
