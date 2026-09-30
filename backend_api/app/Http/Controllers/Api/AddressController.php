<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlamatPengguna;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use Exception;

class AddressController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $addresses = AlamatPengguna::where('pengguna_id', $user->id)
            ->orderBy('is_utama', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $addresses
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'label' => 'required|string|max:50',
            'nama_penerima' => 'required|string|max:100',
            'telepon_penerima' => 'required|string|max:20',
            'alamat_lengkap' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_utama' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $isFirst = AlamatPengguna::where('pengguna_id', $user->id)->count() === 0;
        $isUtama = $isFirst ? true : (bool) $request->input('is_utama', false);

        try {
            $address = DB::transaction(function () use ($user, $request, $isUtama) {
                if ($isUtama) {
                    AlamatPengguna::where('pengguna_id', $user->id)->update(['is_utama' => false]);
                }

                return AlamatPengguna::create([
                    'pengguna_id' => $user->id,
                    'label' => $request->label,
                    'nama_penerima' => $request->nama_penerima,
                    'telepon_penerima' => $request->telepon_penerima,
                    'alamat_lengkap' => $request->alamat_lengkap,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'is_utama' => $isUtama,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Alamat berhasil ditambahkan.',
                'data' => $address
            ], 201); // Use 201 Created or 200
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan alamat.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $address = AlamatPengguna::where('pengguna_id', $request->user()->id)->find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'label' => 'required|string|max:50',
            'nama_penerima' => 'required|string|max:100',
            'telepon_penerima' => 'required|string|max:20',
            'alamat_lengkap' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_utama' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $isUtama = (bool) $request->input('is_utama', false);

        try {
            DB::transaction(function () use ($user, $address, $request, $isUtama) {
                if ($isUtama) {
                    AlamatPengguna::where('pengguna_id', $user->id)->update(['is_utama' => false]);
                }

                $address->update([
                    'label' => $request->label,
                    'nama_penerima' => $request->nama_penerima,
                    'telepon_penerima' => $request->telepon_penerima,
                    'alamat_lengkap' => $request->alamat_lengkap,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'is_utama' => $isUtama,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Alamat berhasil diperbarui.',
                'data' => $address->fresh()
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui alamat.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $address = AlamatPengguna::where('pengguna_id', $request->user()->id)->find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan.'
            ], 404);
        }

        $user = $request->user();
        $wasUtama = $address->is_utama;

        try {
            DB::transaction(function () use ($user, $address, $wasUtama) {
                $address->delete();

                // If the deleted address was the main one, set another address as default if available
                if ($wasUtama) {
                    $nextAddress = AlamatPengguna::where('pengguna_id', $user->id)
                        ->orderBy('created_at', 'desc')
                        ->first();
                    if ($nextAddress) {
                        $nextAddress->update(['is_utama' => true]);
                    }
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Alamat berhasil dihapus.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus alamat.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Set default address quick action.
     */
    public function setDefault(Request $request, $id)
    {
        $address = AlamatPengguna::where('pengguna_id', $request->user()->id)->find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan.'
            ], 404);
        }

        $user = $request->user();

        try {
            DB::transaction(function () use ($user, $address) {
                AlamatPengguna::where('pengguna_id', $user->id)->update(['is_utama' => false]);
                $address->update(['is_utama' => true]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Alamat utama berhasil diperbarui.',
                'data' => $address->fresh()
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal merubah alamat utama.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Autocomplete address suggestions from local geocode_cache.
     * Public endpoint — no auth required. Used in registration form.
     * Query: GET /api/addresses/suggestions?q=keyword
     */
    public function searchSuggestions(Request $request)
    {
        $q = trim($request->input('q', ''));

        if (strlen($q) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $keyword = '%' . $q . '%';

        $results = DB::table('geocode_cache')
            ->where('aktif', true)
            ->where(function ($query) use ($keyword) {
                $query->where('nama', 'LIKE', $keyword)
                      ->orWhere('alamat_lengkap', 'LIKE', $keyword);
            })
            ->orderByRaw("CASE
                WHEN nama LIKE ? THEN 0
                WHEN alamat_lengkap LIKE ? THEN 1
                ELSE 2
            END", [$keyword, $keyword])
            ->orderBy('tipe') // jalan first
            ->limit(8)
            ->get(['nama', 'alamat_lengkap', 'tipe', 'latitude', 'longitude']);

        return response()->json([
            'success' => true,
            'data'    => $results,
        ]);
    }

    /**
     * Reverse geocoding using multi-engine pipeline (Google Maps → Photon → Nominatim → BigDataCloud).
     */
    public function reverseGeocode(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $lat = (float) $request->input('lat');
        $lng = (float) $request->input('lng');
        $fallbackAddress = 'Tanjung Enim, Lawang Kidul, Muara Enim';

        // ─────────────────────────────────────────────
        // ENGINE 0: Local DB Multi-layer Spatial Lookup (2.138 titik geocode_cache)
        // Menemukan POI terdekat, jalan/gang terdekat, dan kelurahan/desa terdekat
        // untuk menyusun alamat yang sangat detail dan presisi di Tanjung Enim.
        // ─────────────────────────────────────────────
        try {
            // 1. Cari titik spesifik terdekat (POI, Toko, Bangunan, Masjid, Sekolah, RS, SPBU) dalam radius 150m
            $nearestPoi = \DB::table('geocode_cache')
                ->where('aktif', true)
                ->whereIn('tipe', ['toko', 'pasar', 'sekolah', 'masjid', 'rs', 'spbu', 'kantor_pemerintah', 'poi'])
                ->selectRaw("
                    *,
                    (6371000 * ACOS(
                        LEAST(1.0, GREATEST(-1.0,
                            COS(RADIANS(?)) * COS(RADIANS(latitude))
                            * COS(RADIANS(longitude) - RADIANS(?))
                            + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                        ))
                    )) AS jarak_meter
                ", [$lat, $lng, $lat])
                ->having('jarak_meter', '<=', 150)
                ->orderBy('jarak_meter')
                ->first();

            // 2. Cari jalan / gang / lorong terdekat dalam radius 500m
            $nearestRoad = \DB::table('geocode_cache')
                ->where('aktif', true)
                ->where('tipe', 'jalan')
                ->selectRaw("
                    *,
                    (6371000 * ACOS(
                        LEAST(1.0, GREATEST(-1.0,
                            COS(RADIANS(?)) * COS(RADIANS(latitude))
                            * COS(RADIANS(longitude) - RADIANS(?))
                            + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                        ))
                    )) AS jarak_meter
                ", [$lat, $lng, $lat])
                ->having('jarak_meter', '<=', 500)
                ->orderBy('jarak_meter')
                ->first();

            // 3. Cari kelurahan / desa terdekat
            $nearestVillage = \DB::table('geocode_cache')
                ->where('aktif', true)
                ->where('tipe', 'kelurahan')
                ->selectRaw("
                    *,
                    (6371000 * ACOS(
                        LEAST(1.0, GREATEST(-1.0,
                            COS(RADIANS(?)) * COS(RADIANS(latitude))
                            * COS(RADIANS(longitude) - RADIANS(?))
                            + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                        ))
                    )) AS jarak_meter
                ", [$lat, $lng, $lat])
                ->orderBy('jarak_meter')
                ->first();

            $parts = [];

            // A. POI sangat dekat (< 80m)
            if ($nearestPoi && $nearestPoi->jarak_meter <= 80) {
                $parts[] = $nearestPoi->nama;
            }

            // B. Nama jalan / gang / lorong
            if ($nearestRoad) {
                $roadName = $nearestRoad->nama;
                if (!in_array($roadName, $parts)) {
                    $parts[] = $roadName;
                }
            } elseif ($nearestPoi && !in_array($nearestPoi->nama, $parts)) {
                $parts[] = $nearestPoi->nama;
            }

            // C. Nama Kelurahan / Desa
            if ($nearestVillage) {
                $villageName = $nearestVillage->nama;
                if (!in_array($villageName, $parts)) {
                    $parts[] = $villageName;
                }
            } else {
                $parts[] = ($lat < -3.765) ? 'Tanjung Enim Selatan' : 'Tanjung Enim';
            }

            // D. Kecamatan & Kabupaten
            $parts[] = 'Lawang Kidul';
            $parts[] = 'Muara Enim';

            // Jika menemukan jalan atau POI terdekat
            if ($nearestRoad || ($nearestPoi && $nearestPoi->jarak_meter <= 150)) {
                $completeAddress = implode(', ', array_unique($parts));
                return response()->json([
                    'success' => true,
                    'address' => $completeAddress,
                    'engine'  => 'local_db_spatial',
                    'detail'  => [
                        'poi'     => $nearestPoi?->nama,
                        'road'    => $nearestRoad?->nama,
                        'village' => $nearestVillage?->nama,
                        'jarak'   => round($nearestRoad?->jarak_meter ?? $nearestPoi?->jarak_meter ?? 0),
                    ]
                ]);
            }
        } catch (\Exception $e) {
            \Log::warning('Enhanced geocode_cache lookup failed: ' . $e->getMessage());
        }

        // ─────────────────────────────────────────────
        // ENGINE 1: Google Maps Geocoding API (Spesifik — iterasi semua hasil)
        // Strategi: Pilih hasil dengan location_type paling detail dulu:
        //   ROOFTOP (bangunan tepat) → RANGE_INTERPOLATED (interpolasi jalan) → GEOMETRIC_CENTER
        //   Kemudian susun alamat dari address_component secara manual (bukan formatted_address)
        //   untuk hasil yang jauh lebih spesifik di wilayah pedesaan Tanjung Enim.
        // ─────────────────────────────────────────────
        try {
            $googleKey = env('GOOGLE_MAPS_API_KEY', 'AIzaSyCI4cZ2XCD5SZFs5gPEfZ8K6OBfBPU6hGk');
            $googleResp = Http::timeout(6)->get('https://maps.googleapis.com/maps/api/geocode/json', [
                'latlng'   => "{$lat},{$lng}",
                'key'      => $googleKey,
                'language' => 'id',
                'result_type' => 'street_address|route|neighborhood|sublocality|locality',
            ]);

            if ($googleResp->successful()) {
                $gData = $googleResp->json();
                $results = $gData['results'] ?? [];

                if (($gData['status'] ?? '') === 'OK' && !empty($results)) {
                    // Urutan prioritas spesifisitas location_type
                    $typePriority = ['ROOFTOP' => 0, 'RANGE_INTERPOLATED' => 1, 'GEOMETRIC_CENTER' => 2, 'APPROXIMATE' => 3];

                    // Urutkan results berdasarkan location_type (paling spesifik dulu)
                    usort($results, function ($a, $b) use ($typePriority) {
                        $aType = $a['geometry']['location_type'] ?? 'APPROXIMATE';
                        $bType = $b['geometry']['location_type'] ?? 'APPROXIMATE';
                        return ($typePriority[$aType] ?? 3) - ($typePriority[$bType] ?? 3);
                    });

                    // Bangun alamat dari komponen terstruktur (bukan formatted_address mentah)
                    foreach ($results as $result) {
                        $components = $result['address_components'] ?? [];
                        if (empty($components)) continue;

                        // Ekstrak komponen alamat ke dalam map berdasarkan type
                        $compMap = [];
                        foreach ($components as $comp) {
                            foreach ($comp['types'] as $type) {
                                $compMap[$type] = $comp['long_name'];
                            }
                        }

                        $parts = [];

                        // 1. Nomor bangunan + nama jalan (paling spesifik)
                        $streetNumber = $compMap['street_number'] ?? '';
                        $route        = $compMap['route'] ?? '';
                        if ($route) {
                            $parts[] = $streetNumber ? "{$route} No. {$streetNumber}" : $route;
                        }

                        // 2. Kelurahan / Desa (sublocality level 1–3)
                        foreach (['sublocality_level_1', 'sublocality_level_2', 'sublocality_level_3', 'sublocality', 'neighborhood'] as $k) {
                            if (!empty($compMap[$k]) && !in_array($compMap[$k], $parts)) {
                                $parts[] = $compMap[$k];
                                break;
                            }
                        }

                        // 3. Kecamatan (administrative_area_level_3)
                        if (!empty($compMap['administrative_area_level_3']) && !in_array($compMap['administrative_area_level_3'], $parts)) {
                            $parts[] = $compMap['administrative_area_level_3'];
                        }

                        // 4. Kabupaten / Kota (administrative_area_level_2)
                        if (!empty($compMap['administrative_area_level_2']) && !in_array($compMap['administrative_area_level_2'], $parts)) {
                            $city = $compMap['administrative_area_level_2'];
                            // Bersihkan prefix "Kabupaten" jika sudah ada nama yang cukup
                            $parts[] = $city;
                        }

                        // Hanya kembalikan jika ada minimal 2 komponen bermakna
                        if (count($parts) >= 2) {
                            $formatted = implode(', ', $parts);
                            return response()->json([
                                'success' => true,
                                'address' => $formatted,
                                'engine'  => 'google_structured',
                            ]);
                        }

                        // Fallback ke formatted_address jika komponen tidak cukup
                        $fallbackFormatted = $result['formatted_address'] ?? '';
                        if ($fallbackFormatted) {
                            $fallbackFormatted = preg_replace('/,?\s*\d{5}/', '', $fallbackFormatted);
                            $fallbackFormatted = preg_replace('/,?\s*Indonesia\s*$/i', '', $fallbackFormatted);
                            $fallbackFormatted = trim($fallbackFormatted, ', ');
                            if (strlen($fallbackFormatted) > 8) {
                                return response()->json([
                                    'success' => true,
                                    'address' => $fallbackFormatted,
                                    'engine'  => 'google_formatted',
                                ]);
                            }
                        }
                    }
                }
            }
        } catch (Exception $e) {
            // Lanjut ke engine berikutnya
        }

        // ─────────────────────────────────────────────
        // ENGINE 2: Photon Komoot (POI / Jalan lintas / Pasar / Distrik)
        // ─────────────────────────────────────────────
        try {
            $photonResp = Http::withHeaders([
                'User-Agent' => 'DellaFrozenMart/1.0 (antianjay39@gmail.com)',
            ])->timeout(5)->get('https://photon.komoot.io/reverse', [
                'lat' => $lat,
                'lon' => $lng,
            ]);

            if ($photonResp->successful()) {
                $pData = $photonResp->json();
                $features = $pData['features'] ?? [];
                if (!empty($features[0]['properties'])) {
                    $props = $features[0]['properties'];
                    $parts = [];

                    // POI / Nama Gedung / Toko / Pasar
                    foreach (['name', 'osm_key'] as $k) {
                        if (!empty($props[$k]) && strlen(trim($props[$k])) > 2) {
                            $val = trim($props[$k]);
                            if (!in_array($val, $parts)) $parts[] = $val;
                            break;
                        }
                    }

                    // Jalan
                    if (!empty($props['street'])) {
                        $val = trim($props['street']);
                        if (!in_array($val, $parts)) $parts[] = $val;
                    }

                    // Distrik/Kelurahan
                    foreach (['district', 'suburb', 'locality'] as $k) {
                        if (!empty($props[$k])) {
                            $val = trim($props[$k]);
                            if (!in_array($val, $parts)) { $parts[] = $val; break; }
                        }
                    }

                    // Kota/Kabupaten
                    foreach (['city', 'county'] as $k) {
                        if (!empty($props[$k])) {
                            $val = trim($props[$k]);
                            if (!in_array($val, $parts)) { $parts[] = $val; break; }
                        }
                    }

                    if (count($parts) >= 2) {
                        $formatted = implode(', ', $parts);
                        return response()->json(['success' => true, 'address' => $formatted, 'engine' => 'photon']);
                    }
                }
            }
        } catch (Exception $e) {
            // Lanjut ke engine berikutnya
        }

        // ─────────────────────────────────────────────
        // ENGINE 3: Nominatim OpenStreetMap (jsonv2, zoom 18)
        // ─────────────────────────────────────────────
        try {
            $nominatimResp = Http::withHeaders([
                'User-Agent' => 'DellaFrozenMart/1.0 (antianjay39@gmail.com)',
            ])->timeout(5)->get('https://nominatim.openstreetmap.org/reverse', [
                'format'          => 'jsonv2',
                'lat'             => $lat,
                'lon'             => $lng,
                'zoom'            => 18,
                'accept-language' => 'id',
            ]);

            if ($nominatimResp->successful()) {
                $nData = $nominatimResp->json();
                $addr  = $nData['address'] ?? [];
                $parts = [];

                // 1. POI / Landmark
                foreach (['amenity', 'building', 'shop', 'office', 'tourism', 'leisure', 'historic', 'house_name', 'residential'] as $key) {
                    if (!empty($addr[$key])) {
                        $val = trim($addr[$key]);
                        if ($val && !in_array($val, $parts)) { $parts[] = $val; break; }
                    }
                }

                // 2. Road / Street
                foreach (['road', 'pedestrian', 'highway', 'path', 'footway'] as $key) {
                    if (!empty($addr[$key])) {
                        $val = trim($addr[$key]);
                        if ($val && !in_array($val, $parts)) { $parts[] = $val; break; }
                    }
                }

                // 3. Suburb / Village / Neighbourhood
                foreach (['suburb', 'village', 'neighbourhood', 'city_district', 'quarter', 'hamlet'] as $key) {
                    if (!empty($addr[$key])) {
                        $val = trim($addr[$key]);
                        if ($val && !in_array($val, $parts)) $parts[] = $val;
                    }
                }

                // 4. City / Regency / County
                foreach (['town', 'city', 'county', 'municipality'] as $key) {
                    if (!empty($addr[$key])) {
                        $val = trim($addr[$key]);
                        if ($val && !in_array($val, $parts)) { $parts[] = $val; break; }
                    }
                }

                // 5. State
                if (!empty($addr['state'])) {
                    $val = trim($addr['state']);
                    if ($val && !in_array($val, $parts)) $parts[] = $val;
                }

                // 6. Postcode
                $postcode = !empty($addr['postcode']) ? trim($addr['postcode']) : '';

                if (count($parts) >= 2) {
                    $formattedAddress = implode(', ', $parts);
                    if ($postcode && strpos($formattedAddress, $postcode) === false) {
                        $formattedAddress .= ' ' . $postcode;
                    }
                    return response()->json(['success' => true, 'address' => $formattedAddress, 'engine' => 'nominatim']);
                }

                // Fallback Nominatim ke display_name
                $rawDn = $nData['display_name'] ?? '';
                if ($rawDn) {
                    $rawParts = array_map('trim', explode(',', $rawDn));
                    $filtered = array_filter($rawParts, fn($p) => !in_array($p, ['Indonesia', 'Sumatra', 'Sumatera']));
                    $formattedAddress = implode(', ', $filtered);
                    if (strlen($formattedAddress) > 5) {
                        return response()->json(['success' => true, 'address' => $formattedAddress, 'engine' => 'nominatim_display']);
                    }
                }
            }
        } catch (Exception $e) {
            // Lanjut ke engine berikutnya
        }

        // ─────────────────────────────────────────────
        // ENGINE 4: BigDataCloud Reverse Geocoding (Administratif)
        // ─────────────────────────────────────────────
        try {
            $bdcResp = Http::timeout(5)->get('https://api.bigdatacloud.net/data/reverse-geocode-client', [
                'latitude'        => $lat,
                'longitude'       => $lng,
                'localityLanguage' => 'id',
            ]);

            if ($bdcResp->successful()) {
                $bData = $bdcResp->json();
                $parts = [];

                if (!empty($bData['locality']))          $parts[] = trim($bData['locality']);
                if (!empty($bData['city']))              $parts[] = trim($bData['city']);
                if (!empty($bData['principalSubdivision'])) $parts[] = trim($bData['principalSubdivision']);

                if (count($parts) >= 2) {
                    return response()->json(['success' => true, 'address' => implode(', ', $parts), 'engine' => 'bigdatacloud']);
                }
            }
        } catch (Exception $e) {
            // Lanjut ke fallback akhir
        }

        // ─────────────────────────────────────────────
        // FALLBACK AKHIR: Tanjung Enim (wilayah toko)
        // ─────────────────────────────────────────────
        return response()->json([
            'success' => true,
            'address' => $fallbackAddress,
            'engine'  => 'fallback',
        ]);
    }


    /**
     * Helper to get driving distance from OSRM with Haversine fallback.
     */
    private function getDrivingDistance($lat1, $lon1, $lat2, $lon2)
    {
        try {
            $url = "http://router.project-osrm.org/route/v1/driving/{$lon1},{$lat1};{$lon2},{$lat2}";
            $response = Http::timeout(3)->get($url, ['overview' => 'false']);
            if ($response->successful()) {
                $data = $response->json();
                if (!empty($data['routes'][0]['distance'])) {
                    return $data['routes'][0]['distance'] / 1000;
                }
            }
        } catch (Exception $e) {
            // fallback
        }

        // Haversine formula fallback
        $theta = $lon1 - $lon2;
        $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
        
        // Prevent acos NAN error if values slightly out of range
        if ($dist > 1.0) $dist = 1.0;
        if ($dist < -1.0) $dist = -1.0;

        $dist = acos($dist);
        $dist = rad2deg($dist);
        $miles = $dist * 60 * 1.1515;
        $km = $miles * 1.609344;
        
        return $km * 1.25; // 1.25 winding factor
    }

    /**
     * Calculate shipping fee based on closest branch and distance.
     */
    public function calculateShipping(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $lat = $request->input('lat');
        $lng = $request->input('lng');

        $branches = \App\Models\CabangToko::all();

        if ($branches->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada cabang toko tersedia.'
            ], 400);
        }

        $closestBranch = null;
        $minDistance = 999999;

        foreach ($branches as $branch) {
            $distance = $this->getDrivingDistance($lat, $lng, $branch->latitude, $branch->longitude);
            if ($distance < $minDistance) {
                $minDistance = $distance;
                $closestBranch = $branch;
            }
        }

        // Limit to 10 km
        if ($minDistance > 10) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat Anda berada di luar jangkauan pengiriman Della Frozen Mart (Maksimal 10 km).'
            ], 400);
        }

        // Perhitungan Ongkir:
        // <= 5 km: Rp 5.000
        // > 5 km (sampai 10 km): Rp 10.000
        if ($minDistance <= 5) {
            $shippingFee = 5000;
        } else {
            $shippingFee = 10000;
        }

        return response()->json([
            'success' => true,
            'distance' => round($minDistance, 2),
            'shipping_fee' => (int) $shippingFee,
            'branch' => [
                'id' => $closestBranch->id,
                'name' => $closestBranch->nama,
                'address' => $closestBranch->alamat
            ]
        ]);
    }

    /**
     * List all branches.
     */
    public function listBranches()
    {
        $branches = \App\Models\CabangToko::all();
        return response()->json([
            'success' => true,
            'data' => $branches
        ]);
    }
}
