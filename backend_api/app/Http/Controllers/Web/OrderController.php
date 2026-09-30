<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        
        $query = Order::with('user')->orderBy('id', 'desc');

        if ($status) {
            $query->where('status_pesanan', $status);
        }

        $orders = $query->paginate(15);

        return view('admin.orders.index', compact('orders', 'status'));
    }

    public function show($id)
    {
        $order = Order::with(['user', 'orderDetails.product', 'payment'])->findOrFail($id);
        return view('admin.orders.show', compact('order'));
    }

    public function confirm($id)
    {
        $order = Order::findOrFail($id);
        
        try {
            $adminId = Auth::id();
            StockService::confirmOrder($order, $adminId);
            return redirect()->route('admin.orders.show', $order->id)->with('success', 'Pesanan berhasil dikonfirmasi. Pembayaran disetujui dan stok produk telah dikurangi.');
        } catch (\Exception $e) {
            return redirect()->route('admin.orders.show', $order->id)->with('error', $e->getMessage());
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $request->validate([
            'order_status' => 'required|in:Diproses,Siap Diambil,Dikirim,Selesai,Dibatalkan',
        ]);

        $newStatus = $request->order_status;

        try {
            if ($newStatus === 'Dibatalkan') {
                StockService::cancelOrder($order);
            } else {
                $order->update([
                    'status_pesanan' => $newStatus
                ]);

                if ($newStatus === 'Selesai') {
                    $order->update(['payment_status' => 'lunas']);
                    if ($order->payment) {
                        $order->payment->update(['payment_status' => 'approved']);
                    }
                }
            }

            return redirect()->route('admin.orders.show', $order->id)->with('success', "Status pesanan berhasil diperbarui menjadi {$newStatus}.");

        } catch (\Exception $e) {
            return redirect()->route('admin.orders.show', $order->id)->with('error', 'Gagal memperbarui status: ' . $e->getMessage());
        }
    }

    public function printInvoice($id)
    {
        $order = Order::with(['user', 'orderDetails', 'payment'])->findOrFail($id);
        return view('admin.orders.invoice', compact('order'));
    }

    public function kanban()
    {
        $orders = Order::with('user')->orderBy('id', 'desc')->get();
        return view('admin.orders.kanban', compact('orders'));
    }

    public function updateStatusAjax(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        
        $request->validate([
            'status' => 'required|in:Menunggu Pembayaran,Menunggu Konfirmasi,Diproses,Siap Diambil,Dikirim,Selesai,Dibatalkan',
        ]);

        $newStatus = $request->status;

        try {
            $adminId = Auth::id();

            if ($newStatus === 'Diproses') {
                StockService::confirmOrder($order, $adminId);
            } 
            else if ($newStatus === 'Dibatalkan') {
                StockService::cancelOrder($order);
            } 
            else {
                $order->update([
                    'status_pesanan' => $newStatus
                ]);

                if ($newStatus === 'Selesai') {
                    $order->update(['status_pembayaran' => 'lunas']);
                    if ($order->payment) {
                        $order->payment->update([
                            'status_pembayaran' => 'approved',
                            'dikonfirmasi_oleh' => $adminId,
                            'dikonfirmasi_pada' => now(),
                        ]);
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Status pesanan #{$order->kode_pesanan} berhasil diubah menjadi '{$newStatus}'.",
                'order' => $order->fresh()->toArray()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
