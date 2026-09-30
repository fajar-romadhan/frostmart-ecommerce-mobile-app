<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kategori extends Model
{
    protected $table = 'kategori';

    protected $guarded = [];

    public function toArray()
    {
        $array = [
            'id' => $this->id,
            'name' => $this->nama,
            'nama' => $this->nama,
            'description' => $this->deskripsi,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if ($this->relationLoaded('produk')) {
            $array['products'] = $this->produk;
        }

        return $array;
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

    public function produk()
    {
        return $this->hasMany(Produk::class, 'kategori_id');
    }

    public function products()
    {
        return $this->produk();
    }
}
