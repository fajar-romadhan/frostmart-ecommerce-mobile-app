<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'pengguna';

    protected $guarded = [];

    protected $hidden = [
        'kata_sandi',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'kata_sandi' => 'hashed',
        ];
    }

    public function toArray()
    {
        $array = [
            'id' => $this->id,
            'name' => $this->nama,
            'email' => $this->email,
            'nik' => $this->nik,
            'ktp_photo' => $this->ktp_photo,
            'is_ktp_verified' => $this->is_ktp_verified,
            'role' => $this->peran,
            'phone' => $this->telepon,
            'address' => $this->alamat,
            'profile_photo' => $this->profile_photo_url,
            'plat_kendaraan' => $this->plat_kendaraan,
            'jenis_kendaraan' => $this->jenis_kendaraan,
            'total_points' => (int) ($this->total_poin ?? 0),
            'latitude' => $this->latitude ? (float) $this->latitude : null,
            'longitude' => $this->longitude ? (float) $this->longitude : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        // Include loaded relations
        if ($this->relationLoaded('orders')) {
            $array['orders'] = $this->orders;
        }
        if ($this->relationLoaded('carts')) {
            $array['carts'] = $this->carts;
        }
        if ($this->relationLoaded('notifications')) {
            $array['notifications'] = $this->notifications;
        }

        return $array;
    }

    public function getRoleAttribute()
    {
        return $this->peran;
    }

    public function setRoleAttribute($value)
    {
        $this->attributes['peran'] = $value;
    }

    public function getNameAttribute()
    {
        return $this->nama;
    }

    public function setNameAttribute($value)
    {
        $this->attributes['nama'] = $value;
    }

    public function getPhoneAttribute()
    {
        return $this->telepon;
    }

    public function setPhoneAttribute($value)
    {
        $this->attributes['telepon'] = $value;
    }

    public function getAddressAttribute()
    {
        return $this->alamat;
    }

    public function setAddressAttribute($value)
    {
        $this->attributes['alamat'] = $value;
    }

    public function getAuthPassword()
    {
        return $this->kata_sandi;
    }

    public function getPasswordAttribute()
    {
        return $this->kata_sandi;
    }

    public function setPasswordAttribute($value)
    {
        $this->attributes['kata_sandi'] = $value;
    }

    public function getKtpPhotoAttribute()
    {
        return $this->foto_ktp ? url('storage/' . $this->foto_ktp) : null;
    }

    public function setKtpPhotoAttribute($value)
    {
        $this->attributes['foto_ktp'] = $value;
    }

    public function getProfilePhotoUrlAttribute()
    {
        return $this->foto_profil ? url('storage/' . $this->foto_profil) : null;
    }

    public function getIsKtpVerifiedAttribute()
    {
        return (bool)($this->attributes['is_ktp_verified'] ?? false);
    }

    public function setIsKtpVerifiedAttribute($value)
    {
        $this->attributes['is_ktp_verified'] = (bool)$value;
    }

    public function getTotalPointsAttribute()
    {
        return (int) ($this->attributes['total_poin'] ?? 0);
    }

    public function setTotalPointsAttribute($value)
    {
        $this->attributes['total_poin'] = (int) $value;
    }

    public function pointHistories()
    {
        return $this->hasMany(RiwayatPoin::class, 'pengguna_id')->orderBy('id', 'desc');
    }

    public function orders()
    {
        return $this->hasMany(Pesanan::class, 'pengguna_id');
    }

    public function carts()
    {
        return $this->hasMany(Keranjang::class, 'pengguna_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notifikasi::class, 'pengguna_id');
    }
}
