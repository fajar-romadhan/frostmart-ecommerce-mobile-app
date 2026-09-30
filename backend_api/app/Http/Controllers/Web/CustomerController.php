<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index()
    {
        $customers = User::where('peran', 'pelanggan')
            ->orderBy('id', 'desc')
            ->paginate(15);

        return view('admin.customers.index', compact('customers'));
    }
}
