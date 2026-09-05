# Hướng dẫn triển khai server tại nhà bằng Docker

Tài liệu này mô tả phương án chạy hệ thống trên một PC Windows tại nhà hoặc cơ quan:

```text
Laptop -> GitHub private repository -> PC server
                                      |
                                      +-- Docker: Next.js
                                      +-- Docker: MongoDB local
                                      +-- Cloudflare Tunnel
                                      +-- Backup mã hóa -> Google Drive
```

## 1. Phạm vi và điều kiện

Phương án phù hợp cho giai đoạn đầu với khoảng 5-20 người dùng đồng thời, dữ liệu nghiệp vụ có quy mô vừa và thao tác chủ yếu là nhập liệu, xem danh sách và bản đồ GIS.

PC server cần:

- CPU 64-bit, hỗ trợ ảo hóa phần cứng.
- RAM 16 GB.
- SSD còn tối thiểu 100 GB trống; nên dùng SSD riêng cho Docker và backup.
- Kết nối Internet ổn định, không bắt buộc IP tĩnh.
- UPS nếu hệ thống cần hoạt động liên tục.

Windows 10 đã hết hỗ trợ chính thức từ ngày 14/10/2025. Ưu tiên Windows 11 Pro hoặc Ubuntu Server. Nếu bắt buộc dùng Windows 10, cần có bản cập nhật/ESU phù hợp và không nên mở port trực tiếp ra Internet.

## 2. Nguyên tắc an toàn

- Không mở port MongoDB `27017` ra Internet.
- Không mở port modem/router để trỏ trực tiếp vào PC.
- Không dùng Cloudflare Quick Tunnel ngẫu nhiên cho vận hành chính thức.
- Không chạy MongoDB trên thư mục Google Drive.
- Không commit `.env`, mật khẩu, token Cloudflare hoặc dữ liệu thật lên GitHub.
- Dữ liệu backup phải được mã hóa trước khi tải lên Google Drive.
- Google Drive là nơi chứa bản sao lưu, không phải database đang chạy.

## 3. Chuẩn bị tài khoản và phần mềm

### Trên laptop

- Git.
- Tài khoản GitHub private repository.
- Node.js 22 LTS để kiểm tra build.
- Quyền truy cập repository và quyền tạo Pull Request.

### Trên PC server

1. Cài Windows đã cập nhật.
2. Bật Virtualization trong BIOS.
3. Bật WSL2:

```powershell
wsl --install
```

Khởi động lại máy sau khi cài.

4. Cài Docker Desktop, chọn WSL2 backend.
5. Cài Git for Windows.
6. Cài `rclone` hoặc công cụ backup được cơ quan phê duyệt.

Trong Docker Desktop, nên giới hạn khoảng 4 CPU và 6-8 GB RAM cho Docker để Windows vẫn hoạt động ổn định.

## 4. Chuẩn bị mã nguồn

Repository hiện có `output: "standalone"` trong `next.config.ts`, phù hợp để đóng gói production. Trước khi triển khai chính thức cần bổ sung các file ở thư mục gốc:

```text
Dockerfile
docker-compose.yml
.dockerignore
deploy/
  backup.ps1
  healthcheck.ps1
  deploy.ps1
```

Không sử dụng các bản portable trong `QLMT_PORTABLE_APP` làm cấu hình production chính. Không trộn đồng thời PM2, bản portable và Docker.

## 5. Cấu hình biến môi trường production

Tạo file riêng trên PC server, ví dụ `.env.production`, không commit lên GitHub:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

MONGODB_URI=mongodb://qlmt_app:MAT_KHAU_APP@mongo:27017/qlmt-lienchieu?authSource=qlmt-lienchieu
MONGO_ROOT_USERNAME=qlmt_root
MONGO_ROOT_PASSWORD=MAT_KHAU_ROOT_DAI_NGAU_NHIEN
MONGO_APP_USERNAME=qlmt_app
MONGO_APP_PASSWORD=MAT_KHAU_APP_DAI_NGAU_NHIEN

JWT_SECRET=SECRET_JWT_DAI_NGAU_NHIEN
SETUP_SECRET=SECRET_SETUP_DAI_NGAU_NHIEN
IMPORT_SECRET=SECRET_IMPORT_DAI_NGAU_NHIEN

CLOUDFLARE_TUNNEL_TOKEN=TOKEN_NAMED_TUNNEL
```

Lưu ý:

- Không dùng secret mẫu trong tài liệu.
- Không dùng lại secret đang có trong máy phát triển.
- Không đưa thông tin đăng nhập MongoDB Atlas hiện tại lên server mới.
- Sau khi triển khai, khóa hoặc giới hạn route tạo tài khoản demo.

## 6. Khởi tạo Docker Compose

Tạo mạng và volume riêng cho ứng dụng. Tên service phải thống nhất với `MONGODB_URI`:

```yaml
services:
  mongo:
    image: mongo:7
    container_name: qlmt-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: qlmt-lienchieu
    volumes:
      - mongo_data:/data/db
    networks:
      - qlmt

  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: qlmt-web
    restart: unless-stopped
    env_file:
      - .env.production
    depends_on:
      - mongo
    ports:
      - "3000:3000"
    volumes:
      - app_uploads:/app/public/uploads
    networks:
      - qlmt

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: qlmt-cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      - web
    networks:
      - qlmt

volumes:
  mongo_data:
  app_uploads:

networks:
  qlmt:
    driver: bridge
```

Trong Cloudflare Tunnel, đặt service đích là:

```text
http://web:3000
```

Nếu chỉ truy cập qua Cloudflare, có thể không công khai port `3000` ra LAN; khi đó dùng cấu hình mạng nội bộ phù hợp và chỉ cho container `cloudflared` truy cập service `web`.

## 7. Dockerfile production tối thiểu

Dockerfile phải được kiểm tra theo phiên bản Next.js hiện tại. Mẫu tham khảo:

```dockerfile
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p /app/public/uploads
EXPOSE 3000
CMD ["node", "server.js"]
```

Thêm `.dockerignore` để không đưa dữ liệu và thư viện phát triển vào image:

```text
node_modules
.next
.git
.env*
scratch
tmp
archives
QLMT_PORTABLE_APP
public/uploads
```

## 8. Khởi chạy lần đầu

Trên PC server:

```powershell
git clone https://github.com/ORG/REPO.git D:\QLMT\qlmt-next
Set-Location D:\QLMT\qlmt-next

# Tạo .env.production riêng tại đây trước khi chạy
docker compose --env-file .env.production up -d --build
docker compose ps
docker compose logs --tail=100 web
docker compose logs --tail=100 mongo
```

Kiểm tra tại máy server:

```powershell
Invoke-WebRequest http://localhost:3000/login
```

Sau đó kiểm tra domain Cloudflare:

```text
https://TEN-MIEN-CUA-CO-QUAN/login
```

Nếu Cloudflare trả lỗi 1033/530, kiểm tra ngay:

```powershell
docker compose ps
docker compose logs --tail=200 cloudflared
docker compose logs --tail=200 web
```

Lỗi 1033 thường có nghĩa là Tunnel không kết nối được tới container web hoặc container server đang dừng.

## 9. Cấu hình Cloudflare Tunnel

1. Tạo domain hoặc subdomain thuộc tài khoản Cloudflare của cơ quan.
2. Tạo **Named Tunnel**.
3. Tạo Public Hostname, ví dụ:

```text
qlmt.example.gov.vn -> http://web:3000
```

4. Đặt token tunnel trong `.env.production` trên server.
5. Không ghi token vào GitHub.
6. Bật Cloudflare Access hoặc chính sách hạn chế người truy cập nếu có thể.
7. Bật MFA cho tài khoản Cloudflare quản trị.

Cloudflare Tunnel không thay thế phân quyền trong ứng dụng. Người dùng vẫn phải đăng nhập và Server Action vẫn phải tự kiểm tra quyền.

## 10. Quy trình cập nhật Laptop -> GitHub -> Server

### Trên laptop

```powershell
npx tsc --noEmit --pretty false
npm run build
git add .
git commit -m "Mo ta thay doi"
git push origin main
```

Chỉ merge vào nhánh `release` sau khi kiểm tra xong:

```text
main -> Pull Request -> review -> release
```

### Trên server

Cách an toàn ban đầu là cập nhật thủ công:

```powershell
Set-Location D:\QLMT\qlmt-next
git fetch origin
git checkout release
git pull --ff-only origin release

# Backup trước khi đổi phiên bản
powershell -ExecutionPolicy Bypass -File .\deploy\backup.ps1

docker compose --env-file .env.production up -d --build
docker compose ps
```

Sau khi ổn định, có thể cài GitHub Actions **self-hosted runner** trên server. Chỉ cho workflow của nhánh `release` chạy, không chạy mã từ Pull Request chưa duyệt trên runner production.

Workflow cần có thứ tự:

```text
checkout release
backup
build image
docker compose up -d
health check
rollback nếu health check thất bại
```

Self-hosted runner có quyền rất lớn trên PC server. Repository phải để private, giới hạn người có quyền merge và không lưu secret production trong log workflow.

## 11. Backup MongoDB và file upload

Backup phải lấy từ MongoDB bằng `mongodump`, không copy trực tiếp thư mục `mongo_data` khi MongoDB đang chạy.

Dữ liệu cần backup:

- MongoDB của hệ thống, gồm cả `audit_logs` và `users`.
- Docker volume `app_uploads` hoặc thư mục chứa ảnh/tài liệu.
- Cấu hình phục hồi cần thiết, nhưng secret phải lưu riêng và mã hóa.

Lịch đề xuất:

```text
02:00  mongodump --archive --gzip
02:10  đóng gói uploads
02:15  mã hóa file backup
02:20  upload Google Drive
02:30  kiểm tra checksum và dọn bản quá hạn
```

Giữ tối thiểu:

- 7 bản backup gần nhất trên server.
- 30-90 bản/ngày hoặc bản theo chính sách của cơ quan trên Google Drive.
- 1 bản định kỳ trên ổ cứng ngoài, cất ở vị trí khác server.

Google Drive nên dùng tài khoản Google Workspace của cơ quan, bật MFA và không chia sẻ công khai. Dùng `rclone crypt`, Restic hoặc công cụ mã hóa đã được phê duyệt trước khi upload dữ liệu nhạy cảm.

## 12. Kiểm tra phục hồi backup

Ít nhất mỗi tháng:

1. Tạo MongoDB tạm trên server dự phòng hoặc máy test.
2. Tải một bản backup từ Google Drive.
3. Giải mã và restore vào database test.
4. Khởi động ứng dụng bằng database test.
5. Kiểm tra đăng nhập, danh sách Subject, TDP, GIS, ảnh và AuditLog.
6. Ghi lại thời gian phục hồi và lỗi nếu có.

Một file backup chỉ được xem là đạt khi đã khôi phục thử thành công.

## 13. Rollback khi cập nhật lỗi

Nếu phiên bản mới lỗi:

```powershell
Set-Location D:\QLMT\qlmt-next
git log --oneline -5
git checkout <COMMIT_CU>
docker compose --env-file .env.production up -d --build
docker compose ps
```

Không xóa volume bằng lệnh sau trong quá trình xử lý sự cố:

```powershell
docker compose down -v
```

Lệnh này có thể xóa dữ liệu MongoDB và file upload.

## 14. Vận hành hằng ngày

Mỗi ngày kiểm tra:

- `docker compose ps` đều ở trạng thái `Up`.
- Log không có lỗi kết nối MongoDB.
- Domain Internet đăng nhập được.
- Backup Google Drive có file mới.
- Ổ đĩa còn đủ dung lượng.
- Cloudflare Tunnel đang hoạt động.

Mỗi tuần:

- Kiểm tra backup local.
- Kiểm tra danh sách tài khoản và quyền truy cập.
- Kiểm tra các bản ghi AuditLog.
- Cập nhật bảo mật Docker Desktop/WSL2/Windows theo chính sách.

## 15. Checklist nghiệm thu

- [ ] PC có UPS và không tự sleep.
- [ ] Docker Desktop tự khởi động cùng Windows.
- [ ] MongoDB dùng volume riêng.
- [ ] Next.js chạy production, không chạy `npm run dev`.
- [ ] Cloudflare Named Tunnel truy cập được từ mạng ngoài.
- [ ] Không mở `27017` ra Internet.
- [ ] `.env.production` không nằm trong Git.
- [ ] Tài khoản production đã đổi secret mặc định.
- [ ] Có backup MongoDB và `uploads` mỗi ngày.
- [ ] Backup được mã hóa trước khi lên Google Drive.
- [ ] Đã thử restore backup.
- [ ] Có rollback mã nguồn.
- [ ] Self-hosted runner chỉ deploy nhánh `release`.
- [ ] Có người chịu trách nhiệm theo dõi server và backup.

## Kết luận

Phương án khuyến nghị là:

> Docker Compose + MongoDB local + Next.js production + Cloudflare Named Tunnel + GitHub private repository + backup mã hóa lên Google Drive.

Mô hình này đáp ứng việc không cần IP tĩnh, không cần cài thư viện Node.js trực tiếp trên máy server và cho phép cập nhật từ laptop. Tuy nhiên, hệ thống chỉ nên đưa vào vận hành thật sau khi hoàn thành backup có kiểm tra restore, bảo vệ Cloudflare, đổi toàn bộ secret và có phương án xử lý khi PC server hỏng.
