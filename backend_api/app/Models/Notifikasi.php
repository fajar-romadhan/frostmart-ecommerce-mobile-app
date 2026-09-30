<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notifikasi extends Model
{
    protected $table = 'notifikasi';

    protected $guarded = [];

    public function toArray()
    {
        $array = [
            'id' => $this->id,
            'user_id' => $this->pengguna_id,
            'title' => $this->judul,
            'message' => $this->pesan,
            'type' => $this->jenis,
            'is_read' => (bool) $this->apakah_dibaca,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if ($this->relationLoaded('user')) {
            $array['user'] = $this->user;
        }

        return $array;
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'pengguna_id');
    }
}
