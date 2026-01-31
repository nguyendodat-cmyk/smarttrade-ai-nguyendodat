# Khi nào Insight được sinh?

> Tài liệu này giải thích cho người không cần biết lập trình: tại sao hệ thống đã chạy mà vẫn chưa thấy insight xuất hiện.

## Khái niệm cơ bản

### Bar là gì?

Một **bar** (hay "cây nến") đại diện cho dữ liệu giá trong một khoảng thời gian:

- **Bar 1 phút**: giá mở, cao nhất, thấp nhất, đóng cửa trong 1 phút
- **Bar ngày**: giá mở, cao nhất, thấp nhất, đóng cửa trong 1 ngày giao dịch

Mỗi lần thị trường cập nhật, hệ thống nhận thêm 1 bar mới.

### Polling là gì?

**Polling** là quá trình hệ thống tự động lấy dữ liệu từ sàn (SSI) theo chu kỳ (mặc định mỗi 60 giây).

**Polling hoạt động ≠ Insight xuất hiện.**

Polling chỉ thu thập dữ liệu thô. Insight chỉ được sinh khi dữ liệu đã đủ điều kiện tối thiểu.

### Warm-up là gì?

**Warm-up** là giai đoạn tích lũy dữ liệu ban đầu sau khi hệ thống khởi động. Trong thời gian này:

- Server vẫn chạy bình thường
- Polling vẫn lấy dữ liệu từ sàn
- Nhưng hệ thống **chưa gửi alert** (mặc định 180 giây đầu)

Mục đích: tránh gửi alert trùng lặp ngay sau khi khởi động lại.

---

## Dữ liệu tối thiểu để từng loại Insight hoạt động

### Nhóm Price Action (dùng bar 1 phút)

| Mã | Tên | Dữ liệu tối thiểu |
|----|-----|--------------------|
| PA01 | Nến tăng mạnh | Cần ít nhất **5 bar 1 phút** (~5 phút dữ liệu) |
| PA02 | Bóng trên dài | Cần ít nhất **5 bar 1 phút** (~5 phút dữ liệu) |

### Nhóm Price Action (dùng bar ngày)

| Mã | Tên | Dữ liệu tối thiểu |
|----|-----|--------------------|
| PA03 | Gap giá | Cần ít nhất **2 bar ngày** (hôm nay + hôm trước) |
| PA04 | Thất bại breakout | Cần ít nhất **20 bar ngày** (~1 tháng giao dịch) |

### Nhóm Volume (dùng bar ngày)

| Mã | Tên | Dữ liệu tối thiểu |
|----|-----|--------------------|
| VA01 | Khối lượng đột biến | Cần ít nhất **20 bar ngày** (~1 tháng) |
| VA02 | Phân kỳ giá-khối lượng | Cần ít nhất **20 bar ngày** (~1 tháng) |
| VA03 | Volume climax | Cần ít nhất **20 bar ngày** (~1 tháng) |

### Nhóm Technical/Momentum (dùng bar ngày)

| Mã | Tên | Dữ liệu tối thiểu |
|----|-----|--------------------|
| TM02 | MA Cross | Cần ít nhất **51 bar ngày** (~2.5 tháng) — vì cần MA50 hôm nay + hôm trước |
| TM04 | RSI quá mua | Cần ít nhất **15 bar ngày** (~3 tuần) — vì RSI14 cần 15 giá đóng cửa |
| TM05 | RSI quá bán | Cần ít nhất **15 bar ngày** (~3 tuần) |

### Tóm tắt trực quan

```
Bar ngày tích lũy:    2   5  15        20              51
                       |   |   |         |               |
                      PA03 PA01 TM04    VA01            TM02
                           PA02 TM05    VA02
                                        VA03
                                        PA04
```

---

## Ví dụ thực tế

### Trường hợp 1: Mã FPT, khung 1 phút

Khi hệ thống bắt đầu theo dõi FPT:

- **Phút 1–4**: Polling lấy dữ liệu, chưa đủ 5 bar → chưa có PA01, PA02
- **Từ phút 5**: Đủ 5 bar 1 phút → PA01 và PA02 bắt đầu phân tích
- Insight có xuất hiện hay không **phụ thuộc vào dữ liệu thực tế** (ví dụ: chỉ khi có nến tăng mạnh thì PA01 mới kích hoạt)

### Trường hợp 2: Mã VNM, dữ liệu ngày

- **Ngày 1–14**: Chưa đủ dữ liệu cho RSI → TM04, TM05 chưa hoạt động
- **Ngày 15**: RSI14 bắt đầu tính được → TM04, TM05 sẵn sàng
- **Ngày 20**: Đủ 20 bar → VA01, VA02, VA03, PA04 sẵn sàng
- **Ngày 51**: Đủ 51 bar → TM02 (MA Cross) sẵn sàng

Trong suốt thời gian chờ:
- Server vẫn chạy bình thường
- Polling vẫn lấy dữ liệu đều đặn
- Hệ thống chỉ **chưa đủ điều kiện** để sinh insight cho các loại cần nhiều dữ liệu

### Trường hợp 3: Khởi động lại server

Sau khi server khởi động lại:
1. **180 giây đầu**: Warm-up — không gửi alert (tránh trùng lặp)
2. Polling bắt đầu lấy dữ liệu mới
3. Bar 1 phút tích lũy từ đầu (cần ~5 phút cho PA01/PA02)
4. Bar ngày được lấy lại từ sàn (thường có đủ lịch sử ngay)

---

## Cách kiểm tra trạng thái hiện tại

Dùng endpoint debug (chỉ dành cho vận hành nội bộ):

```
GET /api/v1/debug/market_state
```

Kết quả ví dụ:

```json
{
  "FPT": {
    "bars_1m": 37,
    "bars_daily": 25,
    "indicators": {
      "MA20": "ready",
      "MA50": "waiting (need 50, have 25)",
      "RSI14": "ready"
    }
  }
}
```

- **ready**: Đủ dữ liệu để tính
- **waiting**: Chưa đủ dữ liệu — kèm thông tin cần bao nhiêu, hiện có bao nhiêu

---

## Câu hỏi thường gặp

**Q: Hệ thống chạy rồi mà sao chưa thấy insight?**

A: Có 3 nguyên nhân phổ biến:
1. Chưa đủ dữ liệu tối thiểu (xem bảng ở trên)
2. Đang trong giai đoạn warm-up (180 giây đầu sau khởi động)
3. Dữ liệu đã đủ, nhưng điều kiện kỹ thuật chưa xảy ra (ví dụ: RSI chưa vượt 70)

**Q: Tại sao có PA01 nhưng chưa có TM02?**

A: PA01 chỉ cần 5 bar 1 phút (~5 phút). TM02 cần 51 bar ngày (~2.5 tháng). Hai loại insight có yêu cầu dữ liệu rất khác nhau.

**Q: Có cách nào bắt hệ thống sinh insight nhanh hơn không?**

A: Không. Hệ thống chỉ sinh insight khi dữ liệu thực tế thỏa mãn điều kiện. Đây là thiết kế có chủ đích để đảm bảo chất lượng tín hiệu.
