<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CabangToko extends Model
{
    protected $table = 'cabang_toko';

    protected $fillable = [
        'nama',
        'alamat',
        'latitude',
        'longitude',
        'telepon'
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];
}
