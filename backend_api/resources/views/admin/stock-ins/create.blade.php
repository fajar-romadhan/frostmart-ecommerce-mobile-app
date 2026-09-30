@extends('layouts.admin')

@section('title', 'Catat Barang Masuk')
@section('header_title', 'Catat Barang Masuk')

@section('content')
<div class="card" style="max-width: 700px; margin: 0 auto;">
    <div class="card-header">
        <h3>Form Catat Barang Masuk</h3>
        <a href="{{ route('admin.stock-ins.index') }}" class="btn btn-secondary" style="padding: 5px 12px; font-size: 12px;">Kembali</a>
    </div>
    <div class="card-body">
        <form action="{{ route('admin.stock-ins.store') }}" method="POST">
            @csrf
            
            <div class="form-group">
                <label for="product_id">Pilih Produk</label>
                <select name="product_id" id="product_id" class="form-control" required>
                    <option value="">-- Pilih Produk --</option>
                    @foreach($products as $product)
                        <option value="{{ $product->id }}" {{ old('product_id') == $product->id ? 'selected' : '' }}>
                            {{ $product->product_code }} - {{ $product->name }} (Stok saat ini: {{ $product->stock }})
                        </option>
                    @endforeach
                </select>
                @error('product_id')
                    <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                @enderror
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label for="quantity">Jumlah Masuk</label>
                    <input type="number" name="quantity" id="quantity" class="form-control" placeholder="Cth: 20" value="{{ old('quantity') }}" min="1" required>
                    @error('quantity')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="purchase_date">Tanggal Pembelian</label>
                    <input type="date" name="purchase_date" id="purchase_date" class="form-control" value="{{ old('purchase_date', date('Y-m-d')) }}" required>
                    @error('purchase_date')
                        <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                    @enderror
                </div>
            </div>

            <div class="form-group">
                <label for="supplier_name">Nama Supplier</label>
                <input type="text" name="supplier_name" id="supplier_name" class="form-control" placeholder="Cth: CV. Prima Frozen" value="{{ old('supplier_name') }}" required>
                @error('supplier_name')
                    <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                @enderror
            </div>

            <div class="form-group">
                <label for="note">Catatan Tambahan</label>
                <textarea name="note" id="note" class="form-control" placeholder="Masukkan catatan / nomor faktur (opsional)">{{ old('note') }}</textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 20px; padding: 12px;">
                Simpan & Update Stok
            </button>
        </form>
    </div>
</div>
@endsection
