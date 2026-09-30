<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $order->order_code ?? $order->kode_pesanan }}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            padding: 15px;
            color: #000;
            max-width: 320px;
            margin: 0 auto;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
        }
        .header h2 {
            margin: 0;
            font-size: 16px;
        }
        .header p {
            margin: 3px 0 0 0;
            font-size: 11px;
        }
        .info-table, .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .info-table td {
            padding: 2px 0;
            vertical-align: top;
        }
        .items-table th, .items-table td {
            padding: 4px 0;
            text-align: left;
        }
        .items-table th {
            border-bottom: 1px dashed #000;
            font-weight: bold;
        }
        .total-row td {
            border-top: 1px dashed #000;
            padding-top: 8px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 11px;
            border-top: 1px dashed #000;
            padding-top: 10px;
        }
        @media print {
            body {
                padding: 0;
                margin: 0;
                width: 100%;
            }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="header">
        <h2>DELLA FROZEN MART</h2>
        <p>Tanjung Enim, Sumatera Selatan</p>
        <p>WhatsApp: 0821-8282-6108</p>
    </div>

    <table class="info-table">
        <tr>
            <td style="width: 90px;">No. Invoice</td>
            <td>: {{ $order->order_code ?? $order->kode_pesanan }}</td>
        </tr>
        <tr>
            <td>Tanggal</td>
            <td>: {{ date('d-m-Y H:i', strtotime($order->order_date ?? $order->tanggal_pesanan ?? now())) }}</td>
        </tr>
        <tr>
            <td>Pelanggan</td>
            <td>: {{ $order->user->nama ?? $order->user->name ?? 'Pelanggan' }}</td>
        </tr>
        <tr>
            <td>No. HP</td>
            <td>: {{ $order->user->no_hp ?? $order->user->telepon ?? '-' }}</td>
        </tr>
        <tr>
            <td>Pengiriman</td>
            <td>: {{ ($order->delivery_method ?? $order->opsi_pengiriman) === 'ambil_toko' ? 'Ambil di Toko' : 'Antar Alamat' }}</td>
        </tr>
        @if(($order->delivery_method ?? $order->opsi_pengiriman) !== 'ambil_toko' && !empty($order->alamat_lengkap ?? $order->alamat))
        <tr>
            <td>Alamat</td>
            <td>: {{ $order->alamat_lengkap ?? $order->alamat }}</td>
        </tr>
        @endif
        <tr>
            <td>Pembayaran</td>
            <td>: <b>{{ ( ($order->status_pembayaran ?? $order->payment_status) === 'lunas' || in_array(strtolower($order->status_pesanan ?? $order->order_status ?? ''), ['diproses', 'dikirim', 'siap diambil', 'selesai']) ) ? 'LUNAS (SUDAH DIBAYAR)' : 'BELUM BAYAR' }}</b></td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th>Produk</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            @php
                $isPoint = strtolower($order->payment_method ?? $order->metode_pembayaran ?? '') === 'poin' || ($order->points_used ?? $order->poin_digunakan ?? 0) > 0;
            @endphp
            @foreach($order->orderDetails ?? $order->detailPesanan ?? [] as $detail)
                @php
                    $isReward = ($detail->is_reward ?? false) || ($detail->subtotal ?? 0) == 0 || stripos($detail->product_name ?? $detail->nama_produk ?? '', 'hadiah poin') !== false;
                @endphp
                <tr>
                    <td>
                        {{ $detail->product_name ?? $detail->nama_produk ?? $detail->product->nama ?? 'Produk' }}
                        @if($isReward)
                            <br><small style="font-weight: bold; color: #000;">[🎁 HADIAH 10 POIN]</small>
                        @else
                            <br><small>@ Rp {{ number_format($detail->price ?? $detail->harga_satuan ?? 0, 0, ',', '.') }}</small>
                        @endif
                    </td>
                    <td style="text-align: center; vertical-align: top;">{{ $detail->quantity ?? $detail->jumlah ?? 1 }}</td>
                    <td style="text-align: right; vertical-align: top;">{{ $isReward ? 'GRATIS' : 'Rp ' . number_format($detail->subtotal ?? ($detail->quantity * $detail->price), 0, ',', '.') }}</td>
                </tr>
            @endforeach
            @php
                $detailsList = $order->orderDetails ?? $order->detailPesanan ?? [];
                $calcSub = 0;
                foreach($detailsList as $d) {
                    $calcSub += ($d->subtotal ?? ($d->quantity * $d->price));
                }
                $ongkir = $order->ongkos_kirim ?? $order->ongkir ?? $order->shipping_cost ?? 0;
                $isTakeaway = ($order->delivery_method ?? $order->opsi_pengiriman) === 'ambil_toko';
                $finalSub = $calcSub > 0 ? $calcSub : (($order->total_amount ?? $order->total_harga ?? 0) - $ongkir);
            @endphp
            <tr>
                <td colspan="2" style="text-align: right; padding-top: 6px;">Subtotal Produk:</td>
                <td style="text-align: right; padding-top: 6px;">Rp {{ number_format($finalSub, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td colspan="2" style="text-align: right;">Ongkos Kirim {{ $isTakeaway ? '(Ambil Toko)' : '' }}:</td>
                <td style="text-align: right;">{{ $isTakeaway || $ongkir == 0 ? 'Gratis (Rp 0)' : 'Rp ' . number_format($ongkir, 0, ',', '.') }}</td>
            </tr>
            @if($isPoint)
            <tr>
                <td colspan="2" style="text-align: right; font-weight: bold;">Diskon Tukar Poin:</td>
                <td style="text-align: right; font-weight: bold;">- Rp {{ number_format($finalSub, 0, ',', '.') }}</td>
            </tr>
            @endif
            <tr class="total-row">
                <td colspan="2" style="text-align: right;">TOTAL:</td>
                <td style="text-align: right;">{{ $isPoint ? 'Rp 0 (GRATIS)' : 'Rp ' . number_format($order->total_amount ?? $order->total_harga ?? 0, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        @if($isPoint)
            <p style="font-weight: bold;">🎁 NOTA KLAIM HADIAH POIN LOYALTI</p>
        @endif
        <p>Terima Kasih Atas Kunjungan Anda!</p>
        <p>Produk Frozen Berkualitas & Higienis</p>
    </div>
</body>
</html>
