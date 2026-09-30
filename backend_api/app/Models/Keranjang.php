<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Keranjang extends Model
{
    protected $table = 'keranjang';

    protected $guarded = [];

    public function toArray()
    {
        $array = [
            'id' => $this->id,
            'user_id' => $this->pengguna_id,
            'product_id' => $this->produk_id,
            'quantity' => (int) $this->jumlah,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if ($this->relationLoaded('user')) {
            $array['user'] = $this->user;
        }
        if ($this->relationLoaded('product')) {
            $array['product'] = $this->product;
        }

        return $array;
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }

    public function product()
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function getUserIdAttribute()
    {
        return $this->pengguna_id;
    }

    public function setUserIdAttribute($value)
    {
        $this->attributes['pengguna_id'] = $value;
    }

    public function getProductIdAttribute()
    {
        return $this->produk_id;
    }

    public function setProductIdAttribute($value)
    {
        $this->attributes['produk_id'] = $value;
    }

    public function getQuantityAttribute()
    {
        return $this->jumlah;
    }

    public function setQuantityAttribute($value)
    {
        $this->attributes['jumlah'] = $value;
    }
}
