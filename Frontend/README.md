# MarketMind AI – Frontend

## Overview
This is the React/Vite frontend of the MarketMind AI small-business sales intelligence platform. It provides a rich, responsive presentation layer for users to interact with sales data, business insights, AI-powered features, dashboards, reports, and real-time alerts.

## Frontend Technology Stack
The frontend application uses the following libraries and configurations:
- **React 19**: Core UI framework for component-based user interface development.
- **Vite**: Ultra-fast build tool and development server.
- **Tailwind CSS v4**: Utility-first CSS styling engine configured with `@tailwindcss/vite` and `@tailwindcss/postcss`.
- **React Router DOM v6**: Client-side routing and layout management.
- **Axios**: HTTP client configuration for backend service communications.
- **React Icons**: Icon library using Feather icons (`react-icons/fi`).
- **Recharts**: Composability-first chart library for rendering interactive data visualizations (Line, Area, Bar, Pie, Composed charts).
- **i18next & react-i18next**: Frameworks for handling localization and translations.
- **jsPDF**: Client-side PDF generation utility for invoice and report printing/downloads.
- **PapaParse**: CSV parsing engine for uploading and client-side validation of receipts.

---

## Main Features
- **Role-based Login & Registration**: Clean, intuitive signup/login page with role configuration.
- **Role-based Navigation**: Sidebar navigation dynamically updates to show only pages relevant to the logged-in user.
- **Sales Dashboard**: Displays key metric counters, sales trend lines, top products bar charts, active filters, and drill-down transaction details.
- **Sales Data CSV Upload**: Custom file dropzone with client-side header validation, parsing, first-5-rows previews, and mock CSV testing.
- **Invoice Creation**: Form to compile invoices with customer database searches, tax (18%), discount, interactive item tables, and live invoice generation.
- **Invoice List**: Comprehensive search, paginated display (10/25/50 items per page), multi-column sorting, printable invoices, PDF downloading, and inline edits.
- **Customer Insights**: Visualized breakdowns of customer segments (Loyal, Occasional, High-Value) with distributions and customer group summaries.
- **Recommendations**: Association-rule-based product recommendations outlining purchase count reasons and co-purchase confidence scores.
- **Anomaly Alerts**: Detection and highlighting of unusual transaction anomalies, including severity levels (Critical, Warning, Info) based on revenue value.
- **Forecast Reports**: Real-time sales predictions and forecasting trends plotted over variable time ranges (30 days to 1 year).
- **Notifications**: Slide-out drawer with live database syncing for low-stock products and overdue invoices, including mark-as-read/delete persistence.
- **Business Overview**: High-level manager summary featuring business health indexes, payment method distribution, and audit log listings.
- **Forecast vs Actual**: Interactive comparison dashboards aligning prediction points with actual sales data.
- **Inventory**: Real-time inventory monitoring showing sku, category, stock quantities, pricing, and health markers against thresholds.
- **Reports**: Live invoice-backed revenue calculations, filterable exports, and custom data tables.
- **Settings**: System configurations including profile editing, password changes, light/dark theme switching, and language translation.
- **Responsive UI**: Unified design tailored for mobile screens, tablets, and desktop displays.
- **State Feedback**: Seamless loading skeletons, empty-state screens, input validation, and connection error handling across all views.

---

## User Roles
Access permissions and navigation bars dynamically adjust according to the user's role:
1. **Business Owner (Owner)**: Unlimited access to the entire portal including Dashboard, Business Overview, Create Invoice, Invoice List, Customer Insights, Recommendations, Anomaly Alerts, Forecast Reports, Forecast vs Actual, Upload, Inventory, Reports, and Settings.
2. **Store Manager**: Access to Dashboard, Create Invoice, Invoice List, Customer Insights, Recommendations, Anomaly Alerts, Forecast Reports, Forecast vs Actual, Upload, and Inventory.
3. **Sales Executive**: Access to Dashboard, Create Invoice, Invoice List, and Upload.
4. **Admin**: Specialized dashboard, Business Overview, Settings, and User Management (CRUD actions over all system users).

---

## Dashboard & Analytics
- **KPI Cards**: Highlights real-time stats like total revenue, total transactions, low stock, pending invoices, products catalog, and active alerts.
- **Sales Trends**: Interactive line and area charts plotting revenue over time with date-range click-triggers.
- **Top Products**: Bar charts representing best-performing inventory elements.
- **Business Overview**: Comprehensive overview containing pie chart distributions for payment methods and product categories.
- **Forecast vs Actual comparison**: Composed charts plotting forecasted values alongside actual transactions for comparative performance tracking.
- **Interactive Filters**: Dynamic toolbar with predefined timeframes (Today, 7 days, 30 days, 3 months, 6 months, 1 year, and custom start/end dates) and category selectors (All, Books, Electronics).
- **Drill-down Transaction Modal**: Clicking any chart coordinate loads a searchable, exportable table containing all raw transaction details behind the selected category or timestamp.

---

## Milestone Contributions
- **Milestone 1**: 
  - Project scaffolding with React 19, Vite, and Tailwind CSS.
  - Setup of [AuthContext](file:///c:/Users/ANURA/Small-business-sales-intelligence-platform-SB7-Team1/Frontend/src/context/AuthContext.jsx) and session memory.
  - Login UI and role-based client routing.
  - Bulk CSV receipts upload validation (header check for CustomerID, ProductID, Quantity, Price, TransactionDate).
  - Responsive main dashboard wireframe.
- **Milestone 2**:
  - Live data catalog mapping for [CreateInvoice](file:///c:/Users/ANURA/Small-business-sales-intelligence-platform-SB7-Team1/Frontend/src/pages/CreateInvoice/index.jsx).
  - Invoice list page with sorting, pagination, and printing/jsPDF generation.
  - Customer segmentation insights page.
  - Affinity recommendation interface showing AI suggestions.
  - Anomaly alerts list categorized by severity level.
  - Forecast reports rendering predictive charts.
- **Milestone 3**:
  - Collapsible notification drawer coupled with [NotificationContext](file:///c:/Users/ANURA/Small-business-sales-intelligence-platform-SB7-Team1/Frontend/src/context/NotificationContext.jsx) for role-based system warnings (Admin), sales telemetry (Owner), stock limits (Manager), and invoice actions (Executive).
  - Detailed Business Overview and Forecast vs Actual pages.
  - Interactive filters with custom range picker validations and drill-down transaction modal.
  - Visual refinements including light/dark theme switches, localization toggles, and loading skeletons.
  - Jest & React Testing Library configuration and unit tests (e.g., [NotificationDrawer.test.jsx](file:///c:/Users/ANURA/Small-business-sales-intelligence-platform-SB7-Team1/Frontend/src/components/layout/__tests__/NotificationDrawer.test.jsx), [InvoiceList.test.jsx](file:///c:/Users/ANURA/Small-business-sales-intelligence-platform-SB7-Team1/Frontend/src/pages/InvoiceList/__tests__/InvoiceList.test.jsx)).

---

## API Integration
The frontend utilizes a configured Axios client located in [api.js](file:///c:/Users/ANURA/Small-business-sales-intelligence-platform-SB7-Team1/Frontend/src/services/api.js):
- **Authorization**: Interceptors attach the `authToken` key as a `Bearer` token in the `Authorization` header of outgoing requests.
- **Token Expiry**: Response interceptors catch `401 Unauthorized` states, clear session values, and issue a custom event `marketmind:auth-expired` to safely return the user to the login screen.

### Verified Backend Endpoints
- **Authentication**:
  - Login: `POST /api/auth/login`
  - Register: `POST /api/auth/register`
- **Users**:
  - Get Users: `GET /api/users`
  - Update Profile: `PATCH /api/users/:id/profile`
- **Dashboard & Telemetry**:
  - Get Summary: `GET /api/dashboard/summary`
  - Sales Trend: `GET /api/dashboard/sales-trend`
  - Top Products: `GET /api/dashboard/top-products`
  - Total Revenue: `GET /api/dashboard/total-revenue`
  - Categories Breakdown: `GET /api/analytics/categories`
  - Payment Methods: `GET /api/analytics/payment-methods`
  - System Audit Summary: `GET /api/audit-summary`
- **Upload**:
  - Sales Receipt Upload: `POST /api/sales/upload` (multipart/form-data)
- **Invoices**:
  - List Invoices: `GET /api/invoices`
  - Create Invoice: `POST /api/invoices`
  - Get Single Invoice: `GET /api/invoices/:id`
  - Bulk Update Status: `PATCH /api/invoices/bulk`
  - Record Payment: `POST /api/invoices/:id/payments`
  - Revenue Summary: `GET /api/invoices/revenue/summary`
  - Overdue Invoice Verification: `POST /api/invoices/overdue/check`
- **Customers**:
  - Customer List: `GET /api/customers`
  - Segment Groups: `GET /api/customer-groups`
- **Inventory**:
  - Stock Summary: `GET /api/inventory`
  - Products catalog: `GET /api/products/with-stock`
- **Recommendations**:
  - AI Recommendations: `GET /api/recommendations`
- **Anomalies**:
  - Anomaly Alerts: `GET /api/anomaly-detection`
- **Forecasting**:
  - Forecasting Data: `GET /api/forecast`
- **Notifications**:
  - Notification Logs: `GET /api/notifications`
  - Notification Counts: `GET /api/notifications/counts`
  - Low Stock Alerts: `GET /api/notifications/low-stock`
  - Overdue Invoice Notifications: `GET /api/notifications/overdue-invoices`

---

## Project Structure
```
Frontend/
├── public/                 # Static assets (images, heroes)
├── src/
│   ├── assets/             # Component assets and logos
│   ├── components/         # Reusable blocks
│   │   ├── common/         # Route guarding, error states, and Toast banners
│   │   ├── layout/         # Navigation Navbar, Sidebar, and NotificationDrawer
│   │   └── ui/             # Reusable Buttons, Input boxes, and Charts
│   ├── context/            # React contexts (AuthContext, AppContext, NotificationContext)
│   ├── hooks/              # Custom hooks (useDashboardData, useUpload)
│   ├── layouts/            # Layout wraps (DashboardLayout)
│   ├── pages/              # Views (Dashboard, Login, CreateInvoice, InvoiceList, etc.)
│   ├── routes/             # AppRoutes setup
│   ├── services/           # Axios service layer (api.js, authService.js, etc.)
│   ├── utils/              # Export CSV/PDF tools, validator utilities, and i18n
│   ├── App.jsx             # Main Application root
│   ├── main.jsx            # DOM mounting and provider wrapping
│   └── setupTests.js       # Testing setup for Jest
├── babel.config.cjs        # Babel transpiler configuration
├── jest.config.cjs         # Jest unit test configuration
├── postcss.config.js       # PostCSS compiler configuration
├── tailwind.config.js      # Tailwind styling setup
├── vite.config.js          # Vite server build configuration
└── package.json            # Scripts and dependencies
```

---

## Installation
Ensure Node.js is installed, then run the following in the `Frontend/` folder:
```bash
npm install
```

## Development
To spin up the development server locally:
```bash
npm run dev
```

## Production Build
To output optimized production files:
```bash
npm run build
```

## Testing
To run the Jest unit tests:
```bash
npm run test
```

---

## Responsive Design
The frontend dashboard employs fluid, responsive grids and flexible layouts using Tailwind CSS. 
- Sidebars dynamically compress to icon-only models on medium/large screens (`xl` breakpoint) and adapt as slide-out overlays on mobile viewports.
- Responsive breakpoints (`sm`, `md`, `lg`, `xl`) ensure that metric statistics cards, visualization graphs, tables, and modal windows scale smoothly from mobile resolutions to high-definition monitors.

## Development Notes
- **API Environment**: Keep `VITE_API_BASE_URL` updated in your `.env` or system environment settings to map Axios client endpoints correctly.
- **Routing**: Always wrap routes in [RoleGuard](file:///c:/Users/ANURA/Small-business-sales-intelligence-platform-SB7-Team1/Frontend/src/components/common/RoleGuard.jsx) or [ProtectedRoute](file:///c:/Users/ANURA/Small-business-sales-intelligence-platform-SB7-Team1/Frontend/src/components/common/ProtectedRoute.jsx) wrapper elements to enforce role-based access.
- **Styling Guidelines**: Use tailwind classes and respect the dark/light variables setup in [index.css](file:///c:/Users/ANURA/Small-business-sales-intelligence-platform-SB7-Team1/Frontend/src/index.css).
- **Internationalization**: Do not write hardcoded text inside page elements; define localization tags using the translations catalogs under `utils/i18n`.
