@extends('layouts.admin')

@section('title', 'Detail Pesanan #' . $order->order_code)
@section('header_title', 'Detail Pesanan Pelanggan')

@section('content')
<div style="display: flex; gap: 30px; flex-wrap: wrap;">
    <!-- Left Column: Details -->
    <div style="flex: 2; min-width: 350px;">
        <div class="card">
            <div class="card-header">
                <h3>Informasi Pesanan</h3>
                <a href="{{ route('admin.orders.index') }}" class="btn btn-secondary" style="padding: 5px 12px; font-size: 12px;">Kembali</a>
            </div>
            <div class="card-body">
                @php
                    $isPoint = strtolower($order->payment_method) === 'poin' || $order->points_used > 0;
                @endphp

                @if($isPoint)
                    <div style="background-color: #ECFDF5; border: 1.5px solid #10B981; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 14px;">
                        <div style="font-size: 28px;">🎁</div>
                        <div>
                            <h4 style="color: #065F46; margin: 0 0 4px 0; font-weight: 800; font-size: 15px;">PESANAN CLAIM POINT (TUKAR 10 POIN LOYALTI)</h4>
                            <p style="color: #047857; margin: 0; font-size: 13px; line-height: 1.4;">
                                Pelanggan menukarkan <strong>10 Poin Loyalti</strong> untuk mendapatkan produk hadiah gratis (Rp 0). Silakan siapkan produk dalam kondisi beku terbaik dan serahkan kepada pelanggan/kurir.
                            </p>
                        </div>
                    </div>
                @endif

                <table class="table" style="margin-bottom: 20px;">
                    <tr>
                        <th style="width: 200px;">Kode Pesanan</th>
                        <td>
                            <strong>{{ $order->order_code }}</strong>
                            @if($isPoint)
                                <span class="badge" style="background: linear-gradient(135deg, #059669, #10B981); color: #fff; font-size: 10px; font-weight: bold; margin-left: 6px; padding: 2px 6px;">🎁 CLAIM POINT</span>
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
                            <span class="badge {{ $isPoint ? 'badge-success' : 'badge-info' }}" style="{{ $isPoint ? 'background-color: #DCFCE7; color: #059669; font-weight: bold; border: 1px solid #86EFAC;' : '' }}">
                                {{ $isPoint ? '🎁 KLAIM POIN' : $order->payment_method }}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <th>Status Pembayaran</th>
                        <td>
                            <span class="badge {{ $order->payment_status === 'lunas' ? 'badge-success' : 'badge-danger' }}">
                                {{ $order->payment_status === 'lunas' ? 'Lunas / Disetujui' : 'Belum Lunas' }}
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
                            @php
                                $isReward = $detail->is_reward || $detail->subtotal == 0 || stripos($detail->product_name, 'hadiah poin') !== false;
                            @endphp
                            <tr style="{{ $isReward ? 'background-color: #F0FDF4;' : '' }}">
                                <td>
                                    <strong>{{ $detail->product_name }}</strong>
                                    @if($isReward)
                                        <div><span class="badge" style="background-color: #DCFCE7; color: #059669; font-size: 10px; font-weight: bold; border: 1px solid #86EFAC;">🎁 HADIAH 10 POIN</span></div>
                                    @endif
                                </td>
                                <td>{{ $isReward ? 'Rp 0' : 'Rp ' . number_format($detail->price, 0, ',', '.') }}</td>
                                <td>{{ $detail->quantity }}</td>
                                <td style="color: {{ $isReward ? '#059669' : 'var(--navy)' }}; font-weight: bold;">
                                    {{ $isReward ? 'GRATIS' : 'Rp ' . number_format($detail->subtotal, 0, ',', '.') }}
                                </td>
                            </tr>
                        @endforeach
                        @php
                            $subtotalProd = $order->orderDetails->sum('subtotal');
                            $ongkir = $order->ongkos_kirim ?? $order->shipping_fee ?? 0;
                            $isTakeaway = $order->delivery_method === 'ambil_toko';
                            $finalSubtotal = $subtotalProd > 0 ? $subtotalProd : ($order->total_amount - $ongkir);
                        @endphp
                        <tr>
                            <td colspan="3" style="text-align: right; font-weight: bold;">Subtotal Produk:</td>
                            <td style="font-weight: bold; color: var(--navy);">Rp {{ number_format($finalSubtotal, 0, ',', '.') }}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align: right; font-weight: bold;">Ongkos Kirim {{ $isTakeaway ? '(Ambil di Toko)' : '' }}:</td>
                            <td style="font-weight: bold; color: {{ $isTakeaway || $ongkir == 0 ? 'var(--success)' : 'var(--navy)' }};">
                                {{ $isTakeaway || $ongkir == 0 ? 'Gratis (Rp 0)' : 'Rp ' . number_format($ongkir, 0, ',', '.') }}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align: right; font-weight: bold; font-size: 15px;">TOTAL PEMBAYARAN:</td>
                            <td style="font-size: 16px; color: var(--success); font-weight: bold;">Rp {{ number_format($order->total_amount, 0, ',', '.') }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Right Column: Operations / Payment Proof -->
    <div style="flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 30px;">
        <!-- Verification Actions -->
        <div class="card">
            <div class="card-header">
                <h3>Verifikasi / Aksi</h3>
            </div>
            <div class="card-body">
                <!-- 1. Confirmation button (Reduces stock!) -->
                @if(strtolower($order->order_status) === 'menunggu pembayaran' || strtolower($order->order_status) === 'menunggu konfirmasi' || strtolower($order->order_status) === 'menunggu_pembayaran' || strtolower($order->order_status) === 'menunggu_konfirmasi')
                    <div style="margin-bottom: 20px; padding: 15px; background-color: var(--bg-light); border-radius: 10px; border: 1px solid var(--border);">
                        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">
                            Menekan tombol di bawah akan <strong>mengonfirmasi pembayaran</strong>, mengubah status menjadi <strong>Diproses</strong>, dan <strong>mengurangi stok produk secara otomatis</strong>.
                        </p>
                        <form action="{{ route('admin.orders.confirm', $order->id) }}" method="POST">
                            @csrf
                            @method('PUT')
                            <button type="submit" class="btn btn-success" style="width: 100%;">
                                Konfirmasi & Potong Stok
                            </button>
                        </form>
                    </div>
                @endif

                <!-- 2. Status update dropdown -->
                <form action="{{ route('admin.orders.status', $order->id) }}" method="POST" style="margin-bottom: 15px;">
                    @csrf
                    @method('PUT')
                    <div class="form-group">
                        <label for="order_status">Ubah Status Alur</label>
                        <select name="order_status" id="order_status" class="form-control" style="margin-bottom: 10px;">
                            <option value="Diproses" {{ $order->order_status === 'Diproses' ? 'selected' : '' }}>Diproses</option>
                            <option value="Siap Diambil" {{ $order->order_status === 'Siap Diambil' ? 'selected' : '' }}>Siap Diambil</option>
                            <option value="Dikirim" {{ $order->order_status === 'Dikirim' ? 'selected' : '' }}>Dikirim</option>
                            <option value="Selesai" {{ $order->order_status === 'Selesai' ? 'selected' : '' }}>Selesai (Lunas)</option>
                            <option value="Dibatalkan" {{ $order->order_status === 'Dibatalkan' ? 'selected' : '' }}>Batalkan Pesanan (Kembalikan Stok)</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        Update Status
                    </button>
                </form>

                <hr style="border: 0; border-top: 1px solid var(--border); margin: 20px 0;">

                <a href="{{ route('admin.orders.invoice', $order->id) }}" target="_blank" class="btn btn-secondary" style="width: 100%;">
                    Cetak Invoice / Struk
                </a>
            </div>
        </div>

        <!-- Payment Proof View -->
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
                            <a href="{{ $order->payment->payment_proof_url }}" target="_blank" class="btn btn-secondary" style="width: 100%;">Buka Dokumen PDF</a>
                        @else
                            <img src="{{ $order->payment->payment_proof_url }}" alt="Bukti Transfer" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 10px; max-height: 300px; object-fit: contain;">
                            <a href="{{ $order->payment->payment_proof_url }}" target="_blank" class="btn btn-secondary" style="width: 100%;">Perbesar Gambar</a>
                        @endif
                    @else
                        <p style="color: var(--text-muted); font-size: 14px; padding: 20px 0;">Pelanggan belum mengunggah bukti transfer.</p>
                    @endif
                </div>
            </div>
        @endif
    </div>
</div>
@endsection
