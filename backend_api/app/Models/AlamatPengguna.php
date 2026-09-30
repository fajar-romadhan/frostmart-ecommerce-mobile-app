<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlamatPengguna extends Model
{
    protected $table = 'alamat_pengguna';

    protected $fillable = [
        'pengguna_id',
        'label',
        'nama_penerima',
        'telepon_penerima',
        'alamat_lengkap',
        'latitude',
        'longitude',
        'is_utama'
    ];

    protected $casts = [
        'is_utama' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function pengguna()
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }
}
