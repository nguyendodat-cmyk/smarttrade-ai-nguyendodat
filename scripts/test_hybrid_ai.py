#!/usr/bin/env python3
"""
Test Script for SmartTrade Hybrid AI System
Tests query routing, context building, and AI responses
"""

import asyncio
import sys
import os

# Add the ai-service to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'ai-service'))

from app.services.query_router import query_router, QueryType
from app.utils.prompts import get_system_prompt

# Test queries organized by expected type
TEST_QUERIES = {
    QueryType.STOCK_ANALYSIS: [
        "Phân tích VNM",
        "Đánh giá cổ phiếu FPT",
        "TCB thế nào? Có nên mua không?",
        "Nhận định HPG",
        "VCB xu hướng ra sao?",
    ],
    QueryType.MARKET_OVERVIEW: [
        "Thị trường hôm nay thế nào?",
        "VN-Index ra sao?",
        "Tổng quan thị trường tuần này",
        "Nhận định phiên chiều",
    ],
    QueryType.COMPARISON: [
        "So sánh FPT và CMG",
        "TCB vs VCB cái nào tốt hơn?",
        "Chọn HPG hay HSG?",
    ],
    QueryType.NEWS_QUERY: [
        "Tin tức mới nhất về HPG",
        "Tin tức ngân hàng hôm nay",
        "Có tin gì mới không?",
    ],
    QueryType.REGULATION_QUERY: [
        "T+2 là gì?",
        "Quy định về margin",
        "Room ngoại như thế nào?",
    ],
    QueryType.GENERAL_QA: [
        "RSI là gì?",
        "Cách đọc báo cáo tài chính",
        "P/E có ý nghĩa gì?",
    ],
}


def test_query_router():
    """Test query routing functionality"""
    print("\n" + "=" * 60)
    print("TEST 1: Query Router")
    print("=" * 60)

    total = 0
    correct = 0

    for expected_type, queries in TEST_QUERIES.items():
        print(f"\n📋 Testing {expected_type.value}:")

        for query in queries:
            total += 1
            result_type, extracted = query_router.route(query)

            status = "✅" if result_type == expected_type else "❌"
            if result_type == expected_type:
                correct += 1

            symbols = extracted.get('symbols', [])
            symbol_str = f" [{', '.join(symbols)}]" if symbols else ""

            print(f"  {status} \"{query}\"")
            print(f"      → {result_type.value}{symbol_str}")

    accuracy = (correct / total) * 100
    print(f"\n📊 Accuracy: {correct}/{total} ({accuracy:.1f}%)")
    return accuracy >= 80


def test_system_prompts():
    """Test system prompt generation"""
    print("\n" + "=" * 60)
    print("TEST 2: System Prompts")
    print("=" * 60)

    for query_type in QueryType:
        prompt = get_system_prompt(query_type)
        preview = prompt[:100].replace('\n', ' ')
        print(f"\n📝 {query_type.value}:")
        print(f"   Length: {len(prompt)} chars")
        print(f"   Preview: {preview}...")

    return True


def test_symbol_extraction():
    """Test stock symbol extraction"""
    print("\n" + "=" * 60)
    print("TEST 3: Symbol Extraction")
    print("=" * 60)

    test_cases = [
        ("Phân tích VNM và FPT", ["VNM", "FPT"]),
        ("TCB thế nào?", ["TCB"]),
        ("So sánh HPG vs HSG", ["HPG", "HSG"]),
        ("Thị trường hôm nay thế nào?", []),
        ("MWG, VNM, FPT đều tốt", ["MWG", "VNM", "FPT"]),
    ]

    correct = 0
    for query, expected in test_cases:
        _, extracted = query_router.route(query)
        symbols = extracted.get('symbols', [])

        status = "✅" if set(symbols) == set(expected) else "❌"
        if set(symbols) == set(expected):
            correct += 1

        print(f"  {status} \"{query}\"")
        print(f"      Expected: {expected}")
        print(f"      Got: {symbols}")

    print(f"\n📊 Accuracy: {correct}/{len(test_cases)}")
    return correct == len(test_cases)


def test_context_requirements():
    """Test context requirement mapping"""
    print("\n" + "=" * 60)
    print("TEST 4: Context Requirements")
    print("=" * 60)

    for query_type in QueryType:
        reqs = query_router.get_required_context(query_type)
        print(f"\n📋 {query_type.value}:")
        for source, needed in reqs.items():
            icon = "✅" if needed else "❌"
            print(f"   {icon} {source}")

    return True


async def test_full_pipeline():
    """Test full AI pipeline (requires running services)"""
    print("\n" + "=" * 60)
    print("TEST 5: Full Pipeline (Mock)")
    print("=" * 60)

    # This would test the full pipeline with actual API calls
    # For now, just validate the structure

    sample_queries = [
        "Phân tích VNM",
        "Thị trường hôm nay thế nào?",
        "So sánh FPT và CMG",
    ]

    for query in sample_queries:
        query_type, extracted = query_router.route(query)
        reqs = query_router.get_required_context(query_type)
        prompt = get_system_prompt(query_type)

        print(f"\n🔍 Query: \"{query}\"")
        print(f"   Type: {query_type.value}")
        print(f"   Symbols: {extracted.get('symbols', [])}")
        print(f"   Context sources: {[k for k, v in reqs.items() if v]}")
        print(f"   Prompt length: {len(prompt)} chars")

    return True


def main():
    """Run all tests"""
    print("\n" + "🚀" * 30)
    print(" SmartTrade Hybrid AI - Test Suite")
    print("🚀" * 30)

    results = []

    # Test 1: Query Router
    results.append(("Query Router", test_query_router()))

    # Test 2: System Prompts
    results.append(("System Prompts", test_system_prompts()))

    # Test 3: Symbol Extraction
    results.append(("Symbol Extraction", test_symbol_extraction()))

    # Test 4: Context Requirements
    results.append(("Context Requirements", test_context_requirements()))

    # Test 5: Full Pipeline
    results.append(("Full Pipeline", asyncio.run(test_full_pipeline())))

    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)

    all_passed = True
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} - {name}")
        if not passed:
            all_passed = False

    print("\n" + ("✅ All tests passed!" if all_passed else "❌ Some tests failed"))

    return 0 if all_passed else 1


if __name__ == "__main__":
    exit(main())
