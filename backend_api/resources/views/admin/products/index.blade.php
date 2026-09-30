@extends('layouts.admin')

@section('title', 'Data Produk')
@section('header_title', 'Kelola Data Produk')

@section('content')
<div class="card">
    <div class="card-header" style="flex-wrap: wrap; gap: 15px;">
        <h3>Daftar Produk</h3>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <form action="{{ route('admin.products.index') }}" method="GET" style="display: flex; gap: 8px;">
                <input type="text" name="search" class="form-control" placeholder="Cari nama / kode..." value="{{ $search }}" style="padding: 8px 15px; width: 220px;">
                <button type="submit" class="btn btn-secondary" style="padding: 8px 15px;">Cari</button>
                @if($search)
                    <a href="{{ route('admin.products.index') }}" class="btn btn-secondary" style="padding: 8px 15px;">Reset</a>
                @endif
            </form>
            <a href="{{ route('admin.products.create') }}" class="btn btn-primary">
                Tambah Produk
            </a>
        </div>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Foto</th>
                        <th>Kode</th>
                        <th>Nama Produk</th>
                        <th>Kategori</th>
                        <th>Harga</th>
                        <th>Stok</th>
                        <th>Unit</th>
                        <th>Status</th>
                        <th style="width: 180px;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($products as $product)
                        <tr>
                            <td>
                                @if($product->image_url)
                                    <img src="{{ $product->image_url }}" alt="{{ $product->name }}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);">
                                @else
                                    <div style="width: 50px; height: 50px; background-color: var(--bg-light); display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 10px; color: var(--text-muted); border: 1px solid var(--border);">No Image</div>
                                @endif
                            </td>
                            <td><code>{{ $product->product_code }}</code></td>
                            <td>
                                <strong>{{ $product->name }}</strong>
                                @if($product->stock <= $product->minimum_stock)
                                    <br><span style="color: var(--danger); font-size: 11px; font-weight: 600;">Stok Menipis!</span>
                                @endif
                            </td>
                            <td>{{ $product->category->name }}</td>
                            <td>Rp {{ number_format($product->price, 0, ',', '.') }}</td>
                            <td>
                                <span class="{{ $product->stock <= $product->minimum_stock ? 'badge badge-danger' : '' }}" style="font-weight: bold;">
                                    {{ $product->stock }}
                                </span>
                            </td>
                            <td>{{ $product->unit }}</td>
                            <td>
                                <span class="badge {{ $product->status === 'active' ? 'badge-success' : 'badge-danger' }}">
                                    {{ $product->status === 'active' ? 'Aktif' : 'Non-aktif' }}
                                </span>
                            </td>
                            <td>
                                <div style="display: flex; gap: 8px;">
                                    <a href="{{ route('admin.products.edit', $product->id) }}" class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;">
                                        Edit
                                    </a>
                                    <form action="{{ route('admin.products.destroy', $product->id) }}" method="POST" onsubmit="return confirm('Apakah Anda yakin ingin menghapus produk ini?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;">
                                            Hapus
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="9" style="text-align: center; color: var(--text-muted);">Belum ada data produk atau produk tidak ditemukan.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="pagination-wrapper">
            {{ $products->appends(['search' => $search])->links() }}
        </div>
    </div>
</div>
@endsection
