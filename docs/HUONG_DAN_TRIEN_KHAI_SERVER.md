# 📋 HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG BẢN ĐỒ SỐ LÊN MÁY SERVER 24/24

> **Dự án:** Quản lý địa bàn / Bản đồ số phường Liên Chiểu (`qlmt-next`)  
> **Mục tiêu:** Đưa hệ thống lên máy Server 24/24 phục vụ ~20 người dùng cùng lúc, dữ liệu lưu 100% local, không tốn tiền mua tên miền, 0đ chi phí hạ tầng.

---

## 🎒 BƯỚC 0: CHUẨN BỊ MANG THEO (Thực hiện trên Laptop)

Tôi đã tạo sẵn đầy đủ các công cụ tự động trong thư mục dự án:
- ✅ `SETUP_SERVER.bat` (File cài đặt 1-Click tự động cho máy Server).
- ✅ `UPDATE_SERVER.bat` (File 1-Click cập nhật code sau này).
- ✅ `scripts/export/subjects.json` (Đã xuất sẵn 124 hồ sơ dữ liệu địa bàn).

👉 **Việc của bạn:** Copy toàn bộ thư mục `qlmt-next` vào **USB** hoặc nén lại đẩy lên **Google Drive / Git** để chiều mang sang máy Server.

---

## 🛠️ BƯỚC 1: CÀI ĐẶT 3 PHẦN MỀM NỀN TẢNG NÀY TRÊN MÁY SERVER (Chỉ làm 1 lần duy nhất)

Mở trình duyệt trên máy Server trắng, tải và cài 3 phần mềm sau (Bấm `Next` ➔ `Next` ➔ `Finish`):

| STT | Phần mềm | Tác dụng | Link tải nhanh |
| :--- | :--- | :--- | :--- |
| 1 | **Node.js (LTS)** | Chạy ứng dụng Web Next.js | [nodejs.org](https://nodejs.org) |
| 2 | **Git for Windows** | Đồng bộ code từ Laptop | [git-scm.com/download/win](https://git-scm.com/download/win) |
| 3 | **MongoDB Community** | Cơ sở dữ liệu local | [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) |

> ⚠️ **LƯU Ý KHI CÀI MONGODB:** Trong quá trình cài đặt MongoDB, tới màn hình lựa chọn, hãy nhớ **giữ nguyên ô tích chọn `"Install MongoDB as a Service"`** để cơ sở dữ liệu tự động chạy ngầm cùng Windows.

---

## 🚀 BƯỚC 2: KHỞI CHẠY HỆ THỐNG VỚI 1-CLICK (Trên máy Server)

1. Copy thư mục `qlmt-next` từ USB vào đĩa `C:\` hoặc `D:\` của máy Server.
2. Mở thư mục `qlmt-next` ra.
3. **Nhấp đúp chuột vào file `SETUP_SERVER.bat`**.

Kịch bản tự động sẽ làm 100% mọi thứ cho bạn trong khoảng 2 - 3 phút:
- [x] Tự nạp cấu hình môi trường `.env.local`
- [x] Tự cài đặt các thư viện Node.js (`npm install`)
- [x] Tự động nạp 124 hồ sơ dữ liệu vào MongoDB Local
- [x] Tự động biên dịch nén ứng dụng Web (`npm run build`)
- [x] Tự động đăng ký dịch vụ chạy ngầm 24/24 qua PM2
- [x] Tự động phát ra đường link Internet công khai cho 20 người dùng

Màn hình sẽ hiển thị đường link Internet (Ví dụ: `https://xxx.loca.lt` hoặc `https://xxx.pinggy.link`). Bạn chỉ cần copy link này gửi cho 20 người dùng.

---

## ⚙️ BƯỚC 3: CẤU HÌNH CHO MÁY SERVER NGHỈ KHÔNG TẮT (Chống ngắt kết nối)

Trên máy Server Windows:
1. Vào **Start** ➔ Mở **Settings** (Cài đặt).
2. Vào **System** ➔ Chọn **Power & battery** (Nguồn & Pin).
3. Tại mục **Screen and Sleep** (Màn hình và Chế độ ngủ):
   - Đổi tất cả các lựa chọn thành **`Never`** (Không bao giờ).
4. *Bây giờ bạn có thể gập màn hình laptop hoặc tắt màn hình máy tính, Server vẫn sẽ hoạt động liên tục 24/24.*

---

## 🔄 HƯỚNG DẪN CẬP NHẬT CODE SAU NÀY (Khi bạn sửa tính năng ở Laptop)

Mỗi khi bạn sửa giao diện hoặc thêm tính năng mới từ Laptop của mình:

1. **Trên Laptop:** Đẩy code lên Git (`git push`) hoặc copy thư mục code mới chép đè sang máy Server.
2. **Trên máy Server:** Nhấp đúp chuột vào file **`UPDATE_SERVER.bat`**.
3. *Ứng dụng sẽ tự động tải bản mới, tự build lại và khởi động lại Server trong khoảng 15 - 30 giây.*

---
🎉 **Chúc bạn triển khai thành công vào chiều nay! Có bất kỳ thắc mắc nào khi thực hiện cứ báo tôi hỗ trợ ngay.**
