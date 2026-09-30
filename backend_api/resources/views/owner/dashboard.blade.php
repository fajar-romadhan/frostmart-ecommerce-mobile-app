@extends('layouts.admin')

@section('title', 'Dashboard Owner')
@section('header_title', 'Dashboard Panel Owner (Keuangan & Bisnis)')

@section('content')
<div class="card" style="background: #0F172A; border-radius: 18px; padding: 22px; color: #F8FAFC; margin-bottom: 25px; border: 1px solid #1E293B; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
        <div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 11px; font-weight: 800; color: #94A3B8; letter-spacing: 1px;">GRAFIK OMSET PENJUALAN</span>
            </div>
            <div style="font-size: 28px; font-weight: 900; color: #F8FAFC; margin-top: 4px; letter-spacing: 0.5px;">
                Rp {{ number_format($totalCompletedSales, 0, ',', '.') }}
            </div>
            <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                📈 Trend Omzet Realtime • Della Frozen Mart
            </div>
        </div>

        <div style="display: flex; gap: 6px; background: #1E293B; padding: 4px; border-radius: 12px;">
            <button type="button" class="crypto-pill-btn active" style="background: #10B981; color: #FFF; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer;">1H (Hari)</button>
            <button type="button" class="crypto-pill-btn" style="background: transparent; color: #94A3B8; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer;">1M (Minggu)</button>
            <button type="button" class="crypto-pill-btn" style="background: transparent; color: #94A3B8; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer;">1B (Bulan)</button>
        </div>
    </div>

    <!-- Crypto Bar Chart Visualizer Grid -->
    <div style="display: flex; align-items: flex-end; height: 110px; gap: 12px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05);">
        @php
            $maxMonthly = $monthlySales->max('total') ?: 1;
        @endphp
        @forelse($monthlySales as $sale)
            @php
                $pct = max(15, min(100, ($sale->total / $maxMonthly) * 100));
            @endphp
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; cursor: pointer;" title="{{ date('F Y', strtotime($sale->month . '-01')) }}: Rp {{ number_format($sale->total, 0, ',', '.') }}">
                <div style="width: 100%; max-width: 32px; background: #1E293B; height: 85px; border-radius: 8px; display: flex; align-items: flex-end; overflow: hidden;">
                    <div style="width: 100%; height: {{ $pct }}%; background: linear-gradient(180deg, #34D399 0%, #059669 100%); border-radius: 8px; transition: height 0.3s ease;"></div>
                </div>
                <span style="font-size: 10px; color: #94A3B8; font-weight: 600; margin-top: 6px;">{{ date('M', strtotime($sale->month . '-01')) }}</span>
            </div>
        @empty
            <div style="width: 100%; text-align: center; color: #64748B; font-size: 12px; align-self: center;">Belum ada data omset grafik.</div>
        @endforelse
    </div>
</div>

<div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 25px;">
    <div class="stat-card" style="border-left: 4px solid var(--primary);">
        <h3>Total Produk</h3>
        <div class="value">{{ $totalProducts }}</div>
    </div>

    <div class="stat-card" style="border-left: 4px solid var(--success); background-color: rgba(39, 174, 96, 0.02);">
        <h3>Omset Penjualan Selesai</h3>
        <div class="value" style="color: var(--success); font-size: 20px;">
            Rp {{ number_format($totalCompletedSales, 0, ',', '.') }}
        </div>
    </div>

    <div class="stat-card" style="border-left: 4px solid #D97706; background-color: #FFFBEB;">
        <h3 style="color: #92400E;">🎁 Poin Loyalti Diberikan</h3>
        <div class="value" style="color: #D97706; font-size: 20px;">
            +{{ number_format($totalPointsIssued, 0, ',', '.') }} <span style="font-size: 13px; font-weight: normal; color: #B45309;">Poin</span>
        </div>
        <div style="font-size: 11px; color: #B45309; margin-top: 4px;">
            Ditukar Hadiah: <strong>{{ number_format($totalPointsRedeemed, 0, ',', '.') }} Poin</strong>
        </div>
    </div>

    <div class="stat-card" style="border-left: 4px solid #059669; background-color: #ECFDF5;">
        <h3 style="color: #065F46;">🏆 Klaim Hadiah Produk</h3>
        <div class="value" style="color: #059669; font-size: 20px;">
            {{ number_format($totalRewardClaimsCount, 0, ',', '.') }} <span style="font-size: 13px; font-weight: normal; color: #047857;">Transaksi</span>
        </div>
        <div style="font-size: 11px; color: #047857; margin-top: 4px;">
            Penukaran Poin Gratis di Toko
        </div>
    </div>
</div>

<div style="display: flex; gap: 30px; flex-wrap: wrap;">
    <!-- Left Column: Sales trend list -->
    <div style="flex: 1; min-width: 280px;">
        <div class="card">
            <div class="card-header">
                <h3>Tren Omset Penjualan Bulanan</h3>
            </div>
            <div class="card-body" style="padding: 15px;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Bulan</th>
                            <th style="text-align: right;">Total Omset</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($monthlySales as $sale)
                            <tr>
                                <td>{{ date('F Y', strtotime($sale->month . '-01')) }}</td>
                                <td style="text-align: right; color: var(--success); font-weight: bold;">
                                    Rp {{ number_format($sale->total, 0, ',', '.') }}
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="2" style="text-align: center; color: var(--text-muted);">Belum ada data omset bulanan.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Right Column: Recent orders (Read-only) -->
    <div style="flex: 2; min-width: 350px;">
        <div class="card">
            <div class="card-header">
                <h3>Pesanan Terbaru</h3>
                <a href="{{ route('owner.orders.index') }}" class="btn btn-secondary" style="padding: 5px 12px; font-size: 12px;">Semua Pesanan</a>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Pelanggan</th>
                                <th>Tanggal</th>
                                <th>Total Belanja</th>
                                <th>Status Order</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($recentOrders as $order)
                                @php
                                    $isPurePoint = strtolower($order->payment_method ?? '') === 'poin' ||
                                        ($order->total_amount == 0 && $order->delivery_method === 'ambil_toko');
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
                                            <span style="color: #059669; font-weight: bold;">Rp 0 <small>(Tukar Poin)</small></span>
                                        @else
                                            Rp {{ number_format($order->total_amount, 0, ',', '.') }}
                                            @if($isMixedPoint)
                                                <br><small style="color: #7C3AED;">🎁 +{{ $order->points_used }} poin</small>
                                            @endif
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
                                            Lihat
                                        </a>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" style="text-align: center; color: var(--text-muted);">Belum ada data pesanan masuk.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Log Aktivitas -->
<div class="card" style="margin-top: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; background: #FAFDFB; border-bottom: 1px solid var(--border-light); padding: 15px 20px;">
        <div style="display: flex; align-items: center; gap: 10px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: var(--secondary);">👣 Log Aktivitas</h3>
        </div>
        <span style="font-size: 11px; color: var(--text-muted);">Memantau seluruh aktivitas petugas admin secara rinci</span>
    </div>
    <div class="card-body" style="padding: 0;">
        <div class="table-responsive">
            <table class="table" style="margin: 0;">
                <thead>
                    <tr style="background: var(--background);">
                        <th style="width: 50px; text-align: center;">No</th>
                        <th>Nama Admin</th>
                        <th>Peran</th>
                        <th>Aktivitas / Aksi</th>
                        <th>Rincian Keterangan</th>
                        <th style="text-align: right;">Waktu & Tanggal</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($activityLogs as $index => $log)
                        <tr>
                            <td style="text-align: center;">{{ $index + 1 }}</td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-light); color: var(--primary); font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 12px;">
                                        {{ strtoupper(substr($log->user_name, 0, 1)) }}
                                    </div>
                                    <strong style="color: var(--secondary);">{{ $log->user_name }}</strong>
                                </div>
                            </td>
                            <td>
                                <span class="badge badge-info" style="font-size: 10px; text-transform: uppercase;">{{ $log->user_role }}</span>
                            </td>
                            <td>
                                <span class="badge badge-amber" style="font-size: 10px; text-transform: uppercase; font-weight: 700;">{{ $log->action }}</span>
                            </td>
                            <td style="color: var(--text-secondary); font-size: 13px;">{{ $log->description }}</td>
                            <td style="text-align: right; color: var(--text-muted); font-size: 12px; font-weight: 600;">
                                {{ date('d M Y • H:i', strtotime($log->created_at)) }} WIB
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 25px;">Belum ada catatan log aktivitas admin.</td>
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
    // Realtime Auto-Sync Dashboard Owner setiap 5 detik
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(res => res.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const elementsToSync = [
                        '.stats-grid',
                        '.table-responsive'
                    ];
                    elementsToSync.forEach(selector => {
                        const newEl = doc.querySelector(selector);
                        const curEl = document.querySelector(selector);
                        if (newEl && curEl) {
                            curEl.innerHTML = newEl.innerHTML;
                        }
                    });
                })
                .catch(err => console.log('Realtime owner dashboard sync error:', err));
        }
    }, 5000);
</script>
@endsection
