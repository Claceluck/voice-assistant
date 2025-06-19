import json
import sys
import re
from textstat import textstat
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

# Весовые коэффициенты (можно настроить)
ALPHA = 0.3  # Grammar
BETA  = 0.2  # Readability
GAMMA = 0.3  # StyleConsistency
DELTA = 0.2  # Originality

# Инициализация модели для эмбеддингов (разовый download ~50 МБ)
model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

def grammar_score(text: str) -> float:
    """
    GrammarScore = доля предложений, которые начинаются с заглавной буквы.
    """
    sentences = re.split(r'[\.\!\?]', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences:
        return 1.0
    good = sum(1 for s in sentences if s[0].isupper())
    return good / len(sentences)

def readability_score(text: str) -> float:
    """
    ReadabilityScore = нормализованный индекс Flesch Reading Ease ∈ [0,1]
    """
    try:
        fre = textstat.flesch_reading_ease(text)
    except:
        return 0.5
    return min(max(fre, 0.0), 100.0) / 100.0

def style_consistency(processed: str, reference: str) -> float:
    """
    StyleConsistency = cosine(sim(emb_processed, emb_reference)) ∈ [0,1]
    """
    emb1 = model.encode([processed])
    emb2 = model.encode([reference])
    return float(cosine_similarity(emb1, emb2)[0][0])

def originality_score(original: str, processed: str) -> float:
    """
    OriginalityScore = доля новых 3-грамм ∈ [0,1]
    """
    def ngrams(txt, n=3):
        w = txt.split()
        return set(zip(*[w[i:] for i in range(n)]))
    orig_3 = ngrams(original)
    proc_3 = ngrams(processed)
    if not proc_3:
        return 1.0
    unique = proc_3 - orig_3
    return len(unique) / len(proc_3)

if __name__ == '__main__':
    # Ожидаем JSON со stdin: {"original_text":..., "processed_text":..., "reference_style":...}
    raw = sys.stdin.read()
    data = json.loads(raw or '{}')
    orig = data.get('original_text', '')
    proc = data.get('processed_text', '')
    ref  = data.get('reference_style', orig)

    G = grammar_score(proc)
    R = readability_score(proc)
    S = style_consistency(proc, ref)
    O = originality_score(orig, proc)

    lq = ALPHA*G + BETA*R + GAMMA*S + DELTA*O

    result = {
        'GrammarScore': round(G, 3),
        'ReadabilityScore': round(R, 3),
        'StyleConsistency': round(S, 3),
        'OriginalityScore': round(O, 3),
        'LQ_Score': round(lq, 3)
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
