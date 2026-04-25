# WEB QUẢN LÝ ĐỐI TƯỢNG LIÊN CHIỂU

## 1. Cấu Trúc Cơ Sở Dữ Liệu

### Danh sách các trường thông tin quản lý:

| STT | Tên trường | Mô tả |
|-----|------------|-------|
| 1 | Họ và tên | Bắt buộc |
| 2 | Tên gọi khác / Bí danh | |
| 3 | Ngày sinh | Định dạng dd/mm/yyyy |
| 4 | Giới tính | Nam / Nữ |
| 5 | Số CCCD/CMND | |
| 6 | Điện thoại | |
| 7 | Dân tộc | Mặc định: Kinh |
| 8 | Nghề nghiệp | |
| 9 | Học vấn | |
| 10 | Bệnh lý | |
| 11 | Tình trạng sức khỏe | |
| 12 | Loại ma túy sử dụng | Checkbox: OPI, MET, MDMA, THC, AMP, KET |
| 13 | Tổ dân phố | Tổ 1-83, Quan Nam 1-6, Hiền Phước, Hưởng Phước, Trung Sơn, Tân Ninh, Vân Dương 1-2 |
| 14 | Địa chỉ thường trú | |
| 15 | Nơi ở hiện tại | |
| 16 | Tọa độ GPS | Vĩ độ, Kinh độ trên bản đồ |
| 17 | Quan hệ gia đình | Bảng: Họ tên, Quan hệ, Sinh năm, Địa chỉ, SĐT |
| 18 | Lịch sử vi phạm | Bảng: Hành vi, Ngày vi phạm, Quyết định, Thời hạn |
| 19 | Tình trạng đối tượng | Nghiện / Sử dụng / Sau cai / Khởi tố |
| 20 | Phân loại | Hình sự, Ma túy, Kinh tế |
| 21 | Tiền án | |
| 22 | Lịch sử xử lý | |
| 23 | Ghi chú | |
| 24 | Ảnh chân dung | |
| 25 | Ảnh nhà ở | |
| 26 | Ảnh khác | Nhiều ảnh |
| 27 | Trạng thái duyệt | Pending / Approved |

---

## 2. Tính Năng Cốt Lõi

### 2.1. Nút bấm / Thao tác

| Nút | Chức năng | Phân quyền |
|-----|-----------|------------|
| Thêm đối tượng | Mở form nhập liệu mới | Admin, Leader, Officer |
| Xem chi tiết (👁) | Xem toàn bộ thông tin đối tượng | Tất cả |
| Sửa (✏️) | Chỉnh sửa thông tin | Admin, Leader, Officer |
| Xóa (🗑) | Xóa đối tượng | Chỉ Admin |
| Duyệt (✓) | Phê duyệt đối tượng mới tạo | Admin, Leader |
| Gắn tọa độ | Bản đồ chọn vị trí GPS | Admin, Leader, Officer |

### 2.2. Bộ lọc (Filter)

- Lọc theo Tình trạng:
  - Tất cả
  - Nghiện (đỏ)
  - Sử dụng (cam)
  - Sau cai (xanh)
  - Khởi tố (tím)

### 2.3. Tìm kiếm

- Tìm theo: Họ tên, CMND/CCCD, Địa chỉ
- Tìm kiếm real-time (không cần bấm nút)

---

## 3. Quy Trình Vận Hành

### 3.1. Cán bộ nhập liệu

1. Đăng nhập → Vào mục "Quản lý Đối tượng"
2. Bấm "Thêm đối tượng" → Mở form nhập
3. Điền thông tin theo 5 phần:
   - Thông tin cá nhân
   - Loại ma túy sử dụng (checkbox)
   - Thông tin cư trú (Tổ dân phố, địa chỉ, gắn GPS)
   - Quan hệ gia đình (thêm người thân)
   - Lịch sử vi phạm (thêm vi phạm)
4. Upload ảnh: Ảnh chân dung, ảnh nhà, ảnh khác
5. Bấm "Lưu hồ sơ đối tượng"
6. Phân quyền:
   - Officer tạo → Trạng thái "Chờ duyệt" (Pending)
   - Admin/Leader tạo → Tự động "Đã duyệt" (Approved)

### 3.2. Chỉ huy xem báo cáo

1. Dashboard trang chủ: Xem tổng số đối tượng, thống kê theo tình trạng và Tổ dân phố
2. Bản đồ GIS: Xem vị trí các đối tượng trên bản đồ (màu sắc theo tình trạng)
3. Danh sách: Lọc theo tình trạng, tìm kiếm nhanh
4. Xem chi tiết: Bấm icon 👁 để xem toàn bộ thông tin từng đối tượng

---

## 4. Dữ Liệu Mẫu

| STT | Họ tên | Năm sinh | Giới tính | CCCD | Tổ | Tình trạng | Loại ma túy | Địa chỉ |
|-----|--------|----------|-----------|------|-----|------------|-------------|---------|
| 1 | Nguyễn Văn A | 15/08/1995 | Nam | 079295123456 | Tổ 5 | Nghiện | MET, OPI | 123 Lê Lợi, P. Hòa Hiệp |
| 2 | Trần Thị B | 22/03/1990 | Nữ | 079190456789 | Tổ 12 | Sử dụng | THC | 45 Nguyễn Trãi, P. Tam Thuận |
| 3 | Lê Văn C | 10/11/1988 | Nam | 079188234567 | Quan Nam 2 | Sau cai | MET | 78 Trần Phú, P. Hòa Minh |
| 4 | Phạm Thị D | 05/06/1992 | Nữ | 079292345678 | Tổ 23 | Nghiện | OPI, KET | 12 Lý Thường Kiệt, P. Hòa Khánh |
| 5 | Hoàng Văn E | 30/12/1997 | Nam | 079297456123 | Tổ 8 | Sử dụng | MDMA | 56 Quang Trung, P. Hòa Hiệp |
| 6 | Vũ Thị F | 18/09/1993 | Nữ | 079293789012 | Tổ 15 | Nghiện | MET | 34 Điện Biên Phủ, P. Tam Thuận |
| 7 | Đặng Văn G | 25/07/1991 | Nam | 079191234567 | Quan Nam 4 | Khởi tố | OPI | 89 Lê Duẩn, P. Hòa Minh |
| 8 | Bùi Thị H | 12/04/1989 | Nữ | 079189567890 | Tổ 31 | Sau cai | THC, AMP | 67 Nguyễn Văn Linh, P. Hòa Khánh Bắc |

---

## 5. Phân quyền tóm tắt

| Vai trò | Tạo | Sửa | Xóa | Duyệt | Xem tất cả |
|---------|-----|-----|-----|-------|------------|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Leader | ✓ | ✓ | ✗ | ✓ | ✓ |
| Officer | ✓ | ✓ | ✗ | ✗ | Chỉ đã duyệt |