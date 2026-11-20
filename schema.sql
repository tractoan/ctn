-- Kho dữ liệu dạng khóa-giá trị: t = bảng logic (user, tok, code, presence, gb, roster, event, score, buy)
CREATE TABLE IF NOT EXISTS kv (
  t TEXT NOT NULL,
  k TEXT NOT NULL,
  v TEXT NOT NULL,
  PRIMARY KEY (t, k)
);
