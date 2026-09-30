@extends('layouts.admin')

@section('title', 'Edit Kategori')
@section('header_title', 'Edit Kategori Produk')

@section('content')
<div class="card" style="max-width: 600px; margin: 0 auto;">
    <div class="card-header">
        <h3>Edit Form Kategori</h3>
        <a href="{{ route('admin.categories.index') }}" class="btn btn-secondary" style="padding: 5px 12px; font-size: 12px;">Kembali</a>
    </div>
    <div class="card-body">
        <form action="{{ route('admin.categories.update', $category->id) }}" method="POST">
            @csrf
            @method('PUT')
            
            <div class="form-group">
                <label for="name">Nama Kategori</label>
                <input type="text" name="name" id="name" class="form-control @error('name') is-invalid @enderror" value="{{ old('name', $category->name) }}" required>
                @error('name')
                    <span style="color: var(--danger); font-size: 12px; margin-top: 5px; display: block;">{{ $message }}</span>
                @enderror
            </div>

            <div class="form-group">
                <label for="description">Deskripsi</label>
                <textarea name="description" id="description" class="form-control">{{ old('description', $category->description) }}</textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
                Perbarui Kategori
            </button>
        </form>
    </div>
</div>
@endsection
