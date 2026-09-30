@extends('layouts.admin')

@section('title', 'Dashboard Admin')
@section('header_title', 'Dashboard Panel Admin')

@section('content')
<div class="stats-grid">
    <div class="stat-card">
        <h3>Total Produk</h3>
        <div class="value">{{ $totalProducts }}</div>
    </div>
    
    <div class="stat-card">
        <h3>Kategori</h3>
        <div class="value">{{ $totalCategories }}</div>
    </div>

    <div class="stat-card" style="border-left: 4px solid var(--warning);">
        <h3>Pesanan Pending</h3>
        <div class="value" style="color: var(--warning);">{{ $totalPendingOrders }}</div>
    </div>

    <div class="stat-card" style="border-left: 4px solid var(--success);">
        <h3>Total Pendapatan</h3>
        <div class="value" style="color: var(--success); font-size: 20px;">
            Rp {{ number_format($totalCompletedSales, 0, ',', '.') }}
        </div>
    </div>
</div>

@if($lowStockCount > 0)
    <div class="alert alert-danger" style="display: flex; justify-content: space-between; align-items: center;">
        <span><strong>Peringatan!</strong> Ada {{ $lowStockCount }} produk yang stoknya menipis atau habis.</span>
        <a href="{{ route('admin.reports.stocks') }}" class="btn btn-danger" style="padding: 5px 12px; font-size: 12px;">Lihat Detail</a>
    </div>
@endif

<div class="card">
    <div class="card-header">
        <h3>Pesanan Terbaru</h3>
        <a href="{{ route('admin.orders.index') }}" class="btn btn-secondary" style="padding: 5px 12px; font-size: 12px;">Semua Pesanan</a>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Kode Pesanan</th>
                        <th>Pelanggan</th>
                        <th>Tanggal</th>
                        <th>Total Amount</th>
                        <th>Metode Bayar</th>
                        <th>Status Pesanan</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($recentOrders as $order)
                        <tr>
                            <td><strong>{{ $order->order_code }}</strong></td>
                            <td>{{ $order->user->name }}</td>
                            <td>{{ date('d-m-Y', strtotime($order->order_date)) }}</td>
                            <td>Rp {{ number_format($order->total_amount, 0, ',', '.') }}</td>
                            <td><span class="badge badge-info">{{ $order->payment_method }}</span></td>
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
                                <a href="{{ route('admin.orders.show', $order->id) }}" class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;">
                                    Detail
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" style="text-align: center; color: var(--text-muted);">Belum ada pesanan masuk.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
