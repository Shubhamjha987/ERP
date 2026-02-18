# EnterpriseERP — Frontend

A production-grade ERP frontend built with **React 18 + TypeScript + Material UI** connected to the Spring Boot backend.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development (proxies /api to localhost:8080)
npm run dev

# Production build
npm run build
```

Open http://localhost:3000

## 🔐 Demo Credentials
| Username | Password | Role |
|----------|----------|------|
| admin | Admin@123 | ADMIN |
| manager | Manager@123 | MANAGER |
| staff | Staff@123 | STAFF |

## 🏗 Tech Stack
| Category | Library |
|----------|---------|
| Framework | React 18 + TypeScript |
| UI | Material UI v5 |
| State | Redux Toolkit + React Query |
| Routing | React Router v6 |
| API | Axios with JWT interceptors |
| Forms | React Hook Form |
| Tables | MUI DataGrid |
| Charts | Recharts |
| Notifications | notistack |

## 📁 Project Structure
```
src/
├── api/
│   ├── client.ts       # Axios instance with JWT interceptors
│   └── endpoints.ts    # All API functions by module
├── components/
│   └── layout/         # AppLayout (sidebar + header)
├── hooks/
│   └── redux.ts        # Typed Redux hooks
├── pages/
│   ├── Login/          # JWT login with demo quick-fill
│   ├── Dashboard/      # KPI cards + charts
│   ├── Products/       # List + Create/Edit form
│   ├── Inventory/      # Stock levels + movements
│   ├── PurchaseOrders/ # List + Create + Detail
│   ├── SalesOrders/    # List + Create + Detail (with lifecycle stepper)
│   ├── Suppliers/      # List + CRUD modal
│   ├── Analytics/      # Revenue, stock, supplier charts
│   └── Users/          # User management (Admin only)
├── redux/
│   └── store.ts        # Auth + UI slices
├── types/
│   └── index.ts        # Complete TypeScript types
├── utils/
│   └── format.ts       # Currency, date formatters
└── theme.ts            # Light/dark MUI theme (IBM Plex)
```

## 🔄 Backend Connection

Vite dev server proxies `/api` to `http://localhost:8080`.

For production, set `VITE_API_URL` in `.env`:
```
VITE_API_URL=https://your-backend.com/api
```

## 🎨 Design System
- **Font**: IBM Plex Sans + IBM Plex Mono
- **Primary**: Electric Cyan (#00B4D8)
- **Theme**: Light/Dark toggle in top header
- **Style**: Industrial-professional ERP aesthetic

## 🐳 Docker (optional)
Add a static file server in front of the backend:
```yaml
erp-frontend:
  build: ./erp-frontend
  ports: ["80:80"]
```
