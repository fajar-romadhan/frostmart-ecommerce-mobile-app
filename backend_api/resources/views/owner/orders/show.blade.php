@extends('layouts.admin')

@section('title', 'Detail Pesanan #' . $order->order_code)
@section('header_title', 'Detail Pesanan (Read-only)')

@section('content')
<div style="display: flex; gap: 30px; flex-wrap: wrap;">
    <!-- Left Column: Details -->
    <div style="flex: 2; min-width: 350px;">
        <div class="card">
            <div class="card-header">
                <h3>Informasi Pesanan</h3>
                <a href="{{ route('owner.orders.index') }}" class="btn btn-secondary" style="padding: 5px 12px; font-size: 12px;">Kembali</a>
            </div>
            <div class="card-body">
                @php
                    $isPointOrder = strtolower($order->payment_method ?? '') === 'poin' || ($order->points_used ?? 0) > 0 || ($order->total_amount == 0 && $order->delivery_method === 'ambil_toko');
                @endphp

                @if($isPointOrder)
                    <div style="margin-bottom: 20px; padding: 14px 18px; background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 1.5px solid #10B981; border-radius: 12px; display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 24px;">🎁</span>
                        <div>
                            <h4 style="margin: 0; color: #065F46; font-size: 14px; font-weight: bold;">Pesanan Klaim Hadiah Poin Loyalti</h4>
                            <p style="margin: 3px 0 0 0; color: #047857; font-size: 12px; line-height: 1.4;">
                                Pelanggan menggunakan <strong>{{ $order->points_used ?? 10 }} Poin Loyalti</strong> untuk menukarkan produk reward gratis. Total tagihan adalah <strong>Rp 0 (Lunas)</strong>.
                            </p>
                        </div>
                    </div>
                @endif

                <table class="table" style="margin-bottom: 20px;">
                    <tr>
                        <th style="width: 200px;">Kode Pesanan</th>
                        <td>
                            <strong>{{ $order->order_code }}</strong>
                            @if($isPointOrder)
                                <span class="badge" style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: #FFF; font-size: 10px; margin-left: 8px;">🎁 CLAIM POINT</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <th>Pelanggan</th>
                        <td>{{ $order->user->name }} ({{ $order->user->email }})</td>
                    </tr>
                    <tr>
                        <th>Tanggal Order</th>
                        <td>{{ date('d-m-Y', strtotime($order->order_date)) }}</td>
                    </tr>
                    <tr>
                        <th>Metode Pengiriman</th>
                        <td>{{ $order->delivery_method === 'ambil_toko' ? 'Ambil di Toko' : 'Antar ke Alamat' }}</td>
                    </tr>
                    @if($order->delivery_method === 'antar_alamat')
                        <tr>
                            <th>Alamat Pengiriman</th>
                            <td>{{ $order->shipping_address }}</td>
                        </tr>
                    @endif
                    <tr>
                        <th>Metode Pembayaran</th>
                        <td>
                            @if($isPointOrder)
                                <span class="badge" style="background-color: #D1FAE5; color: #065F46; font-weight: bold; border: 1px solid #10B981;">🎁 KLAIM POIN LOYALTI</span>
                            @else
                                <span class="badge badge-info">{{ $order->payment_method }}</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <th>Status Pembayaran</th>
                        <td>
                            <span class="badge {{ $order->payment_status === 'lunas' ? 'badge-success' : 'badge-danger' }}">
                                {{ $order->payment_status === 'lunas' ? 'Lunas' : 'Belum Lunas' }}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <th>Status Alur Pesanan</th>
                        <td>
                            @php
                                $statusClass = 'badge-pending';
                                if (strtolower($order->order_status) === 'selesai') $statusClass = 'badge-success';
                                elseif (strtolower($order->order_status) === 'dibatalkan') $statusClass = 'badge-danger';
                                elseif (in_array(strtolower($order->order_status), ['diproses', 'siap diambil', 'dikirim', 'siap_diambil'])) $statusClass = 'badge-info';
                            @endphp
                            <span class="badge {{ $statusClass }}">{{ $order->order_status }}</span>
                        </td>
                    </tr>
                </table>

                <h4 style="margin: 20px 0 10px 0; color: var(--navy);">Daftar Item Belanja</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nama Produk</th>
                            <th>Harga Satuan</th>
                            <th>Kuantitas</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($order->orderDetails as $detail)
                            <tr>
                                <td>
                                    {{ $detail->product_name }}
                                    @if($detail->is_reward || $isPointOrder)
                                        <br><span class="badge" style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: #FFF; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-top: 3px; display: inline-block;">🎁 HADIAH 10 POIN (GRATIS)</span>
                                    @endif
                                </td>
                                <td>
                                    @if($detail->is_reward || $isPointOrder)
                                        <span style="color: #059669; font-weight: bold;">Rp 0 <small>(Gratis)</small></span>
                                    @else
                                        Rp {{ number_format($detail->price, 0, ',', '.') }}
                                    @endif
                                </td>
                                <td>{{ $detail->quantity }}</td>
                                <td>
                                    @if($detail->is_reward || $isPointOrder)
                                        <strong style="color: #059669;">Rp 0</strong>
                                    @else
                                        <strong>Rp {{ number_format($detail->subtotal, 0, ',', '.') }}</strong>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                        <tr>
                            <td colspan="3" style="text-align: right; font-weight: bold;">TOTAL:</td>
                            <td style="font-size: 16px; color: var(--success); font-weight: bold;">
                                @if($isPointOrder)
                                    <span style="color: #059669;">Rp 0 <small>(Tukar Poin)</small></span>
                                @else
                                    Rp {{ number_format($order->total_amount, 0, ',', '.') }}
                                @endif
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Right Column: Payment Proof -->
    <div style="flex: 1; min-width: 280px;">
        @if($order->payment_method !== 'cod')
            <div class="card">
                <div class="card-header">
                    <h3>Bukti Transfer</h3>
                </div>
                <div class="card-body" style="text-align: center;">
                    @if($order->payment && $order->payment->payment_proof)
                        @if(strtolower(pathinfo($order->payment->payment_proof, PATHINFO_EXTENSION)) === 'pdf')
                            <div style="padding: 20px; background-color: var(--bg-light); border-radius: 10px; border: 1px solid var(--border); margin-bottom: 10px;">
                                <span style="font-size: 32px;">📄</span>
                                <p style="font-size: 13px; font-weight: 600; margin-top: 10px;">Dokumen PDF Bukti Transfer</p>
                            </div>
                            <a href="{{ $order->payment->payment_proof_url }}" target="_blank" class="btn btn-secondary" style="width: 100%;">Buka PDF</a>
                        @else
                            <img src="{{ $order->payment->payment_proof_url }}" alt="Bukti Transfer" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 10px; max-height: 350px; object-fit: contain;">
                            <a href="{{ $order->payment->payment_proof_url }}" target="_blank" class="btn btn-secondary" style="width: 100%;">Perbesar Bukti</a>
                        @endif
                    @else
                        <p style="color: var(--text-muted); font-size: 14px; padding: 20px 0;">Belum ada bukti pembayaran diunggah.</p>
                    @endif
                </div>
            </div>
        @else
            <div class="card">
                <div class="card-header">
                    <h3>Metode COD</h3>
                </div>
                <div class="card-body">
                    <p style="color: var(--text-muted); font-size: 14px;">Transaksi ini menggunakan pembayaran COD (Cash On Delivery) di tempat atau saat pengambilan barang.</p>
                </div>
            </div>
        @endif
    </div>
</div>
@endsection
