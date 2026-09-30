<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StokMasuk extends Model
{
    protected $table = 'stok_masuk';

    protected $guarded = [];

    public function toArray()
    {
        $array = [
            'id' => $this->id,
            'product_id' => $this->produk_id,
            'quantity' => (int) $this->jumlah,
            'supplier_name' => $this->nama_pemasok,
            'purchase_date' => $this->tanggal_pembelian,
            'note' => $this->catatan,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if ($this->relationLoaded('product')) {
            $array['product'] = $this->product;
        }

        return $array;
    }

    public function product()
    {
        return $this->belongsTo(Produk::class, 'produk_id');
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

    public function getSupplierNameAttribute()
    {
        return $this->nama_pemasok;
    }

    public function setSupplierNameAttribute($value)
    {
        $this->attributes['nama_pemasok'] = $value;
    }

    public function getPurchaseDateAttribute()
    {
        return $this->tanggal_pembelian;
    }

    public function setPurchaseDateAttribute($value)
    {
        $this->attributes['tanggal_pembelian'] = $value;
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
