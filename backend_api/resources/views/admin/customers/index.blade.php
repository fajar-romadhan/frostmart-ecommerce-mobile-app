@extends('layouts.admin')

@section('title', 'Data Pelanggan')
@section('header_title', 'Data Pelanggan Terdaftar')

@section('content')
<div class="card">
    <div class="card-header">
        <h3>Daftar Akun Pelanggan</h3>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nama Pelanggan</th>
                        <th>Alamat Email</th>
                        <th>Nomor Telepon</th>
                        <th>Alamat Pengiriman</th>
                        <th>Tanggal Terdaftar</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($customers as $customer)
                        <tr>
                            <td>{{ $customer->id }}</td>
                            <td><strong>{{ $customer->name }}</strong></td>
                            <td>{{ $customer->email }}</td>
                            <td>{{ $customer->phone ?? '-' }}</td>
                            <td>{{ $customer->address ?? '-' }}</td>
                            <td>{{ date('d-m-Y H:i', strtotime($customer->created_at)) }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" style="text-align: center; color: var(--text-muted);">Belum ada pelanggan terdaftar.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="pagination-wrapper">
            {{ $customers->links() }}
        </div>
    </div>
</div>
@endsection
