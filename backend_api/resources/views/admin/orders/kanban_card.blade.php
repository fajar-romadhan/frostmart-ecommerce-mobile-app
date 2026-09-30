<div class="kanban-card" id="order-card-{{ $order->id }}" data-order-id="{{ $order->id }}" data-delivery-method="{{ $order->delivery_method }}" draggable="true" style="{{ strtolower($order->payment_method) === 'poin' || $order->points_used > 0 ? 'border: 1.5px solid #10B981;' : '' }}">
    @php
        $isPoint = strtolower($order->payment_method) === 'poin' || $order->points_used > 0;
    @endphp
    @if($isPoint)
        <div style="background: linear-gradient(135deg, #059669, #10B981); color: white; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
            <span>🎁 CLAIM POINT (-10 Poin)</span>
        </div>
    @endif
    <div class="kanban-card-title">
        <span>#{{ $order->order_code }}</span>
        @php
            $badgeClass = 'badge-pending';
            if (strtolower($order->order_status) === 'selesai') $badgeClass = 'badge-success';
            elseif (strtolower($order->order_status) === 'dibatalkan') $badgeClass = 'badge-danger';
            elseif (in_array(strtolower($order->order_status), ['diproses', 'siap diambil', 'dikirim'])) $badgeClass = 'badge-info';
        @endphp
        <span class="badge badge-status {{ $badgeClass }}" style="font-size: 10px; padding: 2px 6px;">
            {{ $order->order_status }}
        </span>
    </div>
    
    <div class="kanban-card-body">
        <div><strong>Pelanggan:</strong> {{ $order->user->name }}</div>
        <div><strong>Total:</strong> <span style="color: {{ $isPoint ? '#059669' : 'var(--success)' }}; font-weight: 600;">{{ $isPoint ? 'Rp 0 (Tukar Poin)' : 'Rp ' . number_format($order->total_amount, 0, ',', '.') }}</span></div>
        <div><strong>Bayar:</strong> <span class="badge badge-info" style="font-size: 10px; background-color: {{ $isPoint ? '#DCFCE7' : '#E2E8F0' }}; color: {{ $isPoint ? '#059669' : 'var(--navy)' }}; font-weight: {{ $isPoint ? 'bold' : 'normal' }};">{{ $isPoint ? '🎁 KLAIM POIN' : strtoupper($order->payment_method) }}</span></div>
    </div>
    
    <div class="kanban-card-meta">
        <span>{{ $order->delivery_method === 'ambil_toko' ? '🏪 Ambil Toko' : '🚚 Antar Alamat' }}</span>
        <span>{{ date('d/m/y', strtotime($order->order_date)) }}</span>
    </div>
    
    <div class="kanban-card-footer">
        <a href="{{ route('admin.orders.show', $order->id) }}" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; margin-right: auto;">
            Detail
        </a>
        
        <!-- Action Buttons depending on status -->
        @if(strtolower($order->order_status) === 'menunggu konfirmasi')
            <button onclick="changeStatusViaButton({{ $order->id }}, 'Diproses', this)" class="btn btn-success" style="padding: 4px 8px; font-size: 11px; background-color: var(--success); color: white; border: none; border-radius: 4px; cursor: pointer;">
                Konfirmasi
            </button>
        @elseif(strtolower($order->order_status) === 'diproses')
            @if($order->delivery_method === 'ambil_toko')
                <button onclick="changeStatusViaButton({{ $order->id }}, 'Siap Diambil', this)" class="btn btn-info" style="padding: 4px 8px; font-size: 11px; background-color: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Siap Diambil
                </button>
            @else
                <button onclick="changeStatusViaButton({{ $order->id }}, 'Dikirim', this)" class="btn btn-info" style="padding: 4px 8px; font-size: 11px; background-color: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Kirim
                </button>
            @endif
        @elseif(in_array(strtolower($order->order_status), ['siap diambil', 'dikirim']))
            <button onclick="changeStatusViaButton({{ $order->id }}, 'Selesai', this)" class="btn btn-success" style="padding: 4px 8px; font-size: 11px; background-color: var(--success); color: white; border: none; border-radius: 4px; cursor: pointer;">
                Selesai
            </button>
        @endif
        
        @if(in_array(strtolower($order->order_status), ['menunggu pembayaran', 'menunggu konfirmasi', 'diproses']))
            <button onclick="if(confirm('Batalkan pesanan ini?')) changeStatusViaButton({{ $order->id }}, 'Dibatalkan', this)" class="btn btn-danger" style="padding: 4px 8px; font-size: 11px; background-color: var(--danger); color: white; border: none; border-radius: 4px; cursor: pointer;">
                Batal
            </button>
        @endif
    </div>
</div>
