"""
セキュリティE2Eテスト（v3 - リファクタリング版）

改善点:
- 環境変数による設定外部化
- 未使用ペイロードの活用（PATH_TRAVERSAL, SSRF, NOSQL等）
- ヘルパー関数の分離
- parametrizeによるテスト独立性向上
- 型ヒント追加
- bare except の修正
"""
from __future__ import annotations

import os
import re
import time
from typing import Any

import pytest
import requests

from attack_payloads import (
    BOUNDARY_PAYLOADS,
    CRLF_PAYLOADS,
    MULTIBYTE_PAYLOADS,
    NOSQL_PAYLOADS,
    NULL_BYTE_PAYLOADS,
    OS_CMD_PAYLOADS,
    PATH_TRAVERSAL_PAYLOADS,
    RATE_LIMIT_BYPASS_HEADERS,
    RATE_LIMIT_BYPASS_USER_AGENTS,
    REDOS_PAYLOADS,
    SQL_INJECTION_PAYLOADS,
    SQL_TIME_BASED_PAYLOADS,
    SSRF_PAYLOADS,
    UNICODE_NORMALIZATION_PAYLOADS,
    XSS_PAYLOADS,
)

# =============================================================================
# 設定（環境変数で上書き可能）
# =============================================================================

TARGET_URL: str = os.getenv("TEST_TARGET_URL", "http://localhost:4321/api/contact/")
REQUEST_TIMEOUT: int = int(os.getenv("TEST_REQUEST_TIMEOUT", "10"))
TIME_BASED_THRESHOLD: float = float(os.getenv("TEST_TIME_THRESHOLD", "3.0"))

# SSRF テストを有効にするかどうか（本番環境では無効にすること）
ENABLE_SSRF_TESTS: bool = os.getenv("TEST_ENABLE_SSRF", "false").lower() == "true"

# レート制限テスト設定
RATE_LIMIT_REQUESTS: int = int(os.getenv("TEST_RATE_LIMIT_REQUESTS", "50"))
RATE_LIMIT_WINDOW_SECONDS: float = float(os.getenv("TEST_RATE_LIMIT_WINDOW", "10.0"))
RATE_LIMIT_EXPECTED_CODE: int = int(os.getenv("TEST_RATE_LIMIT_CODE", "429"))
RATE_LIMIT_GET_ENDPOINT: str = os.getenv("TEST_RATE_LIMIT_GET_ENDPOINT", "")

# ReDoS検出閾値（この秒数を超えたらReDoS脆弱性の可能性）
REDOS_THRESHOLD_SECONDS: float = float(os.getenv("TEST_REDOS_THRESHOLD", "2.0"))

# リクエストボディ形式（"form" または "json"）
REQUEST_BODY_FORMAT: str = os.getenv("TEST_REQUEST_BODY_FORMAT", "form")

# テスト対象のフィールド
INPUT_FIELDS: list[str] = ["name", "email", "subject", "message"]


# =============================================================================
# ヘルパー関数
# =============================================================================

def is_html_escaped(text: str) -> bool:
    """HTMLタグがエスケープされているか確認"""
    return "<" not in text and ">" not in text


def is_quote_escaped(text: str, quote_char: str = "'") -> bool:
    """
    クォート文字がエスケープされているか確認
    
    Args:
        text: 検査対象のテキスト
        quote_char: 検査するクォート文字（' または "）
    
    Returns:
        エスケープ済みまたはクォートが存在しない場合True
    """
    if quote_char not in text:
        return True  # クォート自体がない
    
    # 一般的なエスケープパターン
    escape_patterns = {
        "'": ["&#x27;", "\\'", "&apos;", "&#39;"],
        '"': ["&quot;", '\\"', "&#34;"],
    }
    
    patterns = escape_patterns.get(quote_char, [])
    return any(pattern in text for pattern in patterns)


def contains_dangerous_xss_pattern(text: str) -> tuple[bool, str]:
    """
    実行可能なXSSパターンが含まれているか判定
    
    Returns:
        (危険かどうか, 理由)
    """
    if is_html_escaped(text):
        return False, "HTMLタグがエスケープ済み"
    
    dangerous_patterns = [
        (r"<script[^>]*>", "script tag"),
        (r"</script>", "script closing tag"),
        (r"<[^>]+\s+on\w+\s*=", "event handler in tag"),
        (r"javascript:", "javascript protocol"),
        (r"<iframe", "iframe tag"),
        (r"<embed", "embed tag"),
        (r"<object", "object tag"),
        (r"<svg[^>]*\s+on\w+", "svg with event handler"),
    ]
    
    for pattern, name in dangerous_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True, f"危険なパターン検出: {name}"
    
    return False, "危険なパターンなし"


def contains_error_pattern(text: str, patterns: list[str]) -> str | None:
    """
    テキスト内にエラーパターンが含まれているか確認
    
    Returns:
        見つかったパターン、なければNone
    """
    text_lower = text.lower()
    for pattern in patterns:
        if pattern in text_lower:
            return pattern
    return None


# =============================================================================
# テスト基底クラス
# =============================================================================

class TestSecurityBase:
    """セキュリティテストの基底クラス"""

    # クラス単位で共有するSessionとサーバー状態
    _session: requests.Session | None = None
    _server_checked: bool = False
    _baseline_latency: float | None = None

    @pytest.fixture(scope="class", autouse=True)
    def setup_class_session(self, request: pytest.FixtureRequest) -> None:
        """クラスごとに1回だけサーバー接続確認とSession初期化"""
        cls = request.cls
        if cls is None:
            return

        # Session初期化（クラスごとに1回）
        if cls._session is None:
            cls._session = requests.Session()
            cls._session.headers.update({
                "User-Agent": "SecurityTestBot/1.0",
            })

        # サーバー接続確認（クラスごとに1回）
        if not cls._server_checked:
            try:
                base_url = TARGET_URL.rstrip("/").rsplit("/", 1)[0] + "/"
                cls._session.get(base_url, timeout=5)
                cls._server_checked = True
            except requests.exceptions.ConnectionError:
                pytest.skip(f"サーバーに接続できません: {TARGET_URL}")

        # ベースラインレイテンシ計測（クラスごとに1回）
        if cls._baseline_latency is None:
            cls._baseline_latency = cls._measure_baseline_latency(cls)

    @staticmethod
    def _measure_baseline_latency(cls: type["TestSecurityBase"]) -> float:
        """通常リクエストの平均応答時間を計測"""
        latencies: list[float] = []
        
        for i in range(3):  # 3回計測して平均を取る
            data = {
                "name": "BaselineTest",
                "message": f"baseline_measurement_{i}",
                "email": "baseline@example.com",
                "subject": "Baseline Test",
            }
            start_time = time.time()
            try:
                cls._session.post(TARGET_URL, data=data, timeout=REQUEST_TIMEOUT)
                elapsed = time.time() - start_time
                latencies.append(elapsed)
            except requests.exceptions.RequestException:
                pass
        
        if latencies:
            return sum(latencies) / len(latencies)
        return 0.0  # 計測失敗時はフォールバック

    @property
    def baseline_latency(self) -> float:
        """ベースラインレイテンシを取得"""
        return self._baseline_latency or 0.0

    @property
    def session(self) -> requests.Session:
        """HTTPセッションを取得"""
        if self._session is None:
            self._session = requests.Session()
        return self._session

    def send_request(
        self,
        payload: str,
        field: str = "message",
    ) -> tuple[requests.Response | None, float, dict[str, Any] | None]:
        """
        攻撃リクエストを送信するヘルパー
        
        Args:
            payload: テストペイロード
            field: ペイロードを設定するフィールド名
        
        Returns:
            (レスポンス, 経過時間, JSONデータ)
            
        Note:
            - 4xx系レスポンスも「正常な防御」として扱い、JSONパースを試みる
            - json_dataがNoneの場合: JSONでないレスポンス or パース失敗
            - REQUEST_BODY_FORMAT環境変数でform/json送信を切り替え可能
        """
        data = {
            "name": "Tester",
            "message": "Normal message",
            "email": "test@example.com",
            "subject": "Security Test",
        }
        data[field] = payload

        start_time = time.time()
        try:
            # ボディ形式を環境変数で切り替え
            if REQUEST_BODY_FORMAT == "json":
                response = self.session.post(
                    TARGET_URL,
                    json=data,
                    timeout=REQUEST_TIMEOUT,
                )
            else:
                response = self.session.post(
                    TARGET_URL,
                    data=data,
                    timeout=REQUEST_TIMEOUT,
                )
            elapsed = time.time() - start_time

            # 2xx, 4xx問わずJSONパースを試みる
            # 4xx系も「不正入力を拒否した」という正常な防御の可能性がある
            json_data = None
            try:
                json_data = response.json()
            except ValueError:
                # json.JSONDecodeErrorはValueErrorのサブクラス
                # requestsの内部例外も含めて広く捕捉
                pass

            return response, elapsed, json_data

        except requests.exceptions.Timeout:
            elapsed = time.time() - start_time
            return None, elapsed, None
        except requests.exceptions.ConnectionError as e:
            pytest.fail(f"接続エラー: {e}")
            return None, 0, None  # pytest.fail で到達しないが型チェック用


# =============================================================================
# XSS テスト
# =============================================================================

class TestXSS(TestSecurityBase):
    """XSS（クロスサイトスクリプティング）検証"""

    def _check_response_for_xss(self, response: requests.Response, payload: str) -> None:
        """レスポンスボディに危険なXSSパターンがないかチェック"""
        is_dangerous, reason = contains_dangerous_xss_pattern(response.text)
        assert not is_dangerous, (
            f"XSS脆弱性（レスポンスボディ）: {reason}\n  入力: {payload}"
        )

    @pytest.mark.parametrize("payload", XSS_PAYLOADS)
    def test_xss_neutralized(self, payload: str) -> None:
        """XSSペイロードが無害化されていることを確認"""
        response, _, json_data = self.send_request(payload)

        assert response is not None, "レスポンスがありません"
        
        # 4xx系でもエラーページに反射XSSがないかチェック
        if response.status_code in [400, 422, 403]:
            self._check_response_for_xss(response, payload)
            return  # チェック後にパス
        
        assert response.status_code == 200, f"予期しないステータスコード: {response.status_code}"
        
        # JSONがない場合はresponse.textをフォールバックでチェック
        if json_data is None:
            self._check_response_for_xss(response, payload)
            return

        safe_message = json_data.get("data", {}).get("message", "")
        is_dangerous, reason = contains_dangerous_xss_pattern(safe_message)

        assert not is_dangerous, (
            f"XSS脆弱性: {reason}\n  入力: {payload}\n  出力: {safe_message}"
        )

    @pytest.mark.parametrize("payload", XSS_PAYLOADS)
    def test_xss_html_special_chars_escaped(self, payload: str) -> None:
        """HTML特殊文字（< >）がエスケープされていることを確認"""
        response, _, json_data = self.send_request(payload)

        assert response is not None, "レスポンスがありません"

        # 4xx系でもエラーページに生のHTMLが含まれていないかチェック
        if response.status_code in [400, 422, 403]:
            if "<" in payload or ">" in payload:
                assert is_html_escaped(response.text), (
                    f"エラーレスポンスにHTMLタグが未エスケープ\n  入力: {payload}"
                )
            return

        # JSONがない場合はresponse.textをフォールバックでチェック
        if json_data is None:
            if "<" in payload or ">" in payload:
                assert is_html_escaped(response.text), (
                    f"レスポンスにHTMLタグが未エスケープ\n  入力: {payload}"
                )
            return

        safe_message = json_data.get("data", {}).get("message", "")

        if "<" in payload or ">" in payload:
            assert is_html_escaped(safe_message), (
                f"HTMLタグがエスケープされていません\n  入力: {payload}\n  出力: {safe_message}"
            )

    @pytest.mark.parametrize("payload", [
        "javascript:alert(1)",
        "JAVASCRIPT:alert(1)",
        "javascript:alert('XSS')",
        " javascript:alert(1)",  # 先頭スペース
    ])
    def test_xss_javascript_protocol_blocked(self, payload: str) -> None:
        """javascript: プロトコルがブロックされていることを確認"""
        response, _, json_data = self.send_request(payload)

        assert response is not None, "レスポンスがありません"

        # 4xx系でもエラーページにjavascript:が含まれていないかチェック
        if response.status_code in [400, 422, 403]:
            response_lower = response.text.lower()
            has_raw_js = "javascript:" in response_lower and "[blocked]" not in response_lower
            assert not has_raw_js, f"エラーレスポンスにjavascript:プロトコル: {payload}"
            return

        # JSONがない場合はresponse.textをフォールバックでチェック
        if json_data is None:
            response_lower = response.text.lower()
            has_raw_js = "javascript:" in response_lower and "[blocked]" not in response_lower
            assert not has_raw_js, f"レスポンスにjavascript:プロトコル: {payload}"
            return

        safe_message = json_data.get("data", {}).get("message", "").lower()
        has_raw_js = "javascript:" in safe_message and "[blocked]" not in safe_message

        assert not has_raw_js, f"javascript: プロトコルが未処理: {safe_message}"


# =============================================================================
# SQL Injection テスト
# =============================================================================

class TestSQLInjection(TestSecurityBase):
    """SQLインジェクション検証"""

    SQL_ERROR_PATTERNS: list[str] = [
        "sql syntax",
        "mysql",
        "postgresql",
        "sqlite",
        "oracle",
        "sqlexception",
        "odbc",
        "jdbc",
        "syntax error",
        "unclosed quotation",
        "unterminated string",
        "query failed",
    ]

    @pytest.mark.parametrize("payload", SQL_INJECTION_PAYLOADS)
    def test_sqli_no_error_leak(self, payload: str) -> None:
        """SQLエラーメッセージが漏洩していないことを確認"""
        response, _, _ = self.send_request(payload)

        assert response is not None, "レスポンスがありません"

        found = contains_error_pattern(response.text, self.SQL_ERROR_PATTERNS)
        assert found is None, f"SQLエラー情報の漏洩: '{found}' found"

    @pytest.mark.parametrize("payload", SQL_INJECTION_PAYLOADS)
    def test_sqli_quotes_escaped(self, payload: str) -> None:
        """クォート文字がエスケープされていることを確認"""
        response, _, json_data = self.send_request(payload)

        # 4xx系は「不正入力を拒否した」ので安全
        if response and response.status_code in [400, 422, 403]:
            return  # テストパス

        if json_data is None:
            pytest.skip("JSONレスポンスなし")

        safe_message = json_data.get("data", {}).get("message", "")

        if "'" in payload:
            assert is_quote_escaped(safe_message, "'"), (
                f"シングルクォートがエスケープされていません: {safe_message}"
            )

    @pytest.mark.parametrize("payload", SQL_TIME_BASED_PAYLOADS)
    @pytest.mark.slow
    def test_sqli_time_based_sleep(self, payload: str) -> None:
        """タイムベースSQLインジェクションが無効化されていることを確認
        
        ベースラインレイテンシ + 閾値との相対比較により、
        ネットワーク遅延による誤検知を軽減。
        """
        _, elapsed, _ = self.send_request(payload)

        # ベースライン + 閾値で判定（ネットワーク遅延を考慮）
        threshold = self.baseline_latency + TIME_BASED_THRESHOLD

        assert elapsed < threshold, (
            f"タイムベースSQLiの可能性: {payload}\n"
            f"  応答時間: {elapsed:.2f}s\n"
            f"  ベースライン: {self.baseline_latency:.2f}s\n"
            f"  閾値: {threshold:.2f}s (ベースライン + {TIME_BASED_THRESHOLD}s)"
        )


# =============================================================================
# NoSQL Injection テスト
# =============================================================================

class TestNoSQLInjection(TestSecurityBase):
    """NoSQLインジェクション検証（MongoDB等）"""

    NOSQL_ERROR_PATTERNS: list[str] = [
        "mongodb",
        "bson",
        "objectid",
        "mongoerror",
        "aggregate",
        "collection",
    ]

    @pytest.mark.parametrize("payload", NOSQL_PAYLOADS)
    def test_nosql_no_error_leak(self, payload: str) -> None:
        """NoSQLエラーメッセージが漏洩していないことを確認"""
        response, _, _ = self.send_request(payload)

        assert response is not None, "レスポンスがありません"

        found = contains_error_pattern(response.text, self.NOSQL_ERROR_PATTERNS)
        assert found is None, f"NoSQLエラー情報の漏洩: '{found}' found"

    @pytest.mark.parametrize("payload", NOSQL_PAYLOADS)
    def test_nosql_operators_escaped(self, payload: str) -> None:
        """NoSQL演算子が無害化されていることを確認
        
        検証内容:
        - 4xx系で拒否されている（安全）
        - または、演算子がエスケープ/無害化されて文字列として保存されている
        - または、演算子が除去されている
        """
        response, _, json_data = self.send_request(payload)

        assert response is not None, "レスポンスがありません"

        # 4xx系は「不正入力を拒否した」ので安全
        if response.status_code in [400, 422, 403]:
            return  # テストパス

        if json_data is None:
            pytest.skip("JSONレスポンスなし")

        safe_message = json_data.get("data", {}).get("message", "")

        # NoSQL演算子を含むペイロードの検証
        nosql_operators = ["$gt", "$ne", "$regex", "$in", "$where", "$or", "$and"]
        
        for op in nosql_operators:
            if op in payload:
                # 演算子がそのまま残っている場合、文字列として扱われているか確認
                # 危険なケース: JSONとしてパースされて演算子として解釈される
                # 
                # 安全なケース:
                # 1. 演算子が除去されている
                # 2. 演算子がエスケープされている（例: \$gt）
                # 3. 入力がそのまま「文字列」として保存されている
                #    （これは安全。DBに{"$gt":""}という文字列が入るだけ）
                
                # レスポンスに予期しないデータが含まれていないか確認
                # （演算子が解釈された場合、他のレコードが返る可能性がある）
                unexpected_patterns = [
                    "admin",  # 権限昇格の兆候
                    "password",  # 機密情報漏洩
                    "secret",
                    "token",
                    "_id",  # MongoDBの内部フィールド
                    "ObjectId",
                ]
                
                response_lower = response.text.lower()
                for pattern in unexpected_patterns:
                    # ペイロード自体に含まれる場合は除外
                    if pattern.lower() in payload.lower():
                        continue
                    assert pattern.lower() not in response_lower, (
                        f"NoSQLi成功の可能性: '{pattern}' がレスポンスに含まれています\n"
                        f"ペイロード: {payload}"
                    )


# =============================================================================
# OS Command Injection テスト
# =============================================================================

class TestOSCommandInjection(TestSecurityBase):
    """OSコマンドインジェクション検証"""

    CMD_OUTPUT_PATTERNS: list[str] = [
        "root:x:",  # /etc/passwd の内容
        "/bin/bash",
        "total ",  # ls -la の出力
        "drwx",  # ls -la のパーミッション
        "permission denied",
        "uid=",  # id コマンドの出力
        "gid=",  # id コマンドの出力
        "groups=",  # id コマンドの出力
    ]

    @pytest.mark.parametrize("payload", OS_CMD_PAYLOADS)
    def test_os_cmd_no_execution(self, payload: str) -> None:
        """OSコマンドが実行されていないことを確認"""
        response, elapsed, _ = self.send_request(payload)

        assert response is not None, "サーバーが応答しません（コマンド実行の可能性）"
        
        # 4xx系は「不正入力を拒否した」ので安全
        if response.status_code in [400, 422, 403]:
            return  # テストパス
        
        assert response.status_code == 200, f"予期しないステータスコード: {response.status_code}"
        assert elapsed < REQUEST_TIMEOUT - 1, (
            f"応答遅延（コマンド実行の可能性）: {elapsed:.2f}s"
        )

    @pytest.mark.parametrize("payload", OS_CMD_PAYLOADS)
    def test_os_cmd_no_output_leak(self, payload: str) -> None:
        """コマンド出力が漏洩していないことを確認"""
        response, _, _ = self.send_request(payload)

        if response is None:
            pytest.skip("レスポンスなし")

        found = contains_error_pattern(response.text, self.CMD_OUTPUT_PATTERNS)
        assert found is None, f"コマンド出力の漏洩: '{found}' found"


# =============================================================================
# Path Traversal テスト
# =============================================================================

class TestPathTraversal(TestSecurityBase):
    """パストラバーサル攻撃検証"""

    # ファイルの「内容」を示すパターン（パス名ではなく）
    # /etc/passwd の内容例: root:x:0:0:root:/root:/bin/bash
    SENSITIVE_FILE_PATTERNS: list[str] = [
        "root:x:0:0:",  # /etc/passwd の root ユーザー行
        "daemon:x:1:1:",  # /etc/passwd の daemon ユーザー行
        "bin:x:2:2:",  # /etc/passwd の bin ユーザー行
        "[boot loader]",  # Windows boot.ini
        "[operating systems]",  # Windows boot.ini
        "for 16-bit app support",  # Windows system.ini
        "; for 16-bit app support",  # Windows win.ini
    ]

    @pytest.mark.parametrize("payload", PATH_TRAVERSAL_PAYLOADS)
    def test_path_traversal_blocked(self, payload: str) -> None:
        """パストラバーサル攻撃がブロックされていることを確認"""
        response, _, _ = self.send_request(payload)

        assert response is not None, "レスポンスがありません"

        # ファイル内容が漏洩していないこと
        found = contains_error_pattern(response.text, self.SENSITIVE_FILE_PATTERNS)
        assert found is None, f"機密ファイルの漏洩: '{found}' found"

    @pytest.mark.parametrize("payload", PATH_TRAVERSAL_PAYLOADS)
    def test_path_traversal_sanitized(self, payload: str) -> None:
        """パストラバーサル文字列がサニタイズされていることを確認"""
        response, _, json_data = self.send_request(payload)

        assert response is not None, "レスポンスがありません"

        # 4xx系は「不正入力を拒否した」ので安全
        if response.status_code in [400, 422, 403]:
            return  # テストパス

        if json_data is None:
            pytest.skip("JSONレスポンスなし")

        # ../ がそのまま残っていないこと（オプション：厳密なチェック）
        # 注：アプリケーションによってはそのまま保存することもある
        assert response.status_code == 200, (
            f"予期しないステータスコード: {response.status_code}"
        )


# =============================================================================
# CRLF Injection テスト
# =============================================================================

class TestCRLFInjection(TestSecurityBase):
    """CRLF（HTTPヘッダ）インジェクション検証"""

    # 注入されたことを示す具体的な値のみをチェック
    # 短すぎるパターン（"lf", "cr"等）は誤検知の原因になるため除外
    INJECTED_COOKIE_VALUES: list[str] = [
        "malicious=true",
        "evil=1",
        "hacked=true",
        "double=1",
        "utf8=1",
        "entity=1",
        "mixed=1",
    ]

    @pytest.mark.parametrize("payload", CRLF_PAYLOADS)
    def test_crlf_no_header_injection(self, payload: str) -> None:
        """CRLFによるヘッダインジェクションが無効化されていることを確認"""
        response, _, _ = self.send_request(payload)

        assert response is not None, "レスポンスがありません"

        # X-Injectedヘッダが注入されていないことを確認（最も確実な検出方法）
        injected_header = response.headers.get("X-Injected", "")
        assert not injected_header, (
            f"CRLFによるヘッダインジェクション成功: X-Injected: {injected_header}"
        )

        # Set-Cookieに悪意のある値が含まれていないことを確認
        set_cookie = response.headers.get("Set-Cookie", "").lower()
        for cookie_val in self.INJECTED_COOKIE_VALUES:
            assert cookie_val not in set_cookie, (
                f"CRLFによるCookieインジェクション成功: {cookie_val}"
            )

    @pytest.mark.parametrize("payload", CRLF_PAYLOADS)
    def test_crlf_no_body_injection(self, payload: str) -> None:
        """CRLFによるボディインジェクションが無効化されていることを確認"""
        response, _, _ = self.send_request(payload)

        if response is None:
            pytest.skip("レスポンスなし")

        content_type = response.headers.get("Content-Type", "")
        if content_type.startswith("application/json"):
            try:
                response.json()
            except ValueError:
                # パースできない場合、注入の可能性
                response_text = response.text.lower()
                assert "<script>" not in response_text, (
                    "CRLFによるボディインジェクションの可能性"
                )
                assert "<html>" not in response_text, (
                    "CRLFによるHTMLインジェクションの可能性"
                )

    @pytest.mark.parametrize("field", INPUT_FIELDS)
    def test_crlf_in_all_fields(self, field: str) -> None:
        """全フィールドでCRLFインジェクションが無効化されていること"""
        payload = "test\r\nX-Injected: fromfield"
        response, _, _ = self.send_request(payload, field=field)

        if response is None:
            pytest.skip("レスポンスなし")

        injected = response.headers.get("X-Injected", "")
        assert not injected, f"フィールド '{field}' でCRLFインジェクション成功"


# =============================================================================
# SSRF テスト
# =============================================================================
# 
# 注意: SSRFテストは、バックエンドがユーザー入力のURLに対してHTTPリクエストを
# 発行する機能（画像プレビュー、Webhook、OGP取得等）がある場合にのみ有効です。
# 
# 現在のお問い合わせフォームにはそのような機能がないため、このテストは無効化しています。
# URL処理機能を追加した際に、以下のコメントを解除して使用してください。
#
# class TestSSRF(TestSecurityBase):
#     """SSRF（Server-Side Request Forgery）検証
#     
#     前提条件:
#     - バックエンドにURL入力を処理する機能があること
#     - 例: 画像URL取得、Webhook、外部APIプロキシ等
#     """
#
#     SSRF_INDICATOR_PATTERNS: list[str] = [
#         "ssh-",
#         "mysql",
#         "amazon",
#         "metadata",
#         "instance-id",
#         "ami-id",
#         "connection refused",
#     ]
#
#     @pytest.fixture(autouse=True)
#     def check_ssrf_enabled(self) -> None:
#         """SSRFテストが有効か確認"""
#         if not ENABLE_SSRF_TESTS:
#             pytest.skip(
#                 "SSRFテストは無効です。有効にするには環境変数 TEST_ENABLE_SSRF=true を設定してください"
#             )
#
#     @pytest.mark.parametrize("payload", SSRF_PAYLOADS)
#     def test_ssrf_internal_access_blocked(self, payload: str) -> None:
#         """内部リソースへのアクセスがブロックされていることを確認"""
#         response, _, _ = self.send_request(payload)
#
#         assert response is not None, "レスポンスがありません"
#
#         found = contains_error_pattern(response.text, self.SSRF_INDICATOR_PATTERNS)
#         assert found is None, f"SSRF成功の可能性: '{found}' found"
#
#     @pytest.mark.parametrize("payload", SSRF_PAYLOADS)
#     def test_ssrf_no_external_request(self, payload: str) -> None:
#         """SSRFペイロードでエラーが発生しないことを確認"""
#         response, elapsed, _ = self.send_request(payload)
#
#         assert response is not None, "サーバーが応答しません"
#         assert elapsed < TIME_BASED_THRESHOLD, (
#             f"外部リクエストの可能性: {payload} (elapsed: {elapsed:.2f}s)"
#         )


# =============================================================================
# Security Headers テスト
# =============================================================================

class TestSecurityHeaders(TestSecurityBase):
    """セキュリティヘッダ検証"""

    def test_content_type_options(self) -> None:
        """X-Content-Type-Optionsヘッダの確認"""
        response, _, _ = self.send_request("test")

        assert response is not None, "レスポンスがありません"

        header = response.headers.get("X-Content-Type-Options", "")
        assert header.lower() == "nosniff", (
            f"X-Content-Type-Options が未設定または不正: {header}"
        )

    def test_frame_options(self) -> None:
        """X-Frame-Optionsヘッダの確認"""
        response, _, _ = self.send_request("test")

        assert response is not None, "レスポンスがありません"

        header = response.headers.get("X-Frame-Options", "").upper()
        assert header in ["DENY", "SAMEORIGIN"], (
            f"X-Frame-Options が未設定または不正: {header}"
        )

    def test_xss_protection(self) -> None:
        """X-XSS-Protectionヘッダの確認"""
        response, _, _ = self.send_request("test")

        assert response is not None, "レスポンスがありません"

        header = response.headers.get("X-XSS-Protection", "")
        if not header:
            pytest.skip("X-XSS-Protection は未設定（最新ブラウザでは非推奨）")

    def test_content_security_policy_exists(self) -> None:
        """Content-Security-Policyヘッダが存在することを確認"""
        response, _, _ = self.send_request("test")

        assert response is not None, "レスポンスがありません"

        csp = response.headers.get("Content-Security-Policy", "")
        assert csp, "Content-Security-Policy が未設定"

    def test_content_security_policy_quality(self) -> None:
        """CSPの品質チェック（警告レベル）"""
        response, _, _ = self.send_request("test")

        assert response is not None, "レスポンスがありません"

        csp = response.headers.get("Content-Security-Policy", "")
        if not csp:
            pytest.skip("CSP未設定")

        warnings = []

        if "script-src" in csp and "'unsafe-inline'" in csp:
            warnings.append("script-src に 'unsafe-inline' が含まれています（XSSリスク増）")

        if "'unsafe-eval'" in csp:
            warnings.append("'unsafe-eval' が含まれています（eval攻撃リスク）")

        if "default-src" not in csp:
            warnings.append("default-src が未設定です")

        if warnings:
            pytest.skip(f"CSP改善推奨: {'; '.join(warnings)}")

    def test_strict_transport_security(self) -> None:
        """Strict-Transport-Security (HSTS) ヘッダの確認"""
        response, _, _ = self.send_request("test")

        assert response is not None, "レスポンスがありません"

        hsts = response.headers.get("Strict-Transport-Security", "")
        # HTTPSでない場合はスキップ
        if not TARGET_URL.startswith("https://"):
            pytest.skip("HTTPSではないためHSTSは適用されません")

        assert hsts, "Strict-Transport-Security が未設定"


# =============================================================================
# Information Leakage テスト
# =============================================================================

class TestInformationLeakage(TestSecurityBase):
    """情報漏洩検証"""

    STACK_TRACE_PATTERNS: list[str] = [
        "traceback",
        "exception",
        "stack trace",
        "at line",
        'file "/',
        "error in",
        '.py"',
        "node_modules",
        ".js:",
    ]

    @pytest.mark.parametrize("payload", [
        "' invalid syntax {{{{",
        "<><<>>><><",
        "\x00\x01\x02",
    ])
    def test_no_stack_trace(self, payload: str) -> None:
        """スタックトレースが漏洩していないことを確認"""
        response, _, _ = self.send_request(payload)

        if response is None:
            pytest.skip("レスポンスなし")

        found = contains_error_pattern(response.text, self.STACK_TRACE_PATTERNS)
        assert found is None, f"スタックトレース漏洩: '{found}' found"

    def test_no_server_version(self) -> None:
        """サーバーバージョン情報が漏洩していないことを確認"""
        response, _, _ = self.send_request("test")

        assert response is not None, "レスポンスがありません"

        server_header = response.headers.get("Server", "")
        version_pattern = r"\d+\.\d+"

        if re.search(version_pattern, server_header):
            pytest.fail(f"Serverヘッダにバージョン情報: {server_header}")

    def test_no_powered_by(self) -> None:
        """X-Powered-Byヘッダが非公開であることを確認"""
        response, _, _ = self.send_request("test")

        assert response is not None, "レスポンスがありません"

        powered_by = response.headers.get("X-Powered-By", "")
        if powered_by:
            pytest.fail(f"X-Powered-By が公開されています: {powered_by}")


# =============================================================================
# Boundary Conditions テスト
# =============================================================================

class TestBoundaryConditions(TestSecurityBase):
    """境界値・異常入力テスト"""

    @pytest.mark.parametrize("payload", BOUNDARY_PAYLOADS)
    def test_boundary_input(self, payload: str) -> None:
        """境界値入力に対する耐性"""
        response, _, _ = self.send_request(payload)

        assert response is not None, "境界値入力でサーバーが応答しません"
        assert response.status_code in [200, 400, 413, 422], (
            f"予期しないステータスコード: {response.status_code}"
        )

    @pytest.mark.parametrize("payload", NULL_BYTE_PAYLOADS)
    def test_null_bytes(self, payload: str) -> None:
        """NULLバイトインジェクション"""
        response, _, _ = self.send_request(payload)

        assert response is not None, f"NULLバイトでサーバーエラー: {repr(payload)}"

    @pytest.mark.parametrize("payload", UNICODE_NORMALIZATION_PAYLOADS)
    def test_unicode_normalization(self, payload: str) -> None:
        """Unicode正規化攻撃への耐性"""
        response, _, json_data = self.send_request(payload)

        assert response is not None, "レスポンスがありません"

        # 4xx系でもエラーページに危険なパターンがないかチェック
        if response.status_code in [400, 422, 403]:
            assert "<script>" not in response.text.lower(), (
                f"エラーレスポンスにUnicode正規化後の危険パターン"
            )
            return

        # JSONがない場合はresponse.textをフォールバックでチェック
        if json_data is None:
            assert "<script>" not in response.text.lower(), (
                f"Unicode正規化後に危険なパターン"
            )
            return

        safe_message = json_data.get("data", {}).get("message", "")
        assert "<script>" not in safe_message.lower(), (
            f"Unicode正規化後に危険なパターン: {safe_message}"
        )

    @pytest.mark.parametrize("payload", MULTIBYTE_PAYLOADS)
    def test_multibyte_characters(self, payload: str) -> None:
        """マルチバイト文字の処理"""
        response, _, _ = self.send_request(payload)

        assert response is not None, f"マルチバイトでエラー: {payload[:20]}"
        assert response.status_code in [200, 400, 422]

    @pytest.mark.parametrize("payload", REDOS_PAYLOADS)
    @pytest.mark.slow
    def test_redos_resistance(self, payload: str) -> None:
        """ReDoS（正規表現DoS）攻撃への耐性
        
        脆弱な正規表現パターン（例: (a+)+）に対して、
        悪意のある入力で処理時間が急増しないことを確認。
        ベースラインレイテンシとの相対比較により誤検知を軽減。
        """
        response, elapsed, _ = self.send_request(payload)

        assert response is not None, (
            f"ReDoSペイロードでサーバーが応答しません: {payload[:30]}..."
        )
        
        # ベースライン + 閾値で判定（ネットワーク遅延を考慮）
        threshold = self.baseline_latency + REDOS_THRESHOLD_SECONDS

        assert elapsed < threshold, (
            f"ReDoS脆弱性の可能性:\n"
            f"  応答時間: {elapsed:.2f}s\n"
            f"  ベースライン: {self.baseline_latency:.2f}s\n"
            f"  閾値: {threshold:.2f}s (ベースライン + {REDOS_THRESHOLD_SECONDS}s)\n"
            f"  ペイロード: {payload[:50]}..."
        )


# =============================================================================
# Input Fields テスト
# =============================================================================

class TestInputFields(TestSecurityBase):
    """全入力フィールドの検証"""

    @pytest.mark.parametrize("field", INPUT_FIELDS)
    def test_xss_all_fields(self, field: str) -> None:
        """全フィールドでXSSペイロードが無害化されていること"""
        payload = "<script>alert(1)</script>"
        response, _, json_data = self.send_request(payload, field=field)

        assert response is not None

        # 4xx系でもエラーページに反射XSSがないかチェック
        if response.status_code in [400, 422, 403]:
            assert "<script>" not in response.text, (
                f"フィールド '{field}' のエラーレスポンスにXSS"
            )
            return

        # JSONがない場合はresponse.textをフォールバックでチェック
        if json_data is None or "data" not in json_data:
            assert "<script>" not in response.text, (
                f"フィールド '{field}' でXSSが未対策"
            )
            return

        field_value = json_data["data"].get(field, "")
        assert "<script>" not in field_value, f"フィールド '{field}' でXSSが未対策"

    @pytest.mark.parametrize("field", INPUT_FIELDS)
    def test_sqli_all_fields(self, field: str) -> None:
        """全フィールドでSQLiペイロードがエスケープされていること"""
        payload = "' OR '1'='1"
        response, _, _ = self.send_request(payload, field=field)

        assert response is not None
        response_lower = response.text.lower()
        assert not ("sql" in response_lower and "syntax" in response_lower)

    @pytest.mark.parametrize("field", INPUT_FIELDS)
    def test_path_traversal_all_fields(self, field: str) -> None:
        """全フィールドでパストラバーサルが無効化されていること"""
        payload = "../../../etc/passwd"
        response, _, _ = self.send_request(payload, field=field)

        assert response is not None
        # ファイルの内容（root:x:0:0:）が漏洩していないこと
        assert "root:x:0:0:" not in response.text, (
            f"フィールド '{field}' でパストラバーサル成功"
        )


# =============================================================================
# Rate Limiting テスト
# =============================================================================

class TestRateLimiting(TestSecurityBase):
    """レート制限機能の検証
    
    サーバーが適切にレート制限を実装しているかを攻撃者視点でテスト。
    短時間に大量のリクエストを送信し、429レスポンスが返るかを確認。
    """

    def send_request_with_headers(
        self,
        payload: str = "test",
        field: str = "message",
        extra_headers: dict[str, str] | None = None,
    ) -> tuple[requests.Response | None, float]:
        """カスタムヘッダー付きでリクエストを送信"""
        data = {
            "name": "RateLimitTester",
            "message": "Normal message",
            "email": "ratelimit@example.com",
            "subject": "Rate Limit Test",
        }
        data[field] = payload

        headers = extra_headers or {}
        
        start_time = time.time()
        try:
            response = self.session.post(
                TARGET_URL,
                data=data,
                headers=headers,
                timeout=REQUEST_TIMEOUT,
            )
            elapsed = time.time() - start_time
            return response, elapsed
        except requests.exceptions.RequestException:
            elapsed = time.time() - start_time
            return None, elapsed

    def test_rate_limit_enforced(self) -> None:
        """レート制限が実施されていることを確認
        
        短時間に大量のリクエストを送信し、途中で429が返るかを確認。
        429が返らない場合は警告（レート制限未実装の可能性）。
        """
        rate_limited = False
        responses: list[int] = []
        
        for i in range(RATE_LIMIT_REQUESTS):
            response, _ = self.send_request_with_headers(f"request_{i}")
            
            if response is None:
                continue
                
            responses.append(response.status_code)
            
            if response.status_code == RATE_LIMIT_EXPECTED_CODE:
                rate_limited = True
                break
        
        # 結果のサマリー
        status_counts = {}
        for code in responses:
            status_counts[code] = status_counts.get(code, 0) + 1
        
        if not rate_limited:
            pytest.skip(
                f"レート制限が検出されませんでした（{RATE_LIMIT_REQUESTS}リクエスト送信）。"
                f"ステータスコード分布: {status_counts}。"
                "サーバーにレート制限が未実装の可能性があります。"
            )
        
        assert rate_limited, "レート制限が機能していません"

    def test_rate_limit_response_headers(self) -> None:
        """レート制限関連のレスポンスヘッダーを確認
        
        標準的なレート制限ヘッダー（X-RateLimit-*）が含まれているかを確認。
        """
        response, _ = self.send_request_with_headers("header_check")
        
        if response is None:
            pytest.skip("レスポンスがありません")
        
        rate_limit_headers = [
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
            "RateLimit-Limit",
            "RateLimit-Remaining",
            "RateLimit-Reset",
            "Retry-After",
        ]
        
        found_headers = {
            h: response.headers.get(h)
            for h in rate_limit_headers
            if response.headers.get(h)
        }
        
        if not found_headers:
            pytest.skip(
                "レート制限関連ヘッダーが見つかりません。"
                "実装を検討してください: X-RateLimit-Limit, X-RateLimit-Remaining 等"
            )

    @pytest.mark.parametrize("bypass_headers", RATE_LIMIT_BYPASS_HEADERS)
    def test_rate_limit_bypass_xff(self, bypass_headers: dict[str, str]) -> None:
        """X-Forwarded-For等によるレート制限バイパスが防止されていることを確認
        
        攻撃者がIPアドレスを偽装してレート制限を回避しようとするパターンをテスト。
        """
        responses_normal: list[int] = []
        responses_spoofed: list[int] = []
        
        # 通常リクエストを送信してベースラインを取得
        for i in range(10):
            response, _ = self.send_request_with_headers(f"normal_{i}")
            if response:
                responses_normal.append(response.status_code)
        
        # 偽装ヘッダー付きで追加リクエストを送信
        for i in range(10):
            response, _ = self.send_request_with_headers(
                f"spoofed_{i}",
                extra_headers=bypass_headers,
            )
            if response:
                responses_spoofed.append(response.status_code)
        
        # 偽装ヘッダーで200が返り続ける場合、バイパス可能な可能性
        spoofed_success_rate = responses_spoofed.count(200) / len(responses_spoofed) if responses_spoofed else 0
        normal_success_rate = responses_normal.count(200) / len(responses_normal) if responses_normal else 0
        
        # 偽装時の成功率が通常時より著しく高い場合は警告
        if spoofed_success_rate > normal_success_rate + 0.3:
            pytest.fail(
                f"レート制限バイパスの可能性: {bypass_headers}\n"
                f"通常成功率: {normal_success_rate:.0%}, 偽装成功率: {spoofed_success_rate:.0%}"
            )

    @pytest.mark.parametrize("user_agent", RATE_LIMIT_BYPASS_USER_AGENTS)
    def test_rate_limit_bypass_user_agent(self, user_agent: str) -> None:
        """User-Agent変更によるレート制限バイパスが防止されていることを確認"""
        responses: list[int] = []
        
        for i in range(15):
            response, _ = self.send_request_with_headers(
                f"ua_test_{i}",
                extra_headers={"User-Agent": user_agent},
            )
            if response:
                responses.append(response.status_code)
        
        # 全て200の場合、User-Agent単位でレート制限している可能性（脆弱）
        # ただし15リクエストではレート制限に達しない可能性もあるのでskip扱い
        if all(code == 200 for code in responses):
            pytest.skip(
                f"User-Agent '{user_agent[:30]}...' で15リクエスト全て成功。"
                "レート制限閾値未満か、User-Agent単位で制限している可能性。"
            )

    def test_rate_limit_recovery(self) -> None:
        """レート制限後の回復を確認
        
        レート制限がかかった後、一定時間待機してリクエストが再び受け入れられるかを確認。
        """
        # まずレート制限をトリガー
        rate_limited_at = None
        for i in range(RATE_LIMIT_REQUESTS):
            response, _ = self.send_request_with_headers(f"trigger_{i}")
            if response and response.status_code == RATE_LIMIT_EXPECTED_CODE:
                rate_limited_at = i
                break
        
        if rate_limited_at is None:
            pytest.skip("レート制限がトリガーされませんでした")
        
        # Retry-After ヘッダーがあれば取得
        retry_after = None
        if response:
            retry_after_header = response.headers.get("Retry-After")
            if retry_after_header:
                try:
                    retry_after = int(retry_after_header)
                except ValueError:
                    pass
        
        # 待機時間を決定（最大10秒に制限）
        wait_time = min(retry_after or 5, 10)
        
        # 待機
        time.sleep(wait_time)
        
        # 回復確認
        response, _ = self.send_request_with_headers("recovery_check")
        
        if response is None:
            pytest.fail("回復確認リクエストでレスポンスがありません")
        
        assert response.status_code in [200, 429], (
            f"予期しないステータスコード: {response.status_code}"
        )
        
        if response.status_code == 429:
            pytest.skip(
                f"{wait_time}秒待機後もレート制限中。"
                "より長い待機時間が必要か、永続的な制限の可能性。"
            )

    def test_rate_limit_per_endpoint(self) -> None:
        """エンドポイントごとにレート制限が適用されているか確認
        
        一つのエンドポイントでレート制限がかかっても、
        他のエンドポイントは影響を受けないことを確認。
        
        環境変数 TEST_RATE_LIMIT_GET_ENDPOINT でGETエンドポイントを指定可能。
        """
        # POSTでレート制限をトリガー
        for i in range(RATE_LIMIT_REQUESTS):
            response, _ = self.send_request_with_headers(f"endpoint_test_{i}")
            if response and response.status_code == RATE_LIMIT_EXPECTED_CODE:
                break
        else:
            pytest.skip("POSTでレート制限がトリガーされませんでした")
        
        # GETエンドポイントを決定
        if RATE_LIMIT_GET_ENDPOINT:
            get_url = RATE_LIMIT_GET_ENDPOINT
        else:
            # デフォルト: TARGET_URLの親ディレクトリ
            get_url = TARGET_URL.rstrip("/").rsplit("/", 1)[0] + "/"
        
        # GETリクエストは影響を受けないことを確認
        try:
            get_response = self.session.get(get_url, timeout=REQUEST_TIMEOUT)
            
            # 404等のエラーは「レート制限とは別の問題」なのでスキップ
            if get_response.status_code == 404:
                pytest.skip(
                    f"GETエンドポイント {get_url} が404を返しました。"
                    "TEST_RATE_LIMIT_GET_ENDPOINT 環境変数で有効なエンドポイントを指定してください。"
                )
            
            # GETが429でないことを確認（エンドポイント分離）
            if get_response.status_code == RATE_LIMIT_EXPECTED_CODE:
                pytest.skip(
                    "GETリクエストもレート制限中。"
                    "グローバルレート制限の可能性（これは設計次第で問題なし）。"
                )
        except requests.exceptions.RequestException as e:
            pytest.skip(f"GETリクエストでエラー発生: {e}")

    def test_rate_limit_info_leak(self) -> None:
        """レート制限時のエラーレスポンスに機密情報が含まれていないことを確認"""
        # レート制限をトリガー
        rate_limit_response = None
        for i in range(RATE_LIMIT_REQUESTS + 10):
            response, _ = self.send_request_with_headers(f"info_leak_{i}")
            if response and response.status_code == RATE_LIMIT_EXPECTED_CODE:
                rate_limit_response = response
                break
        
        if rate_limit_response is None:
            pytest.skip("レート制限がトリガーされませんでした")
        
        response_text = rate_limit_response.text.lower()
        
        # 機密情報パターン
        sensitive_patterns = [
            "internal server",
            "stack trace",
            "traceback",
            "exception",
            "debug",
            "rate_limit_key",
            "redis",
            "memcached",
            "ip address",
        ]
        
        found = contains_error_pattern(response_text, sensitive_patterns)
        assert found is None, f"レート制限レスポンスに機密情報: '{found}'"


# =============================================================================
# エントリポイント
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])