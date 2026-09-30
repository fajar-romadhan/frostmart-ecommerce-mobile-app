<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiwayatPoin extends Model
{
    use HasFactory;

    protected $table = 'riwayat_poin';

    protected $guarded = [];

    protected $casts = [
        'jumlah_poin' => 'integer',
        'saldo_akhir' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }

    public function order()
    {
        return $this->belongsTo(Pesanan::class, 'pesanan_id');
    }

    public function toArray()
    {
        return [
            'id' => $this->id,
            'user_id' => $this->pengguna_id,
            'order_id' => $this->pesanan_id,
            'order_code' => $this->order ? $this->order->kode_pesanan : null,
            'order_status' => $this->order ? $this->order->status_pesanan : null,
            'type' => $this->jenis, // 'masuk' or 'keluar'
            'points' => (int) $this->jumlah_poin,
            'final_balance' => (int) $this->saldo_akhir,
            'description' => $this->keterangan,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'formatted_date' => $this->created_at ? $this->created_at->locale('id')->isoFormat('D MMM YYYY • HH:mm') : null,
        ];
    }
}
