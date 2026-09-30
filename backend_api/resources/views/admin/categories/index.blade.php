@extends('layouts.admin')

@section('title', 'Kategori Produk')
@section('header_title', 'Kelola Kategori Produk')

@section('content')
<div class="card">
    <div class="card-header">
        <h3>Daftar Kategori</h3>
        <a href="{{ route('admin.categories.create') }}" class="btn btn-primary">
            Tambah Kategori
        </a>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nama Kategori</th>
                        <th>Deskripsi</th>
                        <th>Jumlah Produk</th>
                        <th style="width: 200px;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($categories as $category)
                        <tr>
                            <td>{{ $category->id }}</td>
                            <td><strong>{{ $category->name }}</strong></td>
                            <td>{{ $category->description ?? '-' }}</td>
                            <td><span class="badge badge-info">{{ $category->products_count }} Produk</span></td>
                            <td>
                                <div style="display: flex; gap: 8px;">
                                    <a href="{{ route('admin.categories.edit', $category->id) }}" class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;">
                                        Edit
                                    </a>
                                    <form action="{{ route('admin.categories.destroy', $category->id) }}" method="POST" onsubmit="return confirm('Apakah Anda yakin ingin menghapus kategori ini?')">
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
                            <td colspan="5" style="text-align: center; color: var(--text-muted);">Belum ada data kategori.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
