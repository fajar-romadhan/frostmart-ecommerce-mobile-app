<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AlamatPengguna;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'            => 'required|string|max:255',
            'email'           => 'required|string|email|max:255|unique:pengguna,email',
            'password'        => 'required|string|min:8|confirmed',
            'phone'           => 'nullable|string|max:20',
            'initial_address' => 'nullable|string|max:500',
            'initial_lat'     => 'nullable|numeric|between:-90,90',
            'initial_lng'     => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $user = DB::transaction(function () use ($request) {
                $lat = $request->input('initial_lat');
                $lng = $request->input('initial_lng');
                $initialAddress = trim($request->input('initial_address', ''));

                // Jika alamat diisi tapi koordinat belum ada (input manual), cari koordinat dari geocode_cache
                if (!empty($initialAddress) && (empty($lat) || empty($lng))) {
                    $cached = DB::table('geocode_cache')
                        ->where('aktif', true)
                        ->where(function ($q) use ($initialAddress) {
                            $q->where('nama', 'LIKE', '%' . $initialAddress . '%')
                              ->orWhere('alamat_lengkap', 'LIKE', '%' . $initialAddress . '%');
                        })
                        ->first();

                    if ($cached) {
                        $lat = $cached->latitude;
                        $lng = $cached->longitude;
                    } else {
                        // Default koordinat Tanjung Enim (Della Frozen Mart Pusat)
                        $lat = -3.7638720;
                        $lng = 103.8079257;
                    }
                }

                $user = User::create([
                    'name'      => $request->name,
                    'email'     => $request->email,
                    'password'  => Hash::make($request->password),
                    'role'      => 'pelanggan',
                    'phone'     => $request->phone,
                    'address'   => $initialAddress ?: null,
                    'latitude'  => $lat,
                    'longitude' => $lng,
                ]);

                // Simpan alamat awal ke tabel alamat_pengguna sebagai alamat UTAMA
                if (!empty($initialAddress)) {
                    AlamatPengguna::create([
                        'pengguna_id'      => $user->id,
                        'label'            => 'Rumah',
                        'nama_penerima'    => $user->name,
                        'telepon_penerima' => $user->phone ?? '',
                        'alamat_lengkap'   => $initialAddress,
                        'latitude'         => $lat,
                        'longitude'        => $lng,
                        'is_utama'         => true,
                    ]);
                }

                return $user;
            });

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registrasi berhasil.',
                'data'    => [
                    'user'  => $user,
                    'token' => $token
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan server. Silakan coba lagi.',
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        \Illuminate\Support\Facades\Log::info('API Login attempt', [
            'email' => $request->email,
            'ip' => $request->ip()
        ]);

        if ($validator->fails()) {
            \Illuminate\Support\Facades\Log::warning('API Login failed: validation errors', [
                'errors' => $validator->errors()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Email dan password wajib diisi.',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            \Illuminate\Support\Facades\Log::warning('API Login failed: invalid credentials', [
                'email' => $request->email
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.'
            ], 401);
        }

        \Illuminate\Support\Facades\Log::info('API Login success', [
            'user_id' => $user->id,
            'role' => $user->role
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => $user,
                'token' => $token
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.'
        ], 200);
    }

    public function profile(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()
        ], 200);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'          => 'required|string|max:255',
            'phone'         => 'nullable|string|max:20',
            'profile_photo' => 'nullable|file|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors()
            ], 422);
        }

        // Handle profile photo upload
        if ($request->hasFile('profile_photo')) {
            $photoFile = $request->file('profile_photo');
            $ext = strtolower($photoFile->getClientOriginalExtension());

            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'heic', 'heif'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format foto profil harus berupa JPG, PNG, atau HEIC.',
                ], 422);
            }

            // Delete old profile photo if exists
            if ($user->foto_profil) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->foto_profil);
            }

            $path = $photoFile->store('profile_photos', 'public');
            $user->foto_profil = $path;
        }

        $user->nama    = $request->name;
        $user->telepon = $request->phone;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data'    => $user->fresh()
        ], 200);
    }

    public function deleteProfilePhoto(Request $request)
    {
        $user = $request->user();

        if ($user->foto_profil) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->foto_profil);
            $user->foto_profil = null;
            $user->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil dihapus.',
            'data'    => $user->fresh()
        ], 200);
    }
}
