@extends('layouts.admin')

@section('title', 'Barang Masuk')
@section('header_title', 'Kelola Barang Masuk')

@section('content')
<div class="card">
    <div class="card-header">
        <h3>Riwayat Barang Masuk (Restok)</h3>
        <a href="{{ route('admin.stock-ins.create') }}" class="btn btn-primary">
            Catat Barang Masuk
        </a>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Tanggal Masuk</th>
                        <th>Kode Produk</th>
                        <th>Nama Produk</th>
                        <th>Supplier</th>
                        <th>Jumlah Masuk</th>
                        <th>Catatan</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($stockIns as $stockIn)
                        <tr>
                            <td>{{ date('d-m-Y', strtotime($stockIn->purchase_date)) }}</td>
                            <td><code>{{ $stockIn->product ? $stockIn->product->product_code : '-' }}</code></td>
                            <td><strong>{{ $stockIn->product ? $stockIn->product->name : 'Produk Dihapus' }}</strong></td>
                            <td>{{ $stockIn->supplier_name }}</td>
                            <td><span style="color: var(--success); font-weight: 600;">+{{ $stockIn->quantity }}</span></td>
                            <td>{{ $stockIn->note ?? '-' }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" style="text-align: center; color: var(--text-muted);">Belum ada riwayat barang masuk.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="pagination-wrapper">
            {{ $stockIns->links() }}
        </div>
    </div>
</div>
@endsection
