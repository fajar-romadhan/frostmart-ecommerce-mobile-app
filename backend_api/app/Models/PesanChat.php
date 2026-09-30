<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PesanChat extends Model
{
    use HasFactory;

    protected $table = 'pesan_chat';

    protected $fillable = [
        'pesanan_id',
        'pengirim_id',
        'penerima_id',
        'pesan',
        'is_read',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Order::class, 'pesanan_id');
    }

    public function pengirim()
    {
        return $this->belongsTo(User::class, 'pengirim_id');
    }

    public function penerima()
    {
        return $this->belongsTo(User::class, 'penerima_id');
    }
}
