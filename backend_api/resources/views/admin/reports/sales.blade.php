@extends('layouts.admin')

@section('title', 'Laporan Penjualan')
@section('header_title', 'Laporan Penjualan Toko')

@section('content')
<div class="card">
    <div class="card-header" style="flex-wrap: wrap; gap: 15px;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <h3 style="margin: 0;">Filter Laporan Penjualan</h3>
            <div style="display: flex; align-items: center; gap: 6px; background: #ECFDF5; padding: 4px 10px; border-radius: 20px; border: 1px solid #10B981;">
                <span style="display: inline-block; width: 8px; height: 8px; background-color: #10B981; border-radius: 50%; box-shadow: 0 0 8px #10B981;"></span>
                <span style="font-size: 11px; font-weight: 700; color: #065F46;">Live Real-Time Sync</span>
            </div>
        </div>
        <form action="{{ route('admin.reports.sales') }}" method="GET" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <select name="filter" id="filter" class="form-control" style="width: 180px;" onchange="toggleCustomDate(this.value)">
                <option value="daily" {{ $filter === 'daily' ? 'selected' : '' }}>Hari Ini</option>
                <option value="weekly" {{ $filter === 'weekly' ? 'selected' : '' }}>Minggu Ini</option>
                <option value="monthly" {{ $filter === 'monthly' ? 'selected' : '' }}>Bulan Ini</option>
                <option value="custom" {{ $filter === 'custom' ? 'selected' : '' }}>Custom Tanggal</option>
            </select>

            <div id="custom-date-inputs" style="display: {{ $filter === 'custom' ? 'flex' : 'none' }}; gap: 8px; align-items: center;">
                <input type="date" name="start_date" class="form-control" value="{{ $startDate }}" style="width: 150px;">
                <span>s/d</span>
                <input type="date" name="end_date" class="form-control" value="{{ $endDate }}" style="width: 150px;">
            </div>

            <button type="submit" class="btn btn-primary">Tampilkan</button>
        </form>
    </div>
    <div class="card-body">
        <div class="stats-grid" style="margin-bottom: 20px;">
            <div class="stat-card" style="padding: 15px;">
                <h3 style="margin-bottom: 5px;">Total Pesanan Selesai</h3>
                <div class="value" style="font-size: 24px;">{{ $totalOrders }}</div>
            </div>
            <div class="stat-card" style="padding: 15px; border-left: 4px solid var(--success);">
                <h3 style="margin-bottom: 5px;">Total Nilai Penjualan</h3>
                <div class="value" style="font-size: 24px; color: var(--success);">
                    Rp {{ number_format($totalSales, 0, ',', '.') }}
                </div>
            </div>
        </div>

        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Kode Pesanan</th>
                        <th>Nama Pelanggan</th>
                        <th>Tanggal Transaksi</th>
                        <th>Metode Bayar</th>
                        <th>Metode Kirim</th>
                        <th>Total Penjualan</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($orders as $order)
                        @php
                            // Pure point order: metode = 'poin' & total = 0 → Admin selesaikan
                            $isPurePoint = strtolower($order->payment_method ?? '') === 'poin' ||
                                ($order->total_amount == 0 && $order->delivery_method === 'ambil_toko');
                            // Mixed order: ada poin digunakan tapi tetap bayar reguler
                            $isMixedPoint = !$isPurePoint && ($order->points_used ?? 0) > 0;
                            $isPointOrder = $isPurePoint || $isMixedPoint;
                        @endphp
                        <tr style="{{ $isPurePoint ? 'background-color: #F0FDF4;' : ($isMixedPoint ? 'background-color: #EFF6FF;' : '') }}">
                            <td>
                                <strong>{{ $order->order_code }}</strong>
                                @if($isPurePoint)
                                    <br><span class="badge" style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: #FFF; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-top: 3px; display: inline-block;">🎁 CLAIM POINT</span>
                                @elseif($isMixedPoint)
                                    <br><span class="badge" style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: #FFF; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-top: 3px; display: inline-block;">🎁+🛒 POIN+BELANJA</span>
                                @endif
                            </td>
                            <td>{{ $order->user->name }}</td>
                            <td>{{ date('d-m-Y', strtotime($order->order_date)) }}</td>
                            <td>
                                @if($isPurePoint)
                                    <span class="badge" style="background-color: #D1FAE5; color: #065F46; font-weight: bold; border: 1px solid #10B981;">🎁 KLAIM POIN</span>
                                @elseif($isMixedPoint)
                                    <span class="badge" style="background-color: #DBEAFE; color: #1E40AF; font-weight: bold; border: 1px solid #3B82F6;">🎁 {{ $order->payment_method }} + Poin</span>
                                @else
                                    <span class="badge badge-info">{{ $order->payment_method }}</span>
                                @endif
                            </td>
                            <td>{{ $order->delivery_method === 'ambil_toko' ? 'Ambil Toko' : 'Antar Alamat' }}</td>
                            <td style="color: var(--success); font-weight: 600;">
                                @if($isPurePoint)
                                    <span style="color: #059669; font-weight: bold;">Rp 0 <small>(Tukar 10 Poin)</small></span>
                                @else
                                    Rp {{ number_format($order->total_amount, 0, ',', '.') }}
                                    @if($isMixedPoint)
                                        <br><small style="color: #7C3AED;">🎁 +{{ $order->points_used }} poin ditukar</small>
                                    @endif
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" style="text-align: center; color: var(--text-muted);">Tidak ada transaksi penjualan selesai dalam periode terpilih.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    function toggleCustomDate(value) {
        const inputs = document.getElementById('custom-date-inputs');
        if (value === 'custom') {
            inputs.style.display = 'flex';
        } else {
            inputs.style.display = 'none';
        }
    }

    // Realtime Auto-Sync Laporan Penjualan Admin setiap 5 detik
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(res => res.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newStats = doc.querySelector('.stats-grid');
                    const newTable = doc.querySelector('.table-responsive');
                    if (newStats && document.querySelector('.stats-grid')) {
                        document.querySelector('.stats-grid').innerHTML = newStats.innerHTML;
                    }
                    if (newTable && document.querySelector('.table-responsive')) {
                        document.querySelector('.table-responsive').innerHTML = newTable.innerHTML;
                    }
                })
                .catch(err => console.log('Realtime admin sales report sync error:', err));
        }
    }, 5000);
</script>
@endsection
