@extends('layouts.admin')

@section('title', 'Laporan Inventaris Stok - Owner')
@section('header_title', 'Laporan Stok & Inventaris Toko')

@section('content')
<div style="display: flex; gap: 30px; flex-wrap: wrap;">
    <!-- Left Column: Stocks -->
    <div style="flex: 2; min-width: 350px; display: flex; flex-direction: column; gap: 30px;">
        <!-- Warnings -->
        @if($lowStockProducts->count() > 0)
            <div class="card" style="border-left: 4px solid var(--danger);">
                <div class="card-header" style="background-color: rgba(231, 76, 60, 0.05); display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="color: var(--danger);">⚠️ Peringatan Stok Menipis atau Habis</h3>
                    <button onclick="window.print()" class="btn btn-secondary" style="padding: 5px 12px; font-size: 12px;">Cetak Laporan</button>
                </div>
                <div class="card-body" style="padding: 15px;">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Kode</th>
                                    <th>Nama Produk</th>
                                    <th>Stok</th>
                                    <th>Stok Minimum</th>
                                    <th>Satuan</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($lowStockProducts as $product)
                                    <tr style="background-color: rgba(231, 76, 60, 0.02);">
                                        <td><code>{{ $product->product_code }}</code></td>
                                        <td><strong>{{ $product->name }}</strong></td>
                                        <td><span style="color: var(--danger); font-weight: 700;">{{ $product->stock }}</span></td>
                                        <td>{{ $product->minimum_stock }}</td>
                                        <td>{{ $product->unit }}</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        @endif

        <!-- All Stock levels -->
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3>Tingkat Persediaan Seluruh Produk</h3>
                @if($lowStockProducts->count() == 0)
                    <button onclick="window.print()" class="btn btn-secondary" style="padding: 5px 12px; font-size: 12px;">Cetak Laporan</button>
                @endif
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama Produk</th>
                                <th>Kategori</th>
                                <th>Harga Jual</th>
                                <th>Stok Saat Ini</th>
                                <th>Satuan</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($products as $product)
                                <tr>
                                    <td><code>{{ $product->product_code }}</code></td>
                                    <td>{{ $product->name }}</td>
                                    <td>{{ $product->category->name }}</td>
                                    <td>Rp {{ number_format($product->price, 0, ',', '.') }}</td>
                                    <td>
                                        <span class="{{ $product->stock <= $product->minimum_stock ? 'badge badge-danger' : 'badge badge-success' }}" style="font-weight: bold; padding: 4px 8px; border-radius: 8px;">
                                            {{ $product->stock }}
                                        </span>
                                    </td>
                                    <td>{{ $product->unit }}</td>
                                    <td>
                                        <span class="badge {{ $product->status === 'active' ? 'badge-success' : 'badge-danger' }}">
                                            {{ $product->status === 'active' ? 'Aktif' : 'Non-aktif' }}
                                        </span>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Right Column: Top Sellers -->
    <div style="flex: 1; min-width: 280px;">
        <div class="card">
            <div class="card-header">
                <h3>Top 10 Produk Terlaris</h3>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nama Produk</th>
                                <th style="text-align: right;">Total Terjual</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($bestSellers as $seller)
                                <tr>
                                    <td><strong>{{ $seller->product_name }}</strong></td>
                                    <td style="text-align: right; color: var(--primary); font-weight: 700;">{{ $seller->total_sold }} Qty</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="2" style="text-align: center; color: var(--text-muted);">Belum ada data penjualan selesai.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    // Realtime Auto-Sync Laporan Stok Owner setiap 5 detik
    let isPrinting = false;
    window.onbeforeprint = () => { isPrinting = true; };
    window.onafterprint = () => { isPrinting = false; };

    setInterval(() => {
        if (!isPrinting && document.visibilityState === 'visible') {
            fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(res => res.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const tables = document.querySelectorAll('.table-responsive');
                    const newTables = doc.querySelectorAll('.table-responsive');
                    tables.forEach((t, i) => {
                        if (newTables[i]) {
                            t.innerHTML = newTables[i].innerHTML;
                        }
                    });
                })
                .catch(err => console.log('Realtime stock report sync error:', err));
        }
    }, 5000);
</script>
@endsection
