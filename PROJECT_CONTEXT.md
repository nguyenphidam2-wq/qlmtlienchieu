# Bản đồ số phường Liên Chiểu - Project Overview & Context

This file serves as a quick onboarding guide for AI coding assistants to understand the project structure, tech stack, and progress without consuming excessive tokens.

## 🚀 Project Summary
**Bản đồ số phường Liên Chiểu** (formerly Quản lý địa bàn phường Liên Chiểu) is a modular management system for territory and environmental data in the Lien Chieu district. It is designed to handle large-scale data imports and map-based territory management.

---

## 🛠 Tech Stack
- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose)
- **Styling:** Tailwind CSS 4
- **Maps:** Leaflet & React-Leaflet (for territory/zone management)
- **Data Export:** XLSX (Excel processing)

---

## 📂 Project Structure & Patterns
The project follows a modular feature-based architecture located in `src/features/`.

- `src/app/`: Next.js App Router. API routes are protected by a `secret` check (e.g., `import-qlmt-2024`).
- `src/features/`: Core business logic. Each module (e.g., `subjects`, `businesses`) must implement the `IFeatureModule` interface and register in `registry.ts`.
    - **`importData` logic**: Every module handles its own data insertion/replacement logic via the `importData` method.
- `src/lib/`: Shared utilities. `mongodb.ts` handles the Mongoose connection.
- `scripts/`: Standalone scripts for one-off tasks (e.g., `fix-approval-status.ts`).

### 🛠 Coding Standards
- **Components**: PascalCase (e.g., `SubjectList.tsx`).
- **Logic/Variables**: camelCase.
- **Strict Typing**: Use TypeScript interfaces defined in each feature or `src/features/types.ts`.

---

## 📈 Current Progress & Patterns
- **Modular Design:** Each feature has its own module file (e.g., `subjects.module.ts`) and is registered in `src/features/registry.ts`.
- **Data Integrity:** Recent work focuses on "Bulk Approval" workflows and ensuring data defaults to "Pending" status upon import.
- **Geospatial Focus:** Extensive use of Leaflet for managing custom zones and marking locations.

---

## 🤖 Instructions for AI Assistants
1. **Read this file first** to understand the high-level context.
2. **Focus on specific modules**: When asked to modify a feature, look into its corresponding folder in `src/features/`.
3. **Follow the established patterns**: Use the existing modular architecture and Mongoose schemas.
