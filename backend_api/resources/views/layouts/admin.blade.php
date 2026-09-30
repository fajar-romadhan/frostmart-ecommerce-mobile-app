<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') - Della Frozen Mart</title>
    <!-- Inter Font -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Admin CSS -->
    <link rel="stylesheet" href="{{ asset('css/admin.css') }}">
    @yield('styles')
</head>
<body>
    <div class="wrapper">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-brand">
                Della Frozen Mart
            </div>
            <ul class="sidebar-menu">
                @if(auth()->user()->role === 'admin')
                    <li class="{{ Request::routeIs('admin.dashboard') ? 'active' : '' }}">
                        <a href="{{ route('admin.dashboard') }}">Dashboard</a>
                    </li>
                    <li class="{{ Request::routeIs('admin.categories.*') ? 'active' : '' }}">
                        <a href="{{ route('admin.categories.index') }}">Kategori Produk</a>
                    </li>
                    <li class="{{ Request::routeIs('admin.products.*') ? 'active' : '' }}">
                        <a href="{{ route('admin.products.index') }}">Data Produk</a>
                    </li>
                    <li class="{{ Request::routeIs('admin.stock-ins.*') ? 'active' : '' }}">
                        <a href="{{ route('admin.stock-ins.index') }}">Barang Masuk</a>
                    </li>
                    <li class="{{ Request::routeIs('admin.orders.index') || Request::routeIs('admin.orders.show') ? 'active' : '' }}">
                        <a href="{{ route('admin.orders.index') }}">Pesanan</a>
                    </li>
                    <li class="{{ Request::routeIs('admin.orders.kanban') ? 'active' : '' }}">
                        <a href="{{ route('admin.orders.kanban') }}">Papan Kanban</a>
                    </li>
                    <li class="{{ Request::routeIs('admin.reports.stocks') ? 'active' : '' }}">
                        <a href="{{ route('admin.reports.stocks') }}">Laporan Stok</a>
                    </li>
                    <li class="{{ Request::routeIs('admin.reports.sales') ? 'active' : '' }}">
                        <a href="{{ route('admin.reports.sales') }}">Laporan Penjualan</a>
                    </li>
                    <li class="{{ Request::routeIs('admin.customers.index') ? 'active' : '' }}">
                        <a href="{{ route('admin.customers.index') }}">Pelanggan</a>
                    </li>
                @elseif(auth()->user()->role === 'owner')
                    <li class="{{ Request::routeIs('owner.dashboard') ? 'active' : '' }}">
                        <a href="{{ route('owner.dashboard') }}">Dashboard Owner</a>
                    </li>
                    <li class="{{ Request::routeIs('owner.orders.*') ? 'active' : '' }}">
                        <a href="{{ route('owner.orders.index') }}">Pesanan</a>
                    </li>
                    <li class="{{ Request::routeIs('owner.reports.stocks') ? 'active' : '' }}">
                        <a href="{{ route('owner.reports.stocks') }}">Laporan Stok</a>
                    </li>
                    <li class="{{ Request::routeIs('owner.reports.sales') ? 'active' : '' }}">
                        <a href="{{ route('owner.reports.sales') }}">Laporan Penjualan</a>
                    </li>
                @endif
                <li style="margin-top: 30px;">
                    <form action="{{ route('logout') }}" method="POST" id="logout-form" style="display: none;">
                        @csrf
                    </form>
                    <a href="#" onclick="event.preventDefault(); document.getElementById('logout-form').submit();" style="color: var(--danger); background-color: rgba(231, 76, 60, 0.1);">
                        Logout
                    </a>
                </li>
            </ul>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="header">
                <div class="header-title">
                    <h2>@yield('header_title')</h2>
                </div>
                <div class="header-user">
                    <span class="user-name">{{ auth()->user()->name }}</span>
                    <span class="user-role">{{ auth()->user()->role }}</span>
                </div>
            </header>

            <div class="content-body">
                @if(session('success'))
                    <div class="alert alert-success">
                        {{ session('success') }}
                    </div>
                @endif

                @if(session('error'))
                    <div class="alert alert-danger">
                        {{ session('error') }}
                    </div>
                @endif

                @yield('content')
            </div>
        </main>
    </div>
    @yield('scripts')
</body>
</html>
