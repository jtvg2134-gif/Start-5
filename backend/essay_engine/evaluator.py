from __future__ import annotations

import re
from typing import Any

from .constants import (
    CAUSAL_MARKERS,
    COMPETENCIES,
    CONCLUSION_MARKERS,
    CONNECTIVES,
    EXAMPLE_MARKERS,
    INFORMAL_MARKERS,
    INTERVENTION_ACTIONS,
    INTERVENTION_AGENTS,
    INTERVENTION_DETAILS,
    INTERVENTION_MEANS,
    INTERVENTION_PURPOSES,
    REPERTOIRE_MARKERS,
    THESIS_MARKERS,
)
from .utils import (
    band_score,
    contains_term,
    count_words,
    feedback_list,
    feedback_text,
    marker_metrics,
    paragraph_opening_variety,
    split_paragraphs,
    split_sentences,
    theme_keywords,
    unique_word_ratio,
)


def _theme_coverage(theme_title: str, theme_prompt: str, paragraphs: list[str]) -> dict[str, Any]:
    keywords = theme_keywords(theme_title, theme_prompt)
    intro_text = paragraphs[0] if paragraphs else ""
    body_text = " ".join(paragraphs[1:-1]) if len(paragraphs) > 2 else " ".join(paragraphs[1:])
    conclusion_text = paragraphs[-1] if paragraphs else ""
    all_text = " ".join(paragraphs)

    intro_hits = sum(1 for word in keywords if contains_term(intro_text, word))
    body_hits = sum(1 for word in keywords if contains_term(body_text, word))
    conclusion_hits = sum(1 for word in keywords if contains_term(conclusion_text, word))
    total_hits = sum(1 for word in keywords if contains_term(all_text, word))
    coverage = (total_hits / len(keywords)) if keywords else 0.0

    return {
        "keywords": keywords,
        "intro_hits": intro_hits,
        "body_hits": body_hits,
        "conclusion_hits": conclusion_hits,
        "total_hits": total_hits,
        "coverage": coverage,
    }


def _intervention_metrics(conclusion_text: str) -> dict[str, Any]:
    return {
        "agents": marker_metrics(conclusion_text, INTERVENTION_AGENTS),
        "actions": marker_metrics(conclusion_text, INTERVENTION_ACTIONS),
        "means": marker_metrics(conclusion_text, INTERVENTION_MEANS),
        "purposes": marker_metrics(conclusion_text, INTERVENTION_PURPOSES),
        "details": marker_metrics(conclusion_text, INTERVENTION_DETAILS),
    }


def _intervention_component_count(metrics: dict[str, Any]) -> int:
    return sum(
        1
        for key in ("agents", "actions", "means", "purposes", "details")
        if metrics[key]["total"] > 0
    )


def evaluate_submission(submission: dict[str, Any], source_error_message: str = "", source_status_code: int = 0) -> dict[str, Any]:
    essay_text = str(submission.get("essayText") or "")
    theme_title = str(submission.get("themeTitle") or "")
    theme_prompt = str(submission.get("themePrompt") or theme_title)
    paragraphs = split_paragraphs(essay_text)
    sentences = split_sentences(essay_text)
    word_count = int(submission.get("wordCount") or count_words(essay_text))
    avg_sentence_words = (word_count / len(sentences)) if sentences else float(word_count)

    uppercase_matches = sum(1 for char in essay_text if char.isalpha() and char.isupper())
    letter_matches = sum(1 for char in essay_text if char.isalpha())
    uppercase_ratio = (uppercase_matches / letter_matches) if letter_matches else 0.0
    exclamation_count = essay_text.count("!")
    question_count = essay_text.count("?")
    repeated_punctuation_count = len(re.findall(r"([!?.,;:])\1{1,}", essay_text))
    informal_metrics = marker_metrics(essay_text, INFORMAL_MARKERS)
    connective_metrics = marker_metrics(essay_text, CONNECTIVES)
    causal_metrics = marker_metrics(essay_text, CAUSAL_MARKERS)
    example_metrics = marker_metrics(essay_text, EXAMPLE_MARKERS)
    repertory_metrics = marker_metrics(essay_text, REPERTOIRE_MARKERS)
    intro_text = paragraphs[0] if paragraphs else essay_text
    conclusion_text = paragraphs[-1] if paragraphs else essay_text
    thesis_marker_count = sum(1 for marker in THESIS_MARKERS if contains_term(intro_text, marker))
    conclusion_marker_count = sum(1 for marker in CONCLUSION_MARKERS if contains_term(conclusion_text, marker))
    theme_coverage = _theme_coverage(theme_title, theme_prompt, paragraphs)
    intervention_metrics = _intervention_metrics(conclusion_text)
    intervention_component_count = _intervention_component_count(intervention_metrics)
    lexical_diversity = unique_word_ratio(essay_text)
    opening_variety = paragraph_opening_variety(paragraphs)
    body_paragraphs = paragraphs[1:-1] if len(paragraphs) > 2 else paragraphs[1:]
    body_substance = sum(1 for paragraph in body_paragraphs if count_words(paragraph) >= 45)
    short_paragraphs = sum(1 for paragraph in paragraphs if count_words(paragraph) < 25)
    numeric_evidence_count = len(re.findall(r"\b\d+(?:[.,]\d+)?\b|%", essay_text))

    score_c1 = 80
    if word_count >= 260:
        score_c1 += 20
    if len(paragraphs) >= 4:
        score_c1 += 20
    if 10 <= avg_sentence_words <= 28:
        score_c1 += 20
    if informal_metrics["total"] == 0:
        score_c1 += 20
    if exclamation_count == 0 and repeated_punctuation_count == 0:
        score_c1 += 20
    if lexical_diversity >= 0.45:
        score_c1 += 20
    if informal_metrics["total"] > 0:
        score_c1 -= 20
    if avg_sentence_words < 6 or avg_sentence_words > 34:
        score_c1 -= 20
    if exclamation_count > 1 or question_count > 2 or repeated_punctuation_count > 0:
        score_c1 -= 20
    if short_paragraphs >= 2:
        score_c1 -= 20
    score_c1 = band_score(score_c1)

    score_c2 = 40
    if theme_coverage["coverage"] >= 0.6:
        score_c2 += 100
    elif theme_coverage["coverage"] >= 0.4:
        score_c2 += 80
    elif theme_coverage["coverage"] >= 0.25:
        score_c2 += 60
    elif theme_coverage["total_hits"] > 0:
        score_c2 += 40
    else:
        score_c2 += 20
    if theme_coverage["intro_hits"] > 0:
        score_c2 += 20
    if theme_coverage["body_hits"] >= 2:
        score_c2 += 20
    if repertory_metrics["total"] > 0:
        score_c2 += 20
    if thesis_marker_count > 0:
        score_c2 += 20
    score_c2 = band_score(score_c2)

    score_c3 = 40
    if len(paragraphs) >= 4:
        score_c3 += 20
    if len(body_paragraphs) >= 2:
        score_c3 += 20
    if body_substance >= 2:
        score_c3 += 20
    if thesis_marker_count > 0:
        score_c3 += 20
    if causal_metrics["total"] >= 2:
        score_c3 += 20
    if example_metrics["total"] >= 1 or numeric_evidence_count > 0:
        score_c3 += 20
    if repertory_metrics["total"] > 0:
        score_c3 += 20
    if theme_coverage["body_hits"] >= 2:
        score_c3 += 20
    score_c3 = band_score(score_c3)

    score_c4 = 40
    if connective_metrics["total"] >= 3:
        score_c4 += 20
    if connective_metrics["unique"] >= 3:
        score_c4 += 20
    if connective_metrics["unique"] >= 5:
        score_c4 += 20
    if opening_variety >= 3:
        score_c4 += 20
    if 10 <= avg_sentence_words <= 28:
        score_c4 += 20
    if conclusion_marker_count > 0:
        score_c4 += 20
    if len(paragraphs) >= 4:
        score_c4 += 20
    score_c4 = band_score(score_c4)

    score_c5 = 20
    if conclusion_marker_count > 0:
        score_c5 += 20
    score_c5 += intervention_component_count * 30
    if count_words(conclusion_text) >= 45:
        score_c5 += 10
    if intervention_metrics["details"]["total"] > 0:
        score_c5 += 10
    score_c5 = band_score(score_c5)

    quota_or_config_issue = source_status_code == 429 or any(
        token in (source_error_message or "").lower()
        for token in ("quota", "billing", "rate limit", "openai_api_key", "openai_model")
    )
    prefix = (
        "Avaliação local automática usada porque a IA não estava disponível agora."
        if quota_or_config_issue
        else "Avaliação local automática usada como plano de segurança."
    )

    competencies = [
        {
            "id": 1,
            "name": COMPETENCIES[0]["name"],
            "score": score_c1,
            "justification": f"O texto trouxe {word_count} palavras em {len(paragraphs)} parágrafo(s), com média de {max(1, round(avg_sentence_words))} palavras por frase. A formalidade ficou mais estável quando a pontuação e o registro se mantiveram regulares.",
            "improvement": "Retire marcas de oralidade e revise ortografia, acentuação e pontuação frase por frase." if informal_metrics["total"] > 0 else "Faça uma revisão final de ortografia, concordância e pontuação para sustentar um registro formal do começo ao fim.",
        },
        {
            "id": 2,
            "name": COMPETENCIES[1]["name"],
            "score": score_c2,
            "justification": f"A leitura temática encontrou {theme_coverage['total_hits']} aproximações com o tema, com cobertura estimada de {round(theme_coverage['coverage'] * 100)}% das palavras-chave analisadas, além de {repertory_metrics['total']} referência(s) de repertório.",
            "improvement": "Retome o foco do tema já na introdução e faça os parágrafos de desenvolvimento voltarem explicitamente ao recorte proposto." if theme_coverage["coverage"] < 0.35 else "Aprofunde o recorte do tema com repertório e explicite melhor como cada argumento conversa com a proposta.",
        },
        {
            "id": 3,
            "name": COMPETENCIES[2]["name"],
            "score": score_c3,
            "justification": f"A argumentação foi estimada a partir da presença de tese na introdução, {body_substance} parágrafo(s) de desenvolvimento com bom corpo textual, {causal_metrics['total']} marca(s) de causa e {example_metrics['total'] + numeric_evidence_count} sinal(is) de exemplificação ou dado.",
            "improvement": "Fortaleça os parágrafos de desenvolvimento com uma ideia central mais clara, explicação e consequência." if body_substance < 2 else "Refine a progressão dos argumentos para que cada desenvolvimento avance a tese com mais precisão.",
        },
        {
            "id": 4,
            "name": COMPETENCIES[3]["name"],
            "score": score_c4,
            "justification": f"Foram identificados {connective_metrics['total']} conectivo(s) relevantes, com diversidade de {connective_metrics['unique']}, além de variedade de abertura em {opening_variety} parágrafo(s), o que ajuda a medir a costura do texto.",
            "improvement": "Use conectivos mais variados entre frases e parágrafos para deixar a progressão das ideias mais fluida." if connective_metrics["unique"] < 3 else "Mantenha a coesão, mas refine a transição entre um argumento e outro para o texto soar mais orgânico.",
        },
        {
            "id": 5,
            "name": COMPETENCIES[4]["name"],
            "score": score_c5,
            "justification": f"Na parte final apareceram {intervention_component_count} componente(s) da proposta de intervenção, considerando agente, ação, meio, finalidade e detalhamento.",
            "improvement": "Feche a redação com agente, ação, meio, finalidade e detalhamento mais explícitos para a proposta de intervenção ficar completa." if intervention_component_count < 4 else "Sua proposta já aparece, mas ainda pode ganhar mais detalhamento operacional para subir a nota.",
        },
    ]

    sorted_competencies = sorted(competencies, key=lambda item: item["score"])
    weakest = sorted_competencies[0]
    strongest = sorted_competencies[-1]
    total_score = sum(item["score"] for item in competencies)

    highlighted_excerpts: list[str] = []
    excerpt_candidates = [
        sentences[0] if sentences else "",
        next((paragraph for paragraph in body_paragraphs if count_words(paragraph) >= 45), ""),
        next((sentence for sentence in sentences if any(contains_term(sentence, term) for term in INTERVENTION_ACTIONS)), ""),
        sentences[-1] if sentences else "",
    ]
    for item in excerpt_candidates:
        cleaned = feedback_text(item, 220)
        if cleaned and cleaned not in highlighted_excerpts and len(highlighted_excerpts) < 4:
            highlighted_excerpts.append(cleaned)

    analysis_indicators = feedback_list([
        f"Estrutura: {word_count} palavras em {len(paragraphs)} parágrafo(s).",
        f"Tema: {theme_coverage['total_hits']} referência(s) diretas ao recorte, com cobertura aproximada de {round(theme_coverage['coverage'] * 100)}%.",
        f"Coesão: {connective_metrics['total']} conectivo(s) relevantes, com diversidade de {connective_metrics['unique']}.",
        f"Argumentação: {body_substance} desenvolvimento(s) com bom corpo textual e {example_metrics['total'] + numeric_evidence_count} marca(s) de exemplo ou dado.",
        f"Repertório: {repertory_metrics['total']} referência(s) externas percebidas.",
        f"Intervenção: {intervention_component_count} elemento(s) da proposta de intervenção identificados na conclusão.",
    ], max_items=6, max_length=180)

    return {
        "competencies": competencies,
        "totalScore": total_score,
        "summaryFeedback": feedback_text(
            f"{prefix} Sua nota estimada ficou em {total_score} pontos. Neste texto, {strongest['name']} apareceu como ponto mais forte, enquanto {weakest['name']} segue como prioridade principal de melhora.",
            640,
        ),
        "strengths": feedback_list([
            f"{strongest['name']} foi a competência mais consistente nesta leitura automatizada.",
            "A estrutura em parágrafos já ajuda a organizar a leitura." if len(paragraphs) >= 4 else "Há uma base inicial de organização que pode ser aprofundada.",
            "O texto traz sinais de repertório, o que ajuda a enriquecer a argumentação." if repertory_metrics["total"] > 0 else "O texto já tem base para crescer com repertório mais explícito.",
        ]),
        "mainProblems": feedback_list([
            f"{weakest['name']} ficou com a menor nota nesta estimativa.",
            "A coesão ainda depende de poucos conectivos e transições." if connective_metrics["unique"] < 3 else "A transição entre os argumentos ainda pode ficar mais refinada.",
            "A proposta de intervenção ainda está incompleta ou pouco detalhada." if intervention_component_count < 4 else "A proposta final existe, mas ainda pode ganhar mais precisão prática.",
        ]),
        "nextSteps": feedback_list([
            weakest["improvement"],
            "Revise a introdução para deixar a tese e o recorte do tema mais explícitos.",
            "Na próxima versão, mantenha quatro parágrafos bem definidos: introdução, dois desenvolvimentos e conclusão.",
        ]),
        "interventionFeedback": feedback_text(
            "A proposta de intervenção já aparece de forma perceptível, mas ainda pode ganhar mais detalhamento para subir a nota."
            if intervention_component_count >= 4
            else "A proposta de intervenção precisa ficar mais completa, com agente, ação, meio, finalidade e detalhamento mais claros.",
            460,
        ),
        "highlightedExcerpts": feedback_list(highlighted_excerpts, max_items=4, max_length=220),
        "analysisIndicators": analysis_indicators,
    }
