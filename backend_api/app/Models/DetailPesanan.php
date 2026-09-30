<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailPesanan extends Model
{
    protected $table = 'detail_pesanan';

    protected $guarded = [];

    public function toArray()
    {
        $array = [
            'id' => $this->id,
            'order_id' => $this->pesanan_id,
            'product_id' => $this->produk_id,
            'product_name' => $this->nama_produk,
            'nama_produk' => $this->nama_produk,
            'price' => (float) $this->harga,
            'quantity' => (int) $this->jumlah,
            'subtotal' => (float) $this->subtotal,
            'is_reward' => (bool) ($this->is_reward ?? false),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if (isset($this->attributes['total_terjual'])) {
            $array['total_terjual'] = (int) $this->attributes['total_terjual'];
        }
        if (isset($this->attributes['total_omzet'])) {
            $array['total_omzet'] = (float) $this->attributes['total_omzet'];
        }
        if (isset($this->attributes['total_sold'])) {
            $array['total_sold'] = (int) $this->attributes['total_sold'];
        }

        if ($this->relationLoaded('order')) {
            $array['order'] = $this->order;
        }
        if ($this->relationLoaded('product')) {
            $array['product'] = $this->product;
        }

        return $array;
    }

    public function order()
    {
        return $this->belongsTo(Pesanan::class, 'pesanan_id');
    }

    public function product()
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function getOrderIdAttribute()
    {
        return $this->pesanan_id;
    }

    public function setOrderIdAttribute($value)
    {
        $this->attributes['pesanan_id'] = $value;
    }

    public function getProductIdAttribute()
    {
        return $this->produk_id;
    }

    public function setProductIdAttribute($value)
    {
        $this->attributes['produk_id'] = $value;
    }

    public function getProductNameAttribute()
    {
        return $this->nama_produk;
    }

    public function setProductNameAttribute($value)
    {
        $this->attributes['nama_produk'] = $value;
    }

    public function getPriceAttribute()
    {
        return $this->harga;
    }

    public function setPriceAttribute($value)
    {
        $this->attributes['harga'] = $value;
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
