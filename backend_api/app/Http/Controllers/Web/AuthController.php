<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function showLogin(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('Web Login page accessed', [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => $request->session()->getId(),
            'cookies' => $request->cookies->all()
        ]);

        if (Auth::check()) {
            $role = Auth::user()->role;
            if ($role === 'admin') {
                return redirect()->route('admin.dashboard');
            } elseif ($role === 'owner') {
                return redirect()->route('owner.dashboard');
            }
        }
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        \Illuminate\Support\Facades\Log::info('Login attempt', [
            'email' => $request->email,
            'ip' => $request->ip(),
            'session_id' => $request->session()->getId(),
            'cookies' => $request->cookies->all()
        ]);

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            \Illuminate\Support\Facades\Log::info('Login success', [
                'user_id' => $user->id,
                'role' => $user->role
            ]);
            $request->session()->regenerate();

            if ($user->role === 'admin') {
                \Illuminate\Support\Facades\Log::info('Redirecting to admin.dashboard');
                return redirect()->route('admin.dashboard')->with('success', 'Selamat datang, Admin!');
            } elseif ($user->role === 'owner') {
                \Illuminate\Support\Facades\Log::info('Redirecting to owner.dashboard');
                return redirect()->route('owner.dashboard')->with('success', 'Selamat datang, Owner!');
            }

            // Pelanggan not allowed in web admin
            \Illuminate\Support\Facades\Log::warning('Login denied: Pelanggan role not allowed on web', [
                'user_id' => $user->id
            ]);
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return back()->withErrors([
                'email' => 'Akses ditolak. Pelanggan hanya bisa login melalui aplikasi mobile.',
            ]);
        }

        \Illuminate\Support\Facades\Log::warning('Login failed: invalid credentials', [
            'email' => $request->email
        ]);
        return back()->withErrors([
            'email' => 'Email atau password yang dimasukkan salah.',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login')->with('success', 'Anda telah berhasil logout.');
    }
}
