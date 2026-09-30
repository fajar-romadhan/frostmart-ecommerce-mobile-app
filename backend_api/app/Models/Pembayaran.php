<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pembayaran extends Model
{
    protected $table = 'pembayaran';

    protected $guarded = [];

    protected $appends = ['payment_proof_url'];

    public function toArray()
    {
        $array = [
            'id' => $this->id,
            'order_id' => $this->pesanan_id,
            'payment_method' => $this->metode_pembayaran,
            'payment_proof' => $this->bukti_pembayaran,
            'payment_proof_url' => $this->payment_proof_url,
            'payment_status' => $this->status_pembayaran,
            'confirmed_by' => $this->dikonfirmasi_oleh,
            'confirmed_at' => $this->dikonfirmasi_pada,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if ($this->relationLoaded('order')) {
            $array['order'] = $this->order;
        }
        if ($this->relationLoaded('confirmedBy')) {
            $array['confirmed_by_user'] = $this->confirmedBy;
        }

        return $array;
    }

    public function order()
    {
        return $this->belongsTo(Pesanan::class, 'pesanan_id');
    }

    public function confirmedBy()
    {
        return $this->belongsTo(User::class, 'dikonfirmasi_oleh');
    }

    public function getPaymentProofUrlAttribute()
    {
        if ($this->bukti_pembayaran) {
            return 'storage/' . $this->bukti_pembayaran;
        }
        return null;
    }

    public function getOrderIdAttribute()
    {
        return $this->pesanan_id;
    }

    public function setOrderIdAttribute($value)
    {
        $this->attributes['pesanan_id'] = $value;
    }

    public function getPaymentMethodAttribute()
    {
        return $this->metode_pembayaran;
    }

    public function setPaymentMethodAttribute($value)
    {
        $this->attributes['metode_pembayaran'] = $value;
    }

    public function getPaymentProofAttribute()
    {
        return $this->bukti_pembayaran;
    }

    public function setPaymentProofAttribute($value)
    {
        $this->attributes['bukti_pembayaran'] = $value;
    }

    public function getPaymentStatusAttribute()
    {
        return $this->status_pembayaran;
    }

    public function setPaymentStatusAttribute($value)
    {
        $this->attributes['status_pembayaran'] = $value;
    }

    public function getConfirmedByAttribute()
    {
        return $this->dikonfirmasi_oleh;
    }

    public function setConfirmedByAttribute($value)
    {
        $this->attributes['dikonfirmasi_oleh'] = $value;
    }

    public function getConfirmedAtAttribute()
    {
        return $this->dikonfirmasi_pada;
    }

    public function setConfirmedAtAttribute($value)
    {
        $this->attributes['dikonfirmasi_pada'] = $value;
    }
}
