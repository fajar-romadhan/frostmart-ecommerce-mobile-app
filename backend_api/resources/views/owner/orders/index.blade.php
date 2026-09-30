@extends('layouts.admin')

@section('title', 'Daftar Pesanan - Owner')
@section('header_title', 'Daftar Transaksi Pesanan')

@section('content')
<div class="card">
    <div class="card-header" style="flex-wrap: wrap; gap: 15px;">
        <h3>Daftar Transaksi Pesanan (Read-only)</h3>
        
        <div style="display: flex; gap: 10px; align-items: center;">
            <form action="{{ route('owner.orders.index') }}" method="GET" style="display: flex; gap: 8px;">
                <select name="status" class="form-control" style="padding: 8px 15px; width: 220px;" onchange="this.form.submit()">
                    <option value="">-- Filter Status Pesanan --</option>
                    <option value="Menunggu Pembayaran" {{ $status == 'Menunggu Pembayaran' ? 'selected' : '' }}>Menunggu Pembayaran</option>
                    <option value="Menunggu Konfirmasi" {{ $status == 'Menunggu Konfirmasi' ? 'selected' : '' }}>Menunggu Konfirmasi</option>
                    <option value="Diproses" {{ $status == 'Diproses' ? 'selected' : '' }}>Diproses</option>
                    <option value="Siap Diambil" {{ $status == 'Siap Diambil' ? 'selected' : '' }}>Siap Diambil</option>
                    <option value="Dikirim" {{ $status == 'Dikirim' ? 'selected' : '' }}>Dikirim</option>
                    <option value="Selesai" {{ $status == 'Selesai' ? 'selected' : '' }}>Selesai</option>
                    <option value="Dibatalkan" {{ $status == 'Dibatalkan' ? 'selected' : '' }}>Dibatalkan</option>
                </select>
                @if($status)
                    <a href="{{ route('owner.orders.index') }}" class="btn btn-secondary" style="padding: 8px 15px;">Reset</a>
                @endif
            </form>
        </div>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Kode Pesanan</th>
                        <th>Nama Pelanggan</th>
                        <th>Tanggal Order</th>
                        <th>Total Belanja</th>
                        <th>Metode Kirim</th>
                        <th>Metode Bayar</th>
                        <th>Status Order</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($orders as $order)
                        @php
                            $isPointOrder = strtolower($order->payment_method ?? '') === 'poin' || ($order->points_used ?? 0) > 0 || ($order->total_amount == 0 && $order->delivery_method === 'ambil_toko');
                            $isPurePoint = strtolower($order->payment_method ?? '') === 'poin' ||
                                ($order->total_amount == 0 && $order->delivery_method === 'ambil_toko');
                            $isMixedPoint = !$isPurePoint && ($order->points_used ?? 0) > 0;
                        @endphp
                        <tr style="{{ $isPurePoint ? 'background-color: #F0FDF4;' : ($isMixedPoint ? 'background-color: #EFF6FF;' : '') }}">
                            <td>
                                <strong>{{ $order->order_code }}</strong>
                                @if($isPurePoint)
                                    <br><span class="badge" style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: #FFF; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-top: 3px; display: inline-block;">🎁 CLAIM POINT</span>
                                @elseif($isMixedPoint)
                                    <br><span class="badge" style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: #FFF; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-top: 3px; display: inline-block;">🎁+🛒 POIN+BELANJA</span>
                                @endif
                            </td>
                            <td>{{ $order->user->name }}</td>
                            <td>{{ date('d-m-Y', strtotime($order->order_date)) }}</td>
                            <td>
                                @if($isPurePoint)
                                    <span style="color: #059669; font-weight: bold;">Rp 0 <small>(Tukar 10 Poin)</small></span>
                                @else
                                    Rp {{ number_format($order->total_amount, 0, ',', '.') }}
                                    @if($isMixedPoint)
                                        <br><small style="color: #7C3AED;">🎁 +{{ $order->points_used }} poin ditukar</small>
                                    @endif
                                @endif
                            </td>
                            <td>
                                <span class="badge badge-info" style="background-color: #E2E8F0; color: var(--navy);">
                                    {{ $order->delivery_method === 'ambil_toko' ? 'Ambil Toko' : 'Antar Alamat' }}
                                </span>
                            </td>
                            <td>
                                @if($isPurePoint)
                                    <span class="badge" style="background-color: #D1FAE5; color: #065F46; font-weight: bold; border: 1px solid #10B981;">🎁 KLAIM POIN</span>
                                @elseif($isMixedPoint)
                                    <span class="badge" style="background-color: #DBEAFE; color: #1E40AF; font-weight: bold; border: 1px solid #3B82F6;">🎁 {{ $order->payment_method }} + Poin</span>
                                @else
                                    <span class="badge badge-info">{{ $order->payment_method }}</span>
                                @endif
                            </td>
                            <td>
                                @php
                                    $statusClass = 'badge-pending';
                                    if (strtolower($order->order_status) === 'selesai') $statusClass = 'badge-success';
                                    elseif (strtolower($order->order_status) === 'dibatalkan') $statusClass = 'badge-danger';
                                    elseif (in_array(strtolower($order->order_status), ['diproses', 'siap diambil', 'dikirim', 'siap_diambil'])) $statusClass = 'badge-info';
                                @endphp
                                <span class="badge {{ $statusClass }}">{{ $order->order_status }}</span>
                            </td>
                            <td>
                                <a href="{{ route('owner.orders.show', $order->id) }}" class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;">
                                    Lihat Detail
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" style="text-align: center; color: var(--text-muted);">Belum ada data transaksi pesanan.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="pagination-wrapper">
            {{ $orders->appends(['status' => $status])->links() }}
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    // Realtime Auto-Sync Daftar Pesanan Owner setiap 5 detik
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(res => res.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newTable = doc.querySelector('.table-responsive');
                    const newPagination = doc.querySelector('.pagination-wrapper');
                    if (newTable && document.querySelector('.table-responsive')) {
                        document.querySelector('.table-responsive').innerHTML = newTable.innerHTML;
                    }
                    if (newPagination && document.querySelector('.pagination-wrapper')) {
                        document.querySelector('.pagination-wrapper').innerHTML = newPagination.innerHTML;
                    }
                })
                .catch(err => console.log('Realtime owner orders sync error:', err));
        }
    }, 5000);
</script>
@endsection
