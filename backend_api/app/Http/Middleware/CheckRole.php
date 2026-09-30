<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        \Illuminate\Support\Facades\Log::info('CheckRole middleware triggered', [
            'url' => $request->fullUrl(),
            'user_id' => $user ? $user->id : null,
            'user_role' => $user ? $user->role : null,
            'required_roles' => $roles
        ]);

        if (!$user) {
            \Illuminate\Support\Facades\Log::warning('CheckRole: No authenticated user. Redirecting/Returning 401.');
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Silakan login kembali.'
                ], 401);
            }
            return redirect()->route('login');
        }

        if (!in_array($user->role, $roles)) {
            \Illuminate\Support\Facades\Log::warning('CheckRole: Role mismatch. Forbidden.', [
                'user_role' => $user->role,
                'required_roles' => $roles
            ]);
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden. Anda tidak memiliki hak akses untuk halaman ini.'
                ], 403);
            }
            abort(403, 'Forbidden. Anda tidak memiliki hak akses ke halaman ini.');
        }

        return $next($request);
    }
}
