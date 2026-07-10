# Changelog - Milestone 1 Frontend Polish

Date: 2026-07-09

Summary: Final polish pass addressing responsiveness, loading/error states, protected routes, and integration hooks for backend APIs.

## Added
- `src/components/common/ErrorMessage.jsx` - reusable error list UI used across pages.
- `src/components/common/Toast.jsx` - simple toast provider and `useToast()` hook for success/error notifications.
- `src/components/common/ProtectedRoute.jsx` - centralized protected route component for route guarding.
- `src/components/ui/FileDropzone.jsx` - drag-and-drop CSV uploader (previously added).
- `src/utils/csvValidator.js` - CSV parsing and header validation.
- `src/services/api.js` - axios instance with token attach + 401 handling.
- `src/services/uploadService.js` - upload helper using multipart/form-data.
- `src/services/dashboardService.js` - dashboard API helpers.
- `src/hooks/useUpload.js` - encapsulated upload state and logic.
- `src/hooks/useDashboardData.js` - encapsulated dashboard data fetching.
- Mock data and Recharts components for dashboard (`SalesTrendChart`, `TopProductsChart`).

## Fixed
- Fixed `Identifier 'axios' has already been declared` by removing duplicate import/exports in `src/services/api.js`.
- Fixed Sidebar crash: `navItems` provided via `AppContext` (role -> nav mapping) so `map()` is safe.
- Added `.env` with `VITE_API_BASE_URL` and Vite proxy configuration for `/api` to forward to backend in development.
- Added loading skeletons to `StatCard` and ensured charts accept `loading` prop.
- Implemented consistent error UI across Upload and Dashboard using `ErrorMessage`.
- Added toast notifications for upload success via `ToastProvider` and `useToast()` hook.
- Created `ProtectedRoute` component and refactored routes to use it.
- Wrapped the app with `ToastProvider` in `src/main.jsx`.

## Improvements
- Dashboard and Upload pages now show loading skeletons and errors instead of blank screens during API calls.
- Upload page supports client-side CSV preview, header validation, and a mock CSV demo.
- Services structured to use a shared axios instance with token injection and 401 handling.

## Remaining / Notes for backend integration team
- Backend endpoints must exist for:
  - `GET /api/dashboard/total-revenue`
  - `GET /api/dashboard/sales-trend?range=...`
  - `GET /api/dashboard/top-products`
  - `POST /api/sales/upload` (multipart/form-data)
- The frontend expects JSON responses; upload endpoint should return `{ success: boolean, rowsProcessed: number, errors: [] }`.
- The dev proxy uses `VITE_API_BASE_URL` (set in `.env`). Update as needed.

## How to run locally
1. Configure backend URL in `.env` (e.g., `VITE_API_BASE_URL=http://localhost:3000`).
2. Start backend.
3. Start frontend:
   ```bash
   cd info
   npm install
   npm run dev -- --port 5173
   ```

## Misc
- Removed duplicate/unused exports and fixed console errors and runtime crashes.
- If you find additional issues on specific browsers, report them and I will address CSS cross-browser fixes.

*** End of changelog
