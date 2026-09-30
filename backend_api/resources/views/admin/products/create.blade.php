@extends('layouts.admin')

@section('title', 'Tambah Produk')
@section('header_title', 'Tambah Produk Baru')

@section('content')
<div class="card" style="max-width: 800px; margin: 0 auto;">
    <div class="card-header">
        <h3>Form Produk</h3>
        <a href="{{ route('admin.products.index') }}" class="btn btn-secondary" style="padding: 5px 12px; font-size: 12px;">Kembali</a>
    </div>
    <div class="card-body">
        <form action="{{ route('admin.products.store') }}" method="POST" enctype="multipart/form-data">
            @csrf
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label for="name">Nama Produk</label>
                    <input type="text" name="name" id="name" class="form-control" placeholder="Cth: Kanzler Sosis 500gr" value="{{ old('name') }}" required>
                    @error('name')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="category_id">Kategori Produk</label>
                    <select name="category_id" id="category_id" class="form-control" required>
                        <option value="">-- Pilih Kategori --</option>
                        @foreach($categories as $category)
                            <option value="{{ $category->id }}" {{ old('category_id') == $category->id ? 'selected' : '' }}>
                                {{ $category->name }}
                            </option>
                        @endforeach
                    </select>
                    @error('category_id')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label for="price">Harga Jual (Rp)</label>
                    <input type="number" name="price" id="price" class="form-control" placeholder="Cth: 45000" value="{{ old('price') }}" min="0.01" step="0.01" required>
                    @error('price')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="stock">Stok Awal</label>
                    <input type="number" name="stock" id="stock" class="form-control" placeholder="Cth: 50" value="{{ old('stock') }}" min="0" required>
                    @error('stock')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="minimum_stock">Stok Minimum (Warning)</label>
                    <input type="number" name="minimum_stock" id="minimum_stock" class="form-control" placeholder="Cth: 5" value="{{ old('minimum_stock', 5) }}" min="0" required>
                    @error('minimum_stock')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label for="unit">Satuan</label>
                    <input type="text" name="unit" id="unit" class="form-control" placeholder="Cth: Pcs, Pack, Kg" value="{{ old('unit', 'Pcs') }}" required>
                    @error('unit')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="expired_date">Tanggal Kedaluwarsa</label>
                    <input type="date" name="expired_date" id="expired_date" class="form-control" value="{{ old('expired_date') }}">
                    @error('expired_date')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>
            </div>

            <div class="form-group">
                <label for="description">Deskripsi</label>
                <textarea name="description" id="description" class="form-control" placeholder="Deskripsi lengkap produk...">{{ old('description') }}</textarea>
            </div>

            <div class="form-group">
                <label for="image">Foto Produk</label>
                <input type="file" name="image" id="image" class="form-control" accept="image/*">
                @error('image')
                    <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                @enderror
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 20px; padding: 12px;">
                Simpan Produk
            </button>
        </form>
    </div>
</div>
@endsection
