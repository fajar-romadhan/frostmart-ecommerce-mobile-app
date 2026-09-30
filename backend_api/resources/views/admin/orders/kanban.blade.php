@extends('layouts.admin')

@section('title', 'Papan Kanban Pesanan')
@section('header_title', 'Papan Kanban Pesanan Pelanggan')

@section('content')
<div class="card" style="margin-bottom: 20px;">
    <div class="card-header" style="flex-wrap: wrap; gap: 15px;">
        <h3>Alur Proses Pesanan</h3>
        <div>
            <a href="{{ route('admin.orders.index') }}" class="btn btn-secondary" style="padding: 8px 15px; font-size: 13px;">
                Tampilan Tabel List
            </a>
        </div>
    </div>
</div>

<!-- Kanban Columns container -->
<div class="kanban-board">
    
    <!-- COLUMN 1: Menunggu Pembayaran -->
    <div class="kanban-column" data-status="Menunggu Pembayaran" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event)">
        <div class="kanban-column-header">
            <h4>Menunggu Pembayaran</h4>
            <span class="count" id="count-menunggu-pembayaran">0</span>
        </div>
        <div class="kanban-cards" id="cards-menunggu-pembayaran">
            @foreach($orders->where('order_status', 'Menunggu Pembayaran') as $order)
                @include('admin.orders.kanban_card', ['order' => $order])
            @endforeach
        </div>
    </div>

    <!-- COLUMN 2: Menunggu Konfirmasi -->
    <div class="kanban-column" data-status="Menunggu Konfirmasi" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event)">
        <div class="kanban-column-header">
            <h4>Menunggu Konfirmasi</h4>
            <span class="count" id="count-menunggu-konfirmasi">0</span>
        </div>
        <div class="kanban-cards" id="cards-menunggu-konfirmasi">
            @foreach($orders->where('order_status', 'Menunggu Konfirmasi') as $order)
                @include('admin.orders.kanban_card', ['order' => $order])
            @endforeach
        </div>
    </div>

    <!-- COLUMN 3: Diproses -->
    <div class="kanban-column" data-status="Diproses" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event)">
        <div class="kanban-column-header">
            <h4>Sedang Diproses</h4>
            <span class="count" id="count-diproses">0</span>
        </div>
        <div class="kanban-cards" id="cards-diproses">
            @foreach($orders->where('order_status', 'Diproses') as $order)
                @include('admin.orders.kanban_card', ['order' => $order])
            @endforeach
        </div>
    </div>

    <!-- COLUMN 4: Siap Diambil / Dikirim -->
    <div class="kanban-column" data-status="Siap Diambil" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="drop(event)">
        <div class="kanban-column-header">
            <h4>Siap Diambil / Dikirim</h4>
            <span class="count" id="count-siap-kirim">0</span>
        </div>
        <div class="kanban-cards" id="cards-siap-kirim">
            @foreach($orders->whereIn('order_status', ['Siap Diambil', 'Dikirim']) as $order)
                @include('admin.orders.kanban_card', ['order' => $order])
            @endforeach
        </div>
    </div>

</div>

<!-- Toast Notification Container -->
<div class="toast-container" id="toast-container"></div>

<!-- CSRF Token Meta -->
<meta name="csrf-token" content="{{ csrf_token() }}">

@endsection

@section('scripts')
<script>
    // Update column counters initially
    function updateCounts() {
        document.getElementById('count-menunggu-pembayaran').innerText = document.getElementById('cards-menunggu-pembayaran').children.length;
        document.getElementById('count-menunggu-konfirmasi').innerText = document.getElementById('cards-menunggu-konfirmasi').children.length;
        document.getElementById('count-diproses').innerText = document.getElementById('cards-diproses').children.length;
        document.getElementById('count-siap-kirim').innerText = document.getElementById('cards-siap-kirim').children.length;
    }

    // Call counts on load
    document.addEventListener("DOMContentLoaded", function() {
        updateCounts();
    });

    // Native Drag & Drop Implementation
    let draggedCard = null;
    let sourceColumn = null;

    function dragStart(event) {
        draggedCard = event.currentTarget;
        sourceColumn = draggedCard.closest('.kanban-column');
        draggedCard.classList.add('dragging');
        event.dataTransfer.setData('text/plain', draggedCard.id);
    }

    function dragEnd(event) {
        if (draggedCard) {
            draggedCard.classList.remove('dragging');
        }
        draggedCard = null;
        sourceColumn = null;
        
        // Remove drag-over highlights from columns
        document.querySelectorAll('.kanban-column').forEach(col => {
            col.classList.remove('drag-over');
        });
    }

    // Add drag listeners to cards
    document.querySelectorAll('.kanban-card').forEach(card => {
        card.addEventListener('dragstart', dragStart);
        card.addEventListener('dragend', dragEnd);
    });

    function allowDrop(event) {
        event.preventDefault();
        const column = event.currentTarget;
        column.classList.add('drag-over');
    }

    function dragLeave(event) {
        const column = event.currentTarget;
        column.classList.remove('drag-over');
    }

    function drop(event) {
        event.preventDefault();
        const column = event.currentTarget;
        column.classList.remove('drag-over');

        const cardId = event.dataTransfer.getData('text/plain');
        const card = document.getElementById(cardId);
        
        if (!card) return;

        const targetStatus = column.getAttribute('data-status');
        const orderId = card.getAttribute('data-order-id');
        const deliveryMethod = card.getAttribute('data-delivery-method');
        
        // Determine exact status to assign (e.g. Siap Diambil or Dikirim)
        let finalStatus = targetStatus;
        if (targetStatus === 'Siap Diambil' && deliveryMethod === 'antar_alamat') {
            finalStatus = 'Dikirim';
        }

        // Check if status is transitioning to a valid state
        const currentStatus = card.closest('.kanban-column').getAttribute('data-status');
        if (currentStatus === finalStatus) return;

        // Perform status update via AJAX
        updateOrderStatus(orderId, finalStatus, card, column);
    }

    function updateOrderStatus(orderId, newStatus, cardElement, targetColumn) {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        
        // Show loading state
        cardElement.style.opacity = '0.5';

        fetch(`/admin/orders/${orderId}/update-status-ajax`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(res => {
            cardElement.style.opacity = '1';

            if (res.status === 200 && res.body.success) {
                // Move card in DOM
                const targetCardsContainer = targetColumn.querySelector('.kanban-cards');
                targetCardsContainer.appendChild(cardElement);
                
                // Update card visual elements if any
                const statusBadge = cardElement.querySelector('.badge-status');
                if (statusBadge) {
                    statusBadge.innerText = newStatus;
                    statusBadge.className = 'badge badge-status ' + getBadgeClass(newStatus);
                }

                // Show success toast
                showToast(res.body.message, 'success');
                updateCounts();
            } else {
                // Revert card positioning and show error toast
                showToast(res.body.message || 'Gagal merubah status pesanan.', 'danger');
                updateCounts();
            }
        })
        .catch(err => {
            cardElement.style.opacity = '1';
            showToast('Koneksi internet bermasalah atau server error.', 'danger');
            updateCounts();
        });
    }

    // Helper functions for action buttons (fallback)
    function changeStatusViaButton(orderId, newStatus, buttonElement) {
        const card = buttonElement.closest('.kanban-card');
        let targetColumnId = 'cards-diproses';
        
        if (newStatus === 'Siap Diambil' || newStatus === 'Dikirim') {
            targetColumnId = 'cards-siap-kirim';
        } else if (newStatus === 'Selesai' || newStatus === 'Dibatalkan') {
            // Remove from board completely or alert
            executeStatusButtonOnly(orderId, newStatus, card);
            return;
        }

        const targetColumn = document.getElementById(targetColumnId).closest('.kanban-column');
        updateOrderStatus(orderId, newStatus, card, targetColumn);
    }

    function executeStatusButtonOnly(orderId, newStatus, cardElement) {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        cardElement.style.opacity = '0.5';

        fetch(`/admin/orders/${orderId}/update-status-ajax`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(res => {
            cardElement.style.opacity = '1';
            if (res.status === 200 && res.body.success) {
                // Remove card from layout
                cardElement.remove();
                showToast(res.body.message, 'success');
                updateCounts();
            } else {
                showToast(res.body.message || 'Gagal memperbarui status.', 'danger');
            }
        })
        .catch(err => {
            cardElement.style.opacity = '1';
            showToast('Koneksi bermasalah.', 'danger');
        });
    }

    function getBadgeClass(status) {
        status = status.toLowerCase();
        if (status === 'selesai') return 'badge-success';
        if (status === 'dibatalkan') return 'badge-danger';
        if (['diproses', 'siap diambil', 'dikirim'].includes(status)) return 'badge-info';
        return 'badge-pending';
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div style="font-weight: 600; font-size: 13px;">
                ${type === 'success' ? '🚀 Sukses!' : '⚠️ Perhatian'}
            </div>
            <div style="font-size: 12px; margin-top: 2px;">${message}</div>
        `;
        
        container.appendChild(toast);
        
        // Animation in
        setTimeout(() => {
            toast.classList.add('show');
        }, 50);

        // Remove toast after 4s
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // Realtime Auto-Sync Papan Kanban setiap 5 detik
    setInterval(() => {
        if (!draggedCard && document.visibilityState === 'visible') {
            fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(res => res.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const columns = ['cards-menunggu-pembayaran', 'cards-menunggu-konfirmasi', 'cards-diproses', 'cards-siap-kirim'];
                    columns.forEach(colId => {
                        const newCol = doc.getElementById(colId);
                        const curCol = document.getElementById(colId);
                        if (newCol && curCol && !draggedCard) {
                            curCol.innerHTML = newCol.innerHTML;
                        }
                    });
                    updateCounts();
                })
                .catch(err => console.log('Realtime kanban sync error:', err));
        }
    }, 5000);
</script>
@endsection
