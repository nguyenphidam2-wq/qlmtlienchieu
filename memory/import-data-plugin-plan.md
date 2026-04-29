---
name: import-data-plugin-plan
description: Kế hoạch chuyển đổi import-data API sang kiến trúc Plugin
type: project
---

## Mục tiêu
Chuyển đổi file `src/app/api/import-data/route.ts` sang kiến trúc Plugin mà không làm chết API hiện hành.

## Các Phase

### Phase 1: Khởi tạo lõi
- Tạo thư mục `src/features/`
- Định nghĩa interface chuẩn cho các Module (ép các tính năng sau này phải code đúng form)

### Phase 2: Di dời an toàn
- Chuyển 3 collection hiện tại (`subjects`, `businesses`, `customzones`) thành 3 file module riêng biệt
- Đăng ký vào registry.ts trung tâm

### Phase 3: Thay ruột API
- Sửa file `route.ts` để đọc động từ Registry thay vì dùng mảng hardcode `["subjects", "businesses", "customzones"]`

## File gốc cần chuyển đổi
`src/app/api/import-data/route.ts`

## Đặc điểm hiện tại
- Hardcoded allowed collections: `["subjects", "businesses", "customzones"]`
- Import logic: xóa dữ liệu cũ → insert mới
- Bảo vệ bằng secret key `"import-qlmt-2024"`