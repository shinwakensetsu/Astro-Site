"""
pytest設定ファイル

セキュリティE2Eテストの共通設定とフィクスチャを定義。
"""
from __future__ import annotations

import os

import pytest


def pytest_configure(config: pytest.Config) -> None:
    """pytest設定フック"""
    # カスタムマーカーの登録
    config.addinivalue_line(
        "markers", "slow: 遅いテスト（タイムベース検証など）"
    )


def pytest_report_header(config: pytest.Config) -> list[str]:
    """テストレポートヘッダーに設定情報を追加"""
    target_url = os.getenv("TEST_TARGET_URL", "http://localhost:4321/api/contact/")
    body_format = os.getenv("TEST_REQUEST_BODY_FORMAT", "form")
    
    return [
        f"Target URL: {target_url}",
        f"Request Body Format: {body_format}",
    ]