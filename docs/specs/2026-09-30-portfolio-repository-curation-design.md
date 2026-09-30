# Portfolio Repository Curation & Showcase Design

- **Date:** 2026-09-30
- **Author:** FJR (`fajar-romadhan`)
- **Status:** Draft / Ready for User Review

---

## 1. Executive Summary & Purpose

Transforming the **Della Frozen Mart Mobile E-Commerce** codebase into a clean, professional, and showcase-grade GitHub portfolio repository under the GitHub Pro profile [`fajar-romadhan`](https://github.com/fajar-romadhan). 

The goal is to produce a repository that demonstrates high engineering rigor, clean code organization, modern architecture, and aesthetic visual previews while rigorously excluding personal client documents, hardcoded credentials, and development build artifacts.

---

## 2. Project Architecture & Feature Highlights

Della Frozen Mart is an omni-channel quick commerce platform for frozen foods tailored for hyper-local delivery in Tanjung Enim & Lawang Kidul, South Sumatra, Indonesia.

### Core Modules:
1. **Consumer Mobile App (React Native & Expo SDK 54)**:
   - Modern food catalog browsing, smart search, and category filtering.
   - **Loyalty Points System (Kopi Kenangan & Superindo Style)**: Automatic calculation (1 pt / Rp 50.000 spent), 10 pts = 1 free reward product, supporting both in-checkout redemption and direct profile claim.
   - **Smart Spatially-Aware Geocoding**: Local database cache of 2.138 OSM points, multi-layer reverse geocoding, and Haversine formula calculation for a 10 KM delivery perimeter.
   - **Interactive Satellite Map (ArcGIS World Imagery)**: Live switch between standard street view and high-resolution satellite imagery with radius overlays.
   - **Offline-First QRIS Payment**: Base64 local image generation via `expo-file-system/legacy` & `expo-sharing` enabling 100% offline barcode saving to the phone gallery.
   - **Realtime In-App Hub**: Live order chat and global spring animated heads-up notification pop-ups with sound and haptics.
2. **Backend REST API & Web Management Portal (Laravel 11)**:
   - Token-authenticated RESTful API endpoints powered by Laravel Sanctum.
   - Admin Web Portal: Kanban order status pipeline, single-modal courier assignment, stock-in management, thermal receipt / invoice generation.
   - Owner Executive Portal: Real-time sales analytics charts, profit margins, loyalty points ROI, and date-filtered audit activity logs.
   - Robust Feature & Unit Test Suite: 64 automated PHPUnit tests (250 assertions) passing 100%.

---

## 3. Curated Repository Structure

The curated repository will be structured cleanly as follows:

```text
della-frozenmart-mobile-ecommerce/
├── backend_api/                 # Laravel 11 REST API & Blade Management Web
│   ├── app/
│   │   ├── Console/Commands/    # Spatial OSM import commands
│   │   ├── Http/Controllers/    # API & Web Controllers (Auth, Order, Point, Geo)
│   │   ├── Models/              # 15 Eloquent Models with loyalty & order relations
│   │   └── Services/            # PointService, StockService
│   ├── database/
│   │   ├── migrations/          # Structured MySQL schema migrations
│   │   └── seeders/             # Initial seeder data & 2.138 geocache points
│   ├── resources/views/         # Admin & Owner Blade templates (Kanban, Reports)
│   ├── routes/                  # api.php, web.php, console.php
│   ├── tests/Feature/           # PHPUnit test suite
│   ├── .env.example             # Clean environment template
│   ├── composer.json & lock
│   └── phpunit.xml
├── mobile_app/                  # React Native & Expo Mobile Client
│   ├── src/
│   │   ├── components/          # Reusable UI & Loyalty Modals
│   │   ├── context/             # AuthContext, OrderContext, NotificationContext
│   │   ├── core/                # api.js, notificationService.js
│   │   ├── navigation/          # AppNavigator.js (Stack & Tabs)
│   │   ├── screens/             # 28 Screens (Customer, Admin, Owner, Address)
│   │   └── utils/               # qrisHelper.js, reportExportHelper.js
│   ├── assets/                  # App icon, splash screen, QRIS asset
│   ├── App.js & app.json
│   ├── package.json & lock
│   └── babel.config.js
├── docs/
│   ├── screenshots/             # High-resolution portfolio visual previews
│   │   ├── customer_app_preview.jpg
│   │   ├── satellite_map_preview.jpg
│   │   └── admin_dashboard_preview.jpg
│   └── superpowers/specs/       # Architectural design specifications
├── .gitignore                   # Comprehensive ignore rules
└── README.md                    # Showcase-grade GitHub Portfolio Readme
```

### Strict Exclusion Policy (Files Removed):
- `Proposal_AfnyIstiqomah1.docx` (Personal client university thesis).
- `infoakun.txt` (Migrated to clean table in `README.md`).
- `backend_api/.env` (Local confidential settings).
- `backend_api/storage/logs/*.log`, session files, `.phpunit.result.cache`.
- Uploaded dummy testing photos (`storage/app/public/ktp_photos/*`, `payments/*`).
- `node_modules/`, `vendor/`, `.expo/`, `.claude/`.

---

## 4. Visual Previews & Showcase Assets

Three high-resolution mockups generated and stored under `docs/screenshots/`:
1. `customer_app_preview.jpg`: Mobile customer shopping experience, catalog, and Della Rewards Club loyalty card.
2. `satellite_map_preview.jpg`: Interactive satellite map view with 10 KM delivery radius and offline QRIS payment download card.
3. `admin_dashboard_preview.jpg`: Admin Kanban order management board alongside Owner real-time executive sales analytics.

---

## 5. Deployment & Remote Linking Workflow

1. User creates the remote repository on GitHub: `https://github.com/fajar-romadhan/<repo-name>.git`.
2. Antigravity prepares the clean curated files, copies the high-res screenshots to `docs/screenshots/`, and writes the flagship `README.md`.
3. Configure Git user:
   - `git config user.name "FJR"`
   - `git config user.email "atangray6@gmail.com"`
4. Commit clean curated files and push to remote `main` branch.
