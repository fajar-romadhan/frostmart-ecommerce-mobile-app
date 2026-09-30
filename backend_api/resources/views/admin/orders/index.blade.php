@extends('layouts.admin')

@section('title', 'Daftar Pesanan')
@section('header_title', 'Kelola Pesanan Pelanggan')

@section('content')
<div class="card">
    <div class="card-header" style="flex-wrap: wrap; gap: 15px;">
        <h3>Daftar Transaksi Pesanan</h3>
        
        <!-- Filter Status -->
        <div style="display: flex; gap: 10px; align-items: center;">
            <form action="{{ route('admin.orders.index') }}" method="GET" style="display: flex; gap: 8px;">
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
                    <a href="{{ route('admin.orders.index') }}" class="btn btn-secondary" style="padding: 8px 15px;">Reset</a>
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
                            $isPoint = strtolower($order->payment_method) === 'poin' || $order->points_used > 0;
                        @endphp
                        <tr style="{{ $isPoint ? 'background-color: #F0FDF4;' : '' }}">
                            <td>
                                <strong>{{ $order->order_code }}</strong>
                                @if($isPoint)
                                    <div><span class="badge" style="background: linear-gradient(135deg, #059669, #10B981); color: #fff; font-size: 10px; font-weight: bold; padding: 2px 6px;">🎁 CLAIM POINT</span></div>
                                @endif
                            </td>
                            <td>{{ $order->user->name }}</td>
                            <td>{{ date('d-m-Y', strtotime($order->order_date)) }}</td>
                            <td style="{{ $isPoint ? 'color: #059669; font-weight: bold;' : '' }}">
                                {{ $isPoint ? 'Rp 0 (Tukar 10 Poin)' : 'Rp ' . number_format($order->total_amount, 0, ',', '.') }}
                            </td>
                            <td>
                                <span class="badge badge-info" style="background-color: #E2E8F0; color: var(--navy);">
                                    {{ $order->delivery_method === 'ambil_toko' ? 'Ambil Toko' : 'Antar Alamat' }}
                                </span>
                            </td>
                            <td>
                                <span class="badge {{ $isPoint ? 'badge-success' : 'badge-info' }}" style="{{ $isPoint ? 'background-color: #DCFCE7; color: #059669; font-weight: bold; border: 1px solid #86EFAC;' : '' }}">
                                    {{ $isPoint ? '🎁 KLAIM POIN' : $order->payment_method }}
                                </span>
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
                                <a href="{{ route('admin.orders.show', $order->id) }}" class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;">
                                    Detail / Aksi
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
    // Realtime Auto-Sync Daftar Pesanan Admin setiap 4 detik
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
                .catch(err => console.log('Realtime admin orders sync error:', err));
        }
    }, 4000);
</script>
@endsection
