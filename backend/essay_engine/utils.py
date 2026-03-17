from __future__ import annotations

import re
import unicodedata
from typing import Iterable

from .constants import STOPWORDS


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", str(value or ""))
    normalized = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    normalized = normalized.lower()
    normalized = re.sub(r"[^a-z0-9\s.!?]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip()


def split_paragraphs(value: str) -> list[str]:
    return [item.strip() for item in str(value or "").splitlines() if item.strip()]


def split_sentences(value: str) -> list[str]:
    matches = re.findall(r"[^.!?]+[.!?]?", str(value or "").replace("\n", " "))
    return [item.strip() for item in matches if item.strip()]


def count_words(value: str) -> int:
    text = str(value or "").strip()
    return len(re.findall(r"\S+", text))


def clamp(value: float | int, minimum: int, maximum: int) -> int:
    try:
        numeric = round(float(value))
    except Exception:
        numeric = minimum
    return max(minimum, min(maximum, int(numeric)))


def band_score(value: float | int) -> int:
    return clamp(round((float(value or 0) / 20)) * 20, 0, 200)


def contains_term(text: str, term: str) -> bool:
    normalized_text = normalize_text(text)
    normalized_term = normalize_text(term)

    if not normalized_text or not normalized_term:
        return False

    if " " in normalized_term:
        return normalized_term in normalized_text

    return re.search(rf"(^|\s){re.escape(normalized_term)}(?=\s|$)", normalized_text) is not None


def marker_metrics(text: str, terms: Iterable[str]) -> dict:
    found = [term for term in terms if contains_term(text, term)]
    return {
        "total": len(found),
        "unique": len(set(found)),
        "items": list(dict.fromkeys(found)),
    }


def significant_words(text: str, min_length: int = 4) -> list[str]:
    return [
        word
        for word in normalize_text(text).split()
        if len(word) >= min_length and word not in STOPWORDS
    ]


def unique_word_ratio(text: str) -> float:
    words = significant_words(text, 4)
    if not words:
        return 0.0
    return len(set(words)) / len(words)


def paragraph_opening_variety(paragraphs: list[str]) -> int:
    openings = []
    for paragraph in paragraphs:
        words = significant_words(paragraph, 3)[:3]
        if words:
            openings.append(" ".join(words))
    return len(set(openings))


def theme_keywords(*values: str) -> list[str]:
    words: list[str] = []
    for value in values:
        for word in significant_words(value, 4):
            if word not in words:
                words.append(word)
    return words[:10]


def feedback_text(value: str, max_length: int = 420) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()[:max_length]


def feedback_list(values: Iterable[str], max_items: int = 5, max_length: int = 180) -> list[str]:
    result: list[str] = []
    for value in values:
        cleaned = feedback_text(value, max_length)
        if cleaned and cleaned not in result:
            result.append(cleaned)
        if len(result) >= max_items:
            break
    return result
