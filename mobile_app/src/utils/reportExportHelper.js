import { Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { ApiService } from '../core/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRp = (val) =>
  'Rp ' + parseFloat(val || 0).toLocaleString('id-ID', { minimumFractionDigits: 0 });

const formatDate = () =>
  new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/** Kirim log aktivitas cetak ke backend (fire-and-forget, tidak throw) */
const logPrintActivity = async (user, type, periodText, totalOrders, role) => {
  try {
    const byName = user?.name || user?.nama || 'Admin';
    const byRole = role || (user?.role === 'owner' ? 'Owner' : 'Admin');
    await ApiService.post('/admin/activity-logs', {
      action: `Cetak Laporan ${type}`,
      description: `${byRole} ${byName} mencetak laporan ${type} periode "${periodText}" — ${totalOrders} transaksi selesai`,
    });
  } catch (_) {
    // Tidak perlu crash jika log gagal
  }
};

// ─── PDF Export ───────────────────────────────────────────────────────────────

export const exportPdfReport = async ({
  title = 'LAPORAN PENJUALAN TOKO',
  subtitle = 'Della Frozen Mart - Distributor & Retail Frozen Food',
  periodText = 'Hari Ini',
  isOwner = false,
  stats = [],
  items = [],
  user = null,
}) => {
  try {
    const byName  = user?.name  || user?.nama  || 'Administrator';
    const byRole  = (user?.role === 'owner' || user?.peran === 'owner')
      ? 'Owner / Pemilik Toko' : 'Admin Operasional';
    const byEmail = user?.email ? user.email : '-';

    // ── KPI Cards ──────────────────────────────────────────────────────────
    const statsHtml = stats.map((s) => `
      <div class="stat-card">
        <div class="stat-val">${s.value}</div>
        <div class="stat-lbl">${s.label}</div>
      </div>`).join('');

    // ── Table Rows ─────────────────────────────────────────────────────────
    let grandTotal = 0;
    let grandShipping = 0;
    let grandSubtotal = 0;
    let totalRows = 0;

    const rowsHtml = items.map((item, i) => {
      const details   = item.orderDetails || item.order_details || item.details || [];
      const isPickup  = item.delivery_method === 'ambil_toko';
      const delivery  = isPickup ? '🏬 Ambil Toko' : '🛵 Antar Kurir';
      const payMethod = (item.payment_method || item.metode_pembayaran || 'Transfer').toUpperCase();
      const rawAmount   = parseFloat(item.total_amount   || item.total_harga || 0);
      const rawShipping = parseFloat(item.ongkos_kirim   ?? item.shipping_fee ?? 0);
      const rawSub      = Math.max(0, rawAmount - rawShipping);
      const orderDate   = item.order_date || item.created_at || '-';
      const custName    = item.user?.name || item.user_name || 'Pelanggan';
      const orderCode   = item.order_code || item.kode_pesanan || '-';

      grandTotal    += rawAmount;
      grandShipping += rawShipping;
      grandSubtotal += rawSub;
      totalRows++;

      const rowBg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

      if (isOwner) {
        const productLines = details.map((d) => {
          const qty   = d.quantity || d.jumlah || 1;
          const name  = d.product_name || d.nama_produk || d.product?.name || 'Produk';
          const price = parseFloat(d.price || d.harga || 0);
          const sub   = parseFloat(d.subtotal || qty * price);
          return `<span style="display:block;margin-bottom:2px;">• <b>${qty}x</b> ${name} <span style="color:#64748B;">@ ${formatRp(price)}</span> = <b style="color:#0369A1;">${formatRp(sub)}</b></span>`;
        }).join('');

        return `
          <tr style="background:${rowBg};">
            <td class="tc num">${i + 1}</td>
            <td class="mono">${orderCode}</td>
            <td class="tc">${orderDate}</td>
            <td><b>${custName}</b></td>
            <td class="tc"><span class="badge badge-amber">${payMethod}</span></td>
            <td class="tc"><span class="badge ${isPickup ? 'badge-blue' : 'badge-indigo'}">${delivery}</span></td>
            <td style="font-size:9.5px;line-height:1.5;">${productLines || '-'}</td>
            <td class="tr green">${formatRp(rawSub)}</td>
            <td class="tr">${rawShipping > 0 ? formatRp(rawShipping) : '<span style="color:#94A3B8;">Gratis</span>'}</td>
            <td class="tr bold primary">${formatRp(rawAmount)}</td>
            <td class="tc"><span class="badge badge-green">✓ Selesai</span></td>
          </tr>`;
      } else {
        const productLines = details.map((d) =>
          `${d.quantity || d.jumlah || 1}x ${d.product_name || d.nama_produk || 'Produk'}`
        ).join('<br/>');

        return `
          <tr style="background:${rowBg};">
            <td class="tc num">${i + 1}</td>
            <td class="mono">${orderCode}</td>
            <td class="tc">${orderDate}</td>
            <td>${custName}</td>
            <td class="tc"><span class="badge ${isPickup ? 'badge-blue' : 'badge-indigo'}">${delivery}</span></td>
            <td style="font-size:10px;">${productLines || '-'}</td>
            <td class="tr bold primary">${formatRp(rawAmount)}</td>
            <td class="tc"><span class="badge badge-green">✓ Selesai</span></td>
          </tr>`;
      }
    }).join('');

    // ── Total Footer Row ────────────────────────────────────────────────────
    const totalRowHtml = totalRows > 0 ? (isOwner ? `
      <tr class="total-row">
        <td class="tc" colspan="7"><b>TOTAL KESELURUHAN (${totalRows} Transaksi)</b></td>
        <td class="tr"><b>${formatRp(grandSubtotal)}</b></td>
        <td class="tr"><b>${formatRp(grandShipping)}</b></td>
        <td class="tr" style="color:#FFFFFF;font-size:13px;"><b>${formatRp(grandTotal)}</b></td>
        <td></td>
      </tr>` : `
      <tr class="total-row">
        <td class="tc" colspan="6"><b>TOTAL KESELURUHAN (${totalRows} Transaksi)</b></td>
        <td class="tr" style="color:#FFFFFF;font-size:13px;"><b>${formatRp(grandTotal)}</b></td>
        <td></td>
      </tr>`) : '';

    const colCount = isOwner ? 11 : 8;

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    @page { size: A4 landscape; margin: 14mm 12mm 14mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #1E293B;
      background: #FFFFFF;
      padding: 0;
    }

    /* ── Header ── */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #0284C7;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 900;
      color: #0284C7;
      letter-spacing: 1.5px;
    }
    .brand-tagline { font-size: 10px; color: #64748B; margin-top: 2px; }
    .meta-block { text-align: right; font-size: 10px; color: #475569; line-height: 1.7; }
    .meta-block b { color: #1E293B; }
    .role-pill {
      display: inline-block;
      background: #DBEAFE;
      color: #1D4ED8;
      padding: 1px 7px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 9px;
    }

    /* ── Title Box ── */
    .title-box {
      background: linear-gradient(90deg, #EFF6FF 0%, #F0F9FF 100%);
      border-left: 5px solid #0284C7;
      padding: 10px 14px;
      margin-bottom: 14px;
      border-radius: 0 6px 6px 0;
    }
    .title-box h2 { font-size: 13px; font-weight: 800; color: #0F172A; }
    .title-box .period {
      font-size: 11px;
      color: #0369A1;
      font-weight: 600;
      margin-top: 3px;
    }

    /* ── KPI Stats ── */
    .stats-row {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }
    .stat-card {
      flex: 1;
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-top: 3px solid #0284C7;
      border-radius: 6px;
      padding: 10px 8px;
      text-align: center;
    }
    .stat-val { font-size: 15px; font-weight: 900; color: #0F172A; }
    .stat-lbl { font-size: 9px; color: #64748B; margin-top: 3px; line-height: 1.3; }

    /* ── Table ── */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-bottom: 20px;
    }
    .data-table thead tr {
      background: #1E293B;
      color: #FFFFFF;
    }
    .data-table th {
      padding: 8px 7px;
      text-align: left;
      font-weight: 700;
      font-size: 9.5px;
      letter-spacing: 0.3px;
      border-right: 1px solid #334155;
    }
    .data-table td {
      padding: 7px;
      border: 1px solid #E2E8F0;
      vertical-align: top;
      line-height: 1.4;
    }
    .total-row td {
      background: #1E293B;
      color: #94A3B8;
      padding: 8px 7px;
      border: 1px solid #334155;
      font-size: 10.5px;
    }

    /* Utility */
    .tc  { text-align: center; }
    .tr  { text-align: right; }
    .num { font-size: 10px; color: #94A3B8; }
    .mono { font-family: monospace; font-size: 10px; color: #0369A1; font-weight: 700; }
    .bold { font-weight: 800; }
    .green  { color: #059669; font-weight: 700; }
    .primary { color: #0284C7; }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: 700;
      white-space: nowrap;
    }
    .badge-green  { background:#DCFCE7; color:#15803D; }
    .badge-blue   { background:#E0F2FE; color:#0369A1; }
    .badge-indigo { background:#EEF2FF; color:#4338CA; }
    .badge-amber  { background:#FEF3C7; color:#B45309; }

    /* ── Footer / Signature ── */
    .footer {
      margin-top: 28px;
      border-top: 1px solid #E2E8F0;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
    }
    .sign-box { text-align: center; width: 180px; }
    .sign-line {
      border-top: 1px solid #94A3B8;
      margin: 50px 10px 4px 10px;
    }
    .sign-name { font-weight: 800; font-size: 11px; }
    .sign-role { color: #64748B; font-size: 9px; margin-top: 2px; }
    .footer-note {
      font-size: 9px;
      color: #94A3B8;
      text-align: center;
      margin-top: 10px;
    }
  </style>
</head>
<body>

  <!-- ── Letterhead ── -->
  <div class="doc-header">
    <div>
      <div class="brand-name">DELLA FROZEN MART</div>
      <div class="brand-tagline">${subtitle}</div>
    </div>
    <div class="meta-block">
      <div><b>Tanggal Cetak:</b> ${formatDate()}</div>
      <div><b>Dicetak Oleh:</b> ${byName} &nbsp;<span class="role-pill">${byRole}</span></div>
      <div><b>Email:</b> ${byEmail}</div>
    </div>
  </div>

  <!-- ── Report Title ── -->
  <div class="title-box">
    <h2>${title}</h2>
    <div class="period">📅 PERIODE LAPORAN: ${periodText.toUpperCase()}</div>
  </div>

  <!-- ── KPI Stats ── -->
  ${stats.length > 0 ? `<div class="stats-row">${statsHtml}</div>` : ''}

  <!-- ── Data Table ── -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:26px;" class="tc">No</th>
        <th>Kode Transaksi</th>
        <th style="width:80px;" class="tc">Tanggal</th>
        <th>Nama Pelanggan</th>
        ${isOwner ? '<th class="tc">Pembayaran</th>' : ''}
        <th class="tc">Pengiriman</th>
        <th>Rincian Produk Terjual</th>
        ${isOwner ? '<th class="tr">Subtotal</th><th class="tr">Ongkir</th>' : ''}
        <th class="tr">${isOwner ? 'Total Netto (Rp)' : 'Nominal (Rp)'}</th>
        <th class="tc">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="${colCount}" style="text-align:center;padding:20px;color:#94A3B8;">Tidak ada data transaksi selesai pada periode ini.</td></tr>`}
      ${totalRowHtml}
    </tbody>
  </table>

  <!-- ── Signature Footer ── -->
  <div class="footer">
    <div class="sign-box">
      <div>Dibuat &amp; Dicetak Oleh,</div>
      <div class="sign-line"></div>
      <div class="sign-name">${byName}</div>
      <div class="sign-role">${byRole} — Della Frozen Mart</div>
    </div>
    <div style="text-align:center;font-size:9px;color:#94A3B8;align-self:flex-end;">
      <div>Dokumen ini dicetak otomatis oleh sistem Della Frozen Mart.</div>
      <div>Harap simpan sebagai arsip resmi transaksi.</div>
    </div>
    <div class="sign-box">
      <div>Mengetahui &amp; Menyetujui,</div>
      <div class="sign-line"></div>
      <div class="sign-name">( Owner / Pemilik Toko )</div>
      <div class="sign-role">Della Frozen Mart</div>
    </div>
  </div>

  <div class="footer-note">
    © ${new Date().getFullYear()} Della Frozen Mart — Laporan ini bersifat rahasia dan hanya untuk keperluan internal perusahaan.
  </div>

</body>
</html>`;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Simpan Laporan PDF — Della Frozen Mart`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Sukses 🎉', `Laporan PDF berhasil dicetak oleh ${byName}.`);
    }
    // Catat aktivitas cetak ke log
    await logPrintActivity(user, 'PDF', periodText, items.length, byRole);
  } catch (error) {
    console.error('Gagal export PDF:', error);
    Alert.alert('Gagal', 'Terjadi kesalahan saat memproses laporan PDF.');
  }
};

// ─── Excel (CSV) Export ───────────────────────────────────────────────────────

export const exportExcelReport = async ({
  title = 'Laporan_Penjualan',
  periodText = 'Hari Ini',
  isOwner = false,
  items = [],
  user = null,
}) => {
  try {
    const byName  = user?.name  || user?.nama  || 'Administrator';
    const byRole  = (user?.role === 'owner' || user?.peran === 'owner') ? 'Owner / Pemilik' : 'Admin Operasional';
    const timeStamp = new Date().toISOString().slice(0, 10);
    const filename  = `DellaMart_${title}_${periodText.replace(/[\s/]/g, '-')}_${timeStamp}.csv`;
    const fileUri   = `${FileSystem.cacheDirectory}${filename}`;

    const sep = ';'; // semicolon → Excel Indonesia (Standard separator for Windows/ID locale)
    const q   = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const n   = (v) => parseFloat(v || 0).toFixed(0); // clean integer number for Excel

    const formatDateExcel = (dtStr) => {
      if (!dtStr) return '-';
      try {
        const dt = new Date(dtStr);
        if (isNaN(dt.getTime())) return String(dtStr);
        const day    = String(dt.getDate()).padStart(2, '0');
        const month  = String(dt.getMonth() + 1).padStart(2, '0');
        const year   = dt.getFullYear();
        const hours  = String(dt.getHours()).padStart(2, '0');
        const mins   = String(dt.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${mins}`;
      } catch (e) {
        return String(dtStr);
      }
    };

    // ── File Header ───────────────────────────────────────────────────────
    let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel UTF-8 compatibility
    csv += `DELLA FROZEN MART${sep}${sep}${sep}${sep}\n`;
    csv += `LAPORAN PENJUALAN TOKO & RIWAYAT TRANSAKSI${sep}${sep}${sep}${sep}\n`;
    csv += `\n`;
    csv += `Periode Laporan${sep}${q(': ' + periodText)}${sep}${sep}\n`;
    csv += `Dicetak Oleh${sep}${q(': ' + byName + ' (' + byRole + ')')}${sep}${sep}\n`;
    csv += `Tanggal & Waktu Cetak${sep}${q(': ' + formatDateExcel(new Date()))}${sep}${sep}\n`;
    csv += `Total Transaksi${sep}${q(': ' + items.length + ' Pesanan')}${sep}${sep}\n`;
    csv += `\n`;

    // ── Column Headers ────────────────────────────────────────────────────
    if (isOwner) {
      csv += [
        'NO', 'KODE PESANAN', 'TANGGAL & WAKTU', 'NAMA PELANGGAN',
        'METODE PEMBAYARAN', 'METODE PENGIRIMAN',
        'RINCIAN ITEM PRODUK', 'SUBTOTAL PRODUK (RP)',
        'ONGKOS KIRIM (RP)', 'TOTAL NETTO (RP)', 'STATUS PESANAN'
      ].map(q).join(sep) + '\n';
    } else {
      csv += [
        'NO', 'KODE PESANAN', 'TANGGAL & WAKTU', 'NAMA PELANGGAN',
        'METODE PENGIRIMAN', 'RINCIAN ITEM PRODUK',
        'TOTAL BELANJA (RP)', 'STATUS PESANAN'
      ].map(q).join(sep) + '\n';
    }

    // ── Data Rows ─────────────────────────────────────────────────────────
    let grandTotal    = 0;
    let grandShipping = 0;
    let grandSubtotal = 0;

    items.forEach((item, i) => {
      const details     = item.orderDetails || item.order_details || item.details || [];
      const isPickup    = item.delivery_method === 'ambil_toko';
      const delivery    = isPickup ? 'Ambil di Toko' : 'Antar Kurir Toko';
      const payMethod   = (item.payment_method || item.metode_pembayaran || 'Transfer Bank').toUpperCase();
      const rawAmount   = parseFloat(item.total_amount   || item.total_harga || 0);
      const rawShipping = parseFloat(item.ongkos_kirim   ?? item.shipping_fee ?? 0);
      const rawSub      = Math.max(0, rawAmount - rawShipping);
      const statusText  = (item.status_pesanan || item.status || 'Selesai').toUpperCase();
      const orderDate   = formatDateExcel(item.order_date || item.created_at);

      grandTotal    += rawAmount;
      grandShipping += rawShipping;
      grandSubtotal += rawSub;

      if (isOwner) {
        const productList = details.length > 0
          ? details.map((d, idx) => {
              const qty   = d.quantity || d.jumlah || 1;
              const name  = d.product_name || d.nama_produk || 'Produk';
              const price = parseFloat(d.price || d.harga || 0);
              const sub   = parseFloat(d.subtotal || qty * price);
              return `${idx + 1}. ${qty}x ${name} (@ Rp ${price.toLocaleString('id-ID')}) = Rp ${sub.toLocaleString('id-ID')}`;
            }).join('\n')
          : '-';

        csv += [
          i + 1,
          q(item.order_code || item.kode_pesanan || '-'),
          q(orderDate),
          q(item.user?.name || item.user_name || 'Pelanggan'),
          q(payMethod),
          q(delivery),
          q(productList),
          n(rawSub),
          n(rawShipping),
          n(rawAmount),
          q(statusText),
        ].join(sep) + '\n';
      } else {
        const productList = details.length > 0
          ? details.map((d, idx) => {
              const qty  = d.quantity || d.jumlah || 1;
              const name = d.product_name || d.nama_produk || 'Produk';
              return `${idx + 1}. ${qty}x ${name}`;
            }).join('\n')
          : '-';

        csv += [
          i + 1,
          q(item.order_code || item.kode_pesanan || '-'),
          q(orderDate),
          q(item.user?.name || item.user_name || 'Pelanggan'),
          q(delivery),
          q(productList),
          n(rawAmount),
          q(statusText),
        ].join(sep) + '\n';
      }
    });

    // ── Summary Totals Row ────────────────────────────────────────────────
    csv += `\n`;
    if (isOwner) {
      csv += [
        q(''), q(''), q(''), q(''), q(''), q(''),
        q(`TOTAL KESELURUHAN (${items.length} PESANAN)`),
        n(grandSubtotal), n(grandShipping), n(grandTotal), q('SELESAI'),
      ].join(sep) + '\n';
    } else {
      csv += [
        q(''), q(''), q(''), q(''), q(''),
        q(`TOTAL KESELURUHAN (${items.length} PESANAN)`), n(grandTotal), q('SELESAI'),
      ].join(sep) + '\n';
    }

    csv += `\n`;
    csv += `${q('Catatan: Dokumen laporan ini diterbitkan secara resmi dari Sistem Della Frozen Mart Mobile.')}\n`;
    csv += `${q('Hak Cipta © ' + new Date().getFullYear() + ' Della Frozen Mart — Dokumen Rahasia Operasional Internal')}\n`;

    // ── Write & Share ─────────────────────────────────────────────────────
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `Simpan Laporan Excel — Della Frozen Mart`,
      });
    } else {
      Alert.alert('Sukses 🎉', `File Excel berhasil dibuat oleh ${byName}.`);
    }
    // Catat aktivitas cetak ke log
    await logPrintActivity(user, 'Excel', periodText, items.length, byRole);
  } catch (error) {
    console.error('Gagal export Excel:', error);
    Alert.alert('Gagal Export Excel', error.message || 'Terjadi kesalahan saat memproses laporan Excel.');
  }
};
