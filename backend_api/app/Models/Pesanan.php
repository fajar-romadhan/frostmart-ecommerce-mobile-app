<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pesanan extends Model
{
    protected $table = 'pesanan';

    protected $guarded = [];

    protected $casts = [
        'waktu_tenggat_pembayaran' => 'datetime',
    ];

    public function toArray()
    {
        $array = [
            'id' => $this->id,
            'user_id' => $this->pengguna_id,
            'order_code' => $this->kode_pesanan,
            'order_date' => $this->tanggal_pesanan,
            'total_amount' => (float) $this->total_harga,
            'shipping_fee' => (int) $this->ongkos_kirim,
            'shipping_distance' => (float) $this->jarak_pengiriman,
            'branch_id' => $this->cabang_toko_id,
            'payment_method' => $this->metode_pembayaran,
            'delivery_method' => $this->metode_pengiriman,
            'shipping_address' => $this->alamat_pengiriman,
            'order_status' => $this->status_pesanan,
            'payment_status' => $this->status_pembayaran,
            'kurir_id' => $this->kurir_id,
            'waktu_dikirim' => $this->waktu_dikirim,
            'waktu_selesai' => $this->waktu_selesai,
            'waktu_tenggat_pembayaran' => $this->waktu_tenggat_pembayaran,
            'payment_deadline' => $this->waktu_tenggat_pembayaran ? (is_string($this->waktu_tenggat_pembayaran) ? $this->waktu_tenggat_pembayaran : $this->waktu_tenggat_pembayaran->toIso8601String()) : ($this->created_at ? (is_string($this->created_at) ? date('c', strtotime($this->created_at . ' +30 minutes')) : $this->created_at->addMinutes(30)->toIso8601String()) : null),
            'points_used' => (int) ($this->poin_digunakan ?? 0),
            'points_earned' => (int) ($this->poin_diperoleh ?? 0),
            'reward_product_id' => $this->produk_hadiah_id,
            'cancellation_reason' => $this->catatan_pembatalan,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if ($this->relationLoaded('user')) {
            $array['user'] = $this->user;
        }
        if ($this->relationLoaded('kurir')) {
            $array['kurir'] = $this->kurir;
        }
        if ($this->relationLoaded('orderDetails')) {
            $array['order_details'] = $this->orderDetails;
        }
        if ($this->relationLoaded('payment')) {
            $array['payment'] = $this->payment;
        }
        if ($this->relationLoaded('stockOuts')) {
            $array['stock_outs'] = $this->stockOuts;
        }
        if ($this->relationLoaded('branch')) {
            $array['branch'] = $this->branch;
        }
        if ($this->relationLoaded('rewardProduct')) {
            $array['reward_product'] = $this->rewardProduct;
        }
        if ($this->relationLoaded('chats')) {
            $adminChats = $this->chats->filter(function($c) {
                $role = $c->pengirim?->peran ?? $c->pengirim?->role ?? '';
                return in_array($role, ['admin', 'owner']);
            });
            $array['unread_chats_count'] = $this->chats->where('penerima_id', $this->pengguna_id)->where('is_read', false)->count();
            $array['latest_admin_chat'] = $adminChats->sortByDesc('id')->first()?->pesan ?? null;
            $array['has_admin_chat'] = $adminChats->isNotEmpty();
        }

        return $array;
    }

    public function chats()
    {
        return $this->hasMany(PesanChat::class, 'pesanan_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }

    public function orderDetails()
    {
        return $this->hasMany(DetailPesanan::class, 'pesanan_id');
    }

    public function payment()
    {
        return $this->hasOne(Pembayaran::class, 'pesanan_id');
    }

    public function stockOuts()
    {
        return $this->hasMany(StokKeluar::class, 'pesanan_id');
    }

    public function kurir()
    {
        return $this->belongsTo(User::class, 'kurir_id');
    }

    public function rewardProduct()
    {
        return $this->belongsTo(Produk::class, 'produk_hadiah_id');
    }

    public function pointHistories()
    {
        return $this->hasMany(RiwayatPoin::class, 'pesanan_id');
    }

    public function getUserIdAttribute()
    {
        return $this->pengguna_id;
    }

    public function setUserIdAttribute($value)
    {
        $this->attributes['pengguna_id'] = $value;
    }

    public function getOrderCodeAttribute()
    {
        return $this->kode_pesanan;
    }

    public function setOrderCodeAttribute($value)
    {
        $this->attributes['kode_pesanan'] = $value;
    }

    public function getOrderDateAttribute()
    {
        return $this->tanggal_pesanan;
    }

    public function setOrderDateAttribute($value)
    {
        $this->attributes['tanggal_pesanan'] = $value;
    }

    public function getTotalAmountAttribute()
    {
        return $this->total_harga;
    }

    public function setTotalAmountAttribute($value)
    {
        $this->attributes['total_harga'] = $value;
    }

    public function getPaymentMethodAttribute()
    {
        return $this->metode_pembayaran;
    }

    public function setPaymentMethodAttribute($value)
    {
        $this->attributes['metode_pembayaran'] = $value;
    }

    public function getDeliveryMethodAttribute()
    {
        return $this->metode_pengiriman;
    }

    public function setDeliveryMethodAttribute($value)
    {
        $this->attributes['metode_pengiriman'] = $value;
    }

    public function getShippingAddressAttribute()
    {
        return $this->alamat_pengiriman;
    }

    public function setShippingAddressAttribute($value)
    {
        $this->attributes['alamat_pengiriman'] = $value;
    }

    public function getOrderStatusAttribute()
    {
        return $this->status_pesanan;
    }

    public function setOrderStatusAttribute($value)
    {
        $this->attributes['status_pesanan'] = $value;
    }

    public function getPaymentStatusAttribute()
    {
        return $this->status_pembayaran;
    }

    public function setPaymentStatusAttribute($value)
    {
        $this->attributes['status_pembayaran'] = $value;
    }

    public function getPointsUsedAttribute()
    {
        return (int) ($this->attributes['poin_digunakan'] ?? 0);
    }

    public function setPointsUsedAttribute($value)
    {
        $this->attributes['poin_digunakan'] = (int) $value;
    }

    public function getPointsEarnedAttribute()
    {
        return (int) ($this->attributes['poin_diperoleh'] ?? 0);
    }

    public function setPointsEarnedAttribute($value)
    {
        $this->attributes['poin_diperoleh'] = (int) $value;
    }

    public function getRewardProductIdAttribute()
    {
        return $this->attributes['produk_hadiah_id'] ?? null;
    }

    public function setRewardProductIdAttribute($value)
    {
        $this->attributes['produk_hadiah_id'] = $value;
    }

    public function branch()
    {
        return $this->belongsTo(CabangToko::class, 'cabang_toko_id');
    }
}
