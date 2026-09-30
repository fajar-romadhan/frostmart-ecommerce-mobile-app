@extends('layouts.admin')

@section('title', 'Edit Produk')
@section('header_title', 'Edit Produk')

@section('content')
<div class="card" style="max-width: 800px; margin: 0 auto;">
    <div class="card-header">
        <h3>Edit Form Produk</h3>
        <a href="{{ route('admin.products.index') }}" class="btn btn-secondary" style="padding: 5px 12px; font-size: 12px;">Kembali</a>
    </div>
    <div class="card-body">
        <form action="{{ route('admin.products.update', $product->id) }}" method="POST" enctype="multipart/form-data">
            @csrf
            @method('PUT')
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label for="name">Nama Produk</label>
                    <input type="text" name="name" id="name" class="form-control" value="{{ old('name', $product->name) }}" required>
                    @error('name')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="category_id">Kategori Produk</label>
                    <select name="category_id" id="category_id" class="form-control" required>
                        @foreach($categories as $category)
                            <option value="{{ $category->id }}" {{ old('category_id', $product->category_id) == $category->id ? 'selected' : '' }}>
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
                    <input type="number" name="price" id="price" class="form-control" value="{{ old('price', $product->price) }}" min="0.01" step="0.01" required>
                    @error('price')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="stock">Stok Saat Ini</label>
                    <input type="number" name="stock" id="stock" class="form-control" value="{{ old('stock', $product->stock) }}" min="0" required>
                    @error('stock')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="minimum_stock">Stok Minimum (Warning)</label>
                    <input type="number" name="minimum_stock" id="minimum_stock" class="form-control" value="{{ old('minimum_stock', $product->minimum_stock) }}" min="0" required>
                    @error('minimum_stock')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label for="unit">Satuan</label>
                    <input type="text" name="unit" id="unit" class="form-control" value="{{ old('unit', $product->unit) }}" required>
                    @error('unit')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="expired_date">Tanggal Kedaluwarsa</label>
                    <input type="date" name="expired_date" id="expired_date" class="form-control" value="{{ old('expired_date', $product->expired_date) }}">
                    @error('expired_date')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="status">Status Penjualan</label>
                    <select name="status" id="status" class="form-control" required>
                        <option value="active" {{ old('status', $product->status) == 'active' ? 'selected' : '' }}>Aktif</option>
                        <option value="inactive" {{ old('status', $product->status) == 'inactive' ? 'selected' : '' }}>Non-aktif</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label for="description">Deskripsi</label>
                <textarea name="description" id="description" class="form-control">{{ old('description', $product->description) }}</textarea>
            </div>

            <div class="form-group" style="display: flex; gap: 15px; align-items: center;">
                @if($product->image_url)
                    <div>
                        <span style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 5px;">Foto Saat Ini:</span>
                        <img src="{{ $product->image_url }}" alt="{{ $product->name }}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);">
                    </div>
                @endif
                <div style="flex: 1;">
                    <label for="image">Ganti Foto Produk (Opsional)</label>
                    <input type="file" name="image" id="image" class="form-control" accept="image/*">
                    @error('image')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 20px; padding: 12px;">
                Perbarui Produk
            </button>
        </form>
    </div>
</div>
@endsection
