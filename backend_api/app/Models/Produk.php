<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produk extends Model
{
    protected $table = 'produk';

    protected $guarded = [];

    protected $appends = ['image_url'];

    public function toArray()
    {
        $array = [
            'id' => $this->id,
            'category_id' => $this->kategori_id,
            'product_code' => $this->kode_produk,
            'name' => $this->nama,
            'description' => $this->deskripsi,
            'price' => (float) $this->harga,
            'stock' => (int) $this->stok,
            'minimum_stock' => (int) $this->stok_minimum,
            'unit' => $this->satuan,
            'expired_date' => $this->tanggal_kadaluarsa,
            'image' => $this->gambar,
            'image_url' => $this->image_url,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if ($this->relationLoaded('category')) {
            $array['category'] = $this->category;
        }
        if ($this->relationLoaded('carts')) {
            $array['carts'] = $this->carts;
        }
        if ($this->relationLoaded('orderDetails')) {
            $array['order_details'] = $this->orderDetails;
        }
        if ($this->relationLoaded('stockIns')) {
            $array['stock_ins'] = $this->stockIns;
        }
        if ($this->relationLoaded('stockOuts')) {
            $array['stock_outs'] = $this->stockOuts;
        }

        return $array;
    }

    public function category()
    {
        return $this->belongsTo(Kategori::class, 'kategori_id');
    }

    public function carts()
    {
        return $this->hasMany(Keranjang::class, 'produk_id');
    }

    public function orderDetails()
    {
        return $this->hasMany(DetailPesanan::class, 'produk_id');
    }

    public function stockIns()
    {
        return $this->hasMany(StokMasuk::class, 'produk_id');
    }

    public function stockOuts()
    {
        return $this->hasMany(StokKeluar::class, 'produk_id');
    }

    public function getImageUrlAttribute()
    {
        if ($this->gambar) {
            return 'storage/' . $this->gambar;
        }
        return null;
    }

    public function getCategoryIdAttribute()
    {
        return $this->kategori_id;
    }

    public function setCategoryIdAttribute($value)
    {
        $this->attributes['kategori_id'] = $value;
    }

    public function getProductCodeAttribute()
    {
        return $this->kode_produk;
    }

    public function setProductCodeAttribute($value)
    {
        $this->attributes['kode_produk'] = $value;
    }

    public function getNameAttribute()
    {
        return $this->nama;
    }

    public function setNameAttribute($value)
    {
        $this->attributes['nama'] = $value;
    }

    public function getDescriptionAttribute()
    {
        return $this->deskripsi;
    }

    public function setDescriptionAttribute($value)
    {
        $this->attributes['deskripsi'] = $value;
    }

    public function getPriceAttribute()
    {
        return $this->harga;
    }

    public function setPriceAttribute($value)
    {
        $this->attributes['harga'] = $value;
    }

    public function getStockAttribute()
    {
        return $this->stok;
    }

    public function setStockAttribute($value)
    {
        $this->attributes['stok'] = $value;
    }

    public function getMinimumStockAttribute()
    {
        return $this->stok_minimum;
    }

    public function setMinimumStockAttribute($value)
    {
        $this->attributes['stok_minimum'] = $value;
    }

    public function getUnitAttribute()
    {
        return $this->satuan;
    }

    public function setUnitAttribute($value)
    {
        $this->attributes['satuan'] = $value;
    }

    public function getExpiredDateAttribute()
    {
        return $this->tanggal_kadaluarsa;
    }

    public function setExpiredDateAttribute($value)
    {
        $this->attributes['tanggal_kadaluarsa'] = $value;
    }

    public function getImageAttribute()
    {
        return $this->gambar;
    }

    public function setImageAttribute($value)
    {
        $this->attributes['gambar'] = $value;
    }
}
