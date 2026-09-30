<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
\App\Models\User::whereNotIn('email', ['admin@della.test', 'owner@della.test', 'pelanggan@della.test'])->delete();
echo "Clear completed\n";
