<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StokKeluar extends Model
{
    protected $table = 'stok_keluar';

    protected $guarded = [];

    public function toArray()
    {
        $array = [
            'id' => $this->id,
            'product_id' => $this->produk_id,
            'order_id' => $this->pesanan_id,
            'quantity' => (int) $this->jumlah,
            'type' => $this->jenis,
            'note' => $this->catatan,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if ($this->relationLoaded('product')) {
            $array['product'] = $this->product;
        }
        if ($this->relationLoaded('order')) {
            $array['order'] = $this->order;
        }

        return $array;
    }

    public function product()
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function order()
    {
        return $this->belongsTo(Pesanan::class, 'pesanan_id');
    }

    public function getProductIdAttribute()
    {
        return $this->produk_id;
    }

    public function setProductIdAttribute($value)
    {
        $this->attributes['produk_id'] = $value;
    }

    public function getOrderIdAttribute()
    {
        return $this->pesanan_id;
    }

    public function setOrderIdAttribute($value)
    {
        $this->attributes['pesanan_id'] = $value;
    }

    public function getQuantityAttribute()
    {
        return $this->jumlah;
    }

    public function setQuantityAttribute($value)
    {
        $this->attributes['jumlah'] = $value;
    }

    public function getTypeAttribute()
    {
        return $this->jenis;
    }

    public function setTypeAttribute($value)
    {
        $this->attributes['jenis'] = $value;
    }

    public function getNoteAttribute()
    {
        return $this->catatan;
    }

    public function setNoteAttribute($value)
    {
        $this->attributes['catatan'] = $value;
    }
}
