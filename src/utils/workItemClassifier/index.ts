// Work-item type classifier — inference side.
//
// Reads a logistic-regression model trained externally (see scripts/README.md
// for the training pipeline and design decisions) and suggests a
// TimeEntryTypeEnum value for a given description. Returns `undefined` when
// the top-class probability is below that class's threshold.
//
// Train/serve contract — this code MUST stay in sync with the analyzer in
// scripts/train_work_item_classifier.py. Specifically:
//   - lowercase
//   - tokenize on /[^a-z0-9]+/
//   - emit unigrams + adjacent bigrams (bigrams joined with '_')
//   - apply IDF + L2 normalize (TF-IDF features)
// The training side additionally substitutes entity names (people, projects,
// clients) with sentinel tokens; this frontend does NOT — entity tokens in
// real descriptions just miss the vocab and are silently ignored, which is
// the desired privacy-preserving behavior.
import type { TimeEntryTypeEnum } from '#generated/types/graphql';

import type { WorkItemClassifierModel } from './types';

import modelData from './model.json';

const model = modelData as unknown as WorkItemClassifierModel;

const vocabIndex = new Map<string, number>(
    model.vocabulary.map((token, idx) => [token, idx]),
);

function tokenize(text: string): string[] {
    return text.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 0);
}

function buildFeatures(text: string): Map<number, number> {
    // Mirrors sklearn TfidfTransformer(norm='l2', use_idf=True, smooth_idf=True,
    // sublinear_tf=False) applied to count features. Steps:
    //   1. Tokenize (unigrams + adjacent bigrams)
    //   2. Multiply each count by the token's IDF (from model.idf)
    //   3. L2-normalize the row vector
    const tokens = tokenize(text);
    const rawCounts = new Map<number, number>();

    const bump = (token: string) => {
        const idx = vocabIndex.get(token);
        if (idx !== undefined) {
            rawCounts.set(idx, (rawCounts.get(idx) ?? 0) + 1);
        }
    };

    tokens.forEach((tok) => bump(tok));
    for (let i = 0; i + 1 < tokens.length; i += 1) {
        const a = tokens[i];
        const b = tokens[i + 1];
        if (a !== undefined && b !== undefined) {
            bump(`${a}_${b}`);
        }
    }

    // tf × idf
    const tfidf = new Map<number, number>();
    rawCounts.forEach((count, idx) => {
        const idf = model.idf[idx] ?? 0;
        tfidf.set(idx, count * idf);
    });

    // L2 normalize
    let normSquared = 0;
    tfidf.forEach((v) => { normSquared += v * v; });
    const norm = Math.sqrt(normSquared);
    if (norm > 0) {
        tfidf.forEach((v, idx) => { tfidf.set(idx, v / norm); });
    }

    return tfidf;
}

function inferTypeFromDescription(
    description: string,
): TimeEntryTypeEnum | undefined {
    if (description.trim().length === 0) {
        return undefined;
    }

    const counts = buildFeatures(description);
    if (counts.size === 0) {
        return undefined;
    }

    const scores = model.intercepts.map((intercept, classIdx) => {
        let s = intercept;
        const classWeights = model.weights[classIdx];
        if (classWeights) {
            classWeights.forEach(([tokenIdx, weight]) => {
                const cnt = counts.get(tokenIdx);
                if (cnt !== undefined) {
                    s += weight * cnt;
                }
            });
        }
        return s;
    });

    const maxScore = Math.max(...scores);
    const exps = scores.map((s) => Math.exp(s - maxScore));
    const sum = exps.reduce((a, b) => a + b, 0);

    let bestIdx = 0;
    let bestExp = exps[0] ?? 0;
    for (let c = 1; c < exps.length; c += 1) {
        const e = exps[c];
        if (e !== undefined && e > bestExp) {
            bestExp = e;
            bestIdx = c;
        }
    }

    const bestProb = bestExp / sum;
    const classThreshold = model.thresholds[bestIdx] ?? 1.0;
    if (bestProb < classThreshold) {
        return undefined;
    }

    return model.classes[bestIdx];
}

export default inferTypeFromDescription;
