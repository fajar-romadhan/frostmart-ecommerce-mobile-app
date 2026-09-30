<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $table = 'activity_logs';

    protected $fillable = [
        'user_id',
        'user_name',
        'user_role',
        'action',
        'description',
        'ip_address',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Helper to log admin/user activity with full name and timestamp.
     */
    public static function record($user, string $action, string $description, ?string $ip = null)
    {
        try {
            $name = $user ? ($user->name ?? $user->nama ?? 'Admin') : 'System Admin';
            $role = $user ? ($user->role ?? $user->peran ?? 'admin') : 'admin';
            $userId = $user ? $user->id : null;

            return self::create([
                'user_id' => $userId,
                'user_name' => $name,
                'user_role' => $role,
                'action' => $action,
                'description' => $description,
                'ip_address' => $ip,
            ]);
        } catch (\Exception $e) {
            \Log::error('Gagal mencatat ActivityLog: ' . $e->getMessage());
            return null;
        }
    }
}
