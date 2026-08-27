# Kế Hoạch Tích Hợp Giao Diện TailAdmin vào QLMT-Next

**Mục tiêu:** Nâng cấp toàn diện giao diện (UI/UX) của dự án `qlmt-next` (quản lý địa bàn phường Liên Chiểu) bằng cách ứng dụng template **TailAdmin** (Free Tailwind Dashboard Template).
**Nguồn tham khảo:** [TailAdmin Template (nhánh 1.3)](https://github.com/TailAdmin/tailadmin-free-tailwind-dashboard-template/tree/1.3)

---

## 1. Đánh Giá Hiện Trạng & Khả Năng Tương Thích
- **Dự án QLMT-Next:** Đang sử dụng **Next.js 16 (App Router)**, React 19, **Tailwind CSS v4** và cơ sở dữ liệu MongoDB (Mongoose).
- **Template TailAdmin (1.3):** Là phiên bản HTML/JS tĩnh dùng Webpack và Tailwind CSS phiên bản cũ (v3).
- **Giải pháp:** Không thể copy/paste mã HTML trực tiếp. Chúng ta sẽ áp dụng phương pháp **"Next.js hóa" (Component hóa)**: Trích xuất các cấu trúc UI cốt lõi từ HTML của TailAdmin, chuyển đổi thành các React Component chuẩn của Next.js và cập nhật class CSS để tương thích với Tailwind v4.

*(Ghi chú: Nên tham khảo mã nguồn từ phiên bản `free-nextjs-admin-dashboard` của TailAdmin nếu cần thiết để việc chuyển đổi Next.js nhanh hơn).*

---

## 2. Kế Hoạch Triển Khai (5 Bước)

### Bước 1: Chuẩn bị Tài Nguyên & Cấu hình Styling
- **Fonts:** Tích hợp font chữ đặc trưng của TailAdmin (font Satoshi) vào Next.js (qua `next/font`).
- **Tailwind v4:** Trích xuất bảng màu (primary, secondary, stroke, body, dark mode...) từ TailAdmin và khai báo vào global CSS (`src/app/globals.css`) cho chuẩn Tailwind v4.
- **Assets:** Chuyển toàn bộ hình ảnh, logo, và SVG icons từ thư mục `public` của TailAdmin sang `public` của `qlmt-next`.

### Bước 2: Xây dựng Bộ Layout Cốt Lõi (UI Components)
Tạo các component mới trong thư mục `src/components/layout/`:
- **`Sidebar.tsx`**: Thanh menu bên trái. Xử lý logic đóng/mở (toggle state) cho giao diện responsive trên di động.
- **`Header.tsx`**: Thanh điều hướng phía trên (Topbar), bao gồm ô tìm kiếm, thông báo (notifications), và dropdown thông tin người dùng.
- **`DashboardLayout.tsx`**: Component tổng bọc `Header` và `Sidebar`, thiết lập CSS Grid/Flexbox để phần nội dung (`children`) hoạt động mượt mà.

### Bước 3: Áp dụng Layout vào Next.js App Router
- Thay thế hoặc cập nhật `src/app/layout.tsx` hiện tại.
- Đưa `DashboardLayout` làm layout bọc ngoài cho toàn bộ các trang nội bộ (Bản đồ, Quản lý dữ liệu).
- Đảm bảo cơ chế chuyển trang bằng `<Link>` của Next.js không làm re-render lại toàn bộ trang (giữ nguyên trạng thái Sidebar).

### Bước 4: Tái Cấu Trúc Các Trang (Pages) Ứng Dụng
- **Trang Bản đồ (Map):** Tích hợp bản đồ số (React-Leaflet) vào vùng nội dung chính (Main Content) của TailAdmin layout. Điều chỉnh `z-index` để bản đồ không che khuất Header và Sidebar.
- **Trang Dashboard & Danh sách:** Xây dựng lại các trang hiển thị dữ liệu (Đối tượng, Doanh nghiệp, PCCC) sử dụng các component Card, Table, Pagination mẫu của TailAdmin.
- **Trang Import Dữ Liệu:** Làm lại giao diện upload file XLSX cho trực quan, đẹp mắt và đồng bộ với thiết kế mới.

### Bước 5: Kiểm Thử & Tinh Chỉnh (Review & Refine)
- **Xử lý xung đột CSS:** Đảm bảo class của Tailwind v4 không làm hỏng CSS nội tại của Leaflet Map (`leaflet.css`).
- **Chế độ Tối (Dark Mode):** Áp dụng thư viện `next-themes` để bật/tắt Dark Mode toàn hệ thống theo chuẩn của TailAdmin.
- **Responsive:** Kiểm tra chặt chẽ trải nghiệm người dùng trên các kích thước màn hình Mobile và Tablet.

---

## 3. Hướng Dẫn Dành Cho Phiên Làm Việc Tiếp Theo (Next Session)
Khi bắt đầu phiên làm việc mới, Agent nên thực hiện theo thứ tự sau:
1. Đọc file kế hoạch này.
2. Bắt đầu với **Bước 1** (Tích hợp tài nguyên, cấu hình màu sắc Tailwind v4).
3. Tiến hành **Bước 2** (Tạo thư mục `src/components/layout` và viết mã cho `Sidebar.tsx`, `Header.tsx`).
4. Xin ý kiến User trước khi áp dụng layout này đè lên `src/app/layout.tsx` (Bước 3).
