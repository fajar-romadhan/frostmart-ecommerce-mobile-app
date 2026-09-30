<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notifikasi;
use App\Models\PesanChat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Ambil riwayat notifikasi untuk pengguna yang sedang login (Pelanggan / Admin)
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Notifikasi::query();

        if (in_array($user->peran, ['admin', 'owner']) || in_array($user->role, ['admin', 'owner'])) {
            $query->whereNull('pengguna_id');
        } else {
            $query->where('pengguna_id', $user->id);
        }

        $notifications = $query->orderBy('id', 'desc')->take(50)->get();
        $unreadCount = $query->clone()->where('apakah_dibaca', false)->count();
        $latestId = $notifications->first()?->id ?? 0;

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
                'latest_id' => $latestId,
            ],
        ], 200);
    }

    /**
     * Hitung jumlah notifikasi belum dibaca & pesan chat belum dibaca
     */
    public function unreadCount(Request $request)
    {
        $user = Auth::user();

        // 1. Notifikasi sistem
        $notifQuery = Notifikasi::query();
        if (in_array($user->peran, ['admin', 'owner']) || in_array($user->role, ['admin', 'owner'])) {
            $notifQuery->whereNull('pengguna_id');
        } else {
            $notifQuery->where('pengguna_id', $user->id);
        }
        $unreadNotifs = $notifQuery->where('apakah_dibaca', false)->count();
        $latestNotif = $notifQuery->orderBy('id', 'desc')->first();

        // 2. Pesan chat belum dibaca
        $unreadChats = PesanChat::where('penerima_id', $user->id)
            ->where('is_read', false)
            ->with(['pesanan:id,kode_pesanan,status_pesanan', 'pengirim:id,nama,peran'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'unread_notifications_count' => $unreadNotifs,
                'unread_chats_count' => $unreadChats->count(),
                'unread_chats' => $unreadChats,
                'latest_notification' => $latestNotif,
            ],
        ], 200);
    }

    /**
     * Tandai notifikasi telah dibaca
     */
    public function markRead(Request $request)
    {
        $user = Auth::user();
        $query = Notifikasi::query();

        if (in_array($user->peran, ['admin', 'owner']) || in_array($user->role, ['admin', 'owner'])) {
            $query->whereNull('pengguna_id');
        } else {
            $query->where('pengguna_id', $user->id);
        }

        if ($request->has('id')) {
            $query->where('id', $request->id);
        }

        $query->where('apakah_dibaca', false)->update(['apakah_dibaca' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi telah ditandai dibaca.',
        ], 200);
    }
}
