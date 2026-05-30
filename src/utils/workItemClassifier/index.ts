import { useMemo } from 'react';
import {
    isDefined,
    listToGroupList,
    listToMap,
    mapToList,
    mapToMap,
    sum,
    unique,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import {
    TimeEntryTypeEnum,
    WorkItemClassifierEntitiesQuery,
    WorkItemClassifierEntitiesQueryVariables,
} from '#generated/types/graphql';

import type { WorkItemClassifierModel } from './types';

import modelData from './model.json';

const model = modelData as unknown as WorkItemClassifierModel;

const vocabIndex: Record<string, number> = listToMap(
    model.vocabulary,
    (token) => token,
    (_token, _key, idx) => idx,
);

// We want to replace specific names to either of these
type Sentinel = 'project' | 'client' | 'colleague';

// Clean up multi-word phrases
function normalizePhrase(phrase: string): string {
    return phrase.toLowerCase().split(/\s+/).filter((p) => p.length > 0).join(' ');
}

function expandName(name: string, sentinel: Sentinel): [string, Sentinel][] {
    const parts = name.split(' ');
    const entries: [string, Sentinel][] = [[name, sentinel]];
    if (parts.length >= 2) {
        const first = parts[0];
        const last = parts[parts.length - 1];
        if (first !== undefined) {
            entries.push([first, sentinel]);
        }
        if (last !== undefined) {
            entries.push([last, sentinel]);
        }
    }
    return entries;
}

function buildSubstituteMap(
    data: WorkItemClassifierEntitiesQuery | undefined,
): Record<string, Sentinel> {
    if (!data) {
        return {};
    }
    const projectNames = unique(
        data.private.allProjects.flatMap((p) => [p.name, p.shortName]),
    );
    const clientOrgNames = unique([
        ...data.private.clients.items.map((c) => c.name),
        ...data.private.contractors.items.map((c) => c.name),
    ]);
    const userNames = unique(
        data.private.users.items.map((u) => u.displayName).filter(isDefined),
    );

    // Priority: project, client, then colleague.
    // There are cases where project and client names are the same
    const candidates: [string, Sentinel][] = [
        ...projectNames.map<[string, Sentinel]>((p) => [normalizePhrase(p), 'project']),
        ...clientOrgNames.map<[string, Sentinel]>((c) => [normalizePhrase(c), 'client']),
        ...userNames.flatMap((name) => expandName(normalizePhrase(name), 'colleague')),
    ];

    return candidates.reduce<Record<string, Sentinel>>((acc, [key, sentinel]) => {
        if (key.length > 0 && !(key in acc)) {
            acc[key] = sentinel;
        }
        return acc;
    }, {});
}

function l2Norm(values: number[]): number {
    return Math.sqrt(sum(values.map((v) => v * v)));
}

function softmax(scores: number[]): number[] {
    // Subtract the max before exponentiating for numerical stability.
    const maxScore = Math.max(...scores);
    const exps = scores.map((s) => Math.exp(s - maxScore));
    const denom = sum(exps);
    return exps.map((e) => e / denom);
}

function argmax(values: number[]): number {
    return values.indexOf(Math.max(...values));
}

function dotProduct(
    classWeights: [number, number][],
    features: Record<number, number>,
): number {
    return sum(classWeights.map(([tokenIdx, weight]) => {
        const cnt = features[tokenIdx];
        return cnt === undefined ? 0 : weight * cnt;
    }));
}

// ─── Tokenization + entity substitution ───────────────────────────────────

function tokenize(text: string): string[] {
    return text.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 0);
}

// NOTE: Needs space-padded input
function cleanupClientProjectPairs(s: string): string {
    // We are recursing until we get no substitution.
    // Space-padding both sides to simplify boundary detection without regex
    const next = s
        .replaceAll(' client project ', ' project ')
        .replaceAll(' project client ', ' project ')
        .replaceAll(' project project ', ' project ');
    return next === s ? s : cleanupClientProjectPairs(next);
}

function substituteEntities(
    tokens: string[],
    substituteMap: Record<string, Sentinel>,
    sortedPhrases: string[],
): string[] {
    // Space-padding both sides to simplify boundary detection without regex
    const padded = ` ${tokens.join(' ')} `;
    const substituted = sortedPhrases.reduce(
        (acc, phrase) => acc.replaceAll(` ${phrase} `, ` ${substituteMap[phrase]} `),
        padded,
    );
    return cleanupClientProjectPairs(substituted).split(' ').filter((t) => t.length > 0);
}

function bigrams(tokens: string[]): string[] {
    return tokens.slice(0, -1).flatMap((a, i) => {
        const b = tokens[i + 1];
        return b === undefined ? [] : [`${a}_${b}`];
    });
}

function countNgrams(ngrams: string[]): Record<number, number> {
    const vocabHits = ngrams
        .map((ngram) => vocabIndex[ngram])
        .filter((idx): idx is number => idx !== undefined);
    const grouped = listToGroupList(vocabHits, (idx) => idx);
    return mapToMap(grouped, undefined, (group) => group.length);
}

function buildFeatures(
    text: string,
    substituteMap: Record<string, Sentinel>,
    sortedPhrases: string[],
): Record<number, number> {
    // TfidfTransformer(norm='l2', use_idf=True, smooth_idf=True, sublinear_tf=False)
    const tokens = substituteEntities(tokenize(text), substituteMap, sortedPhrases);
    const rawCounts = countNgrams([...tokens, ...bigrams(tokens)]);

    const tfidf = mapToMap(rawCounts, undefined, (count, key) => {
        const idx = Number(key);
        const idf = model.idf[idx] ?? 0;
        return count * idf;
    });

    const norm = l2Norm(mapToList(tfidf));
    return norm > 0
        ? mapToMap(tfidf, undefined, (v) => v / norm)
        : tfidf;
}

function classScore(
    intercept: number,
    classWeights: [number, number][] | undefined,
    features: Record<number, number>,
): number {
    if (!classWeights) {
        return intercept;
    }
    return intercept + dotProduct(classWeights, features);
}

function inferType(
    description: string,
    substituteMap: Record<string, Sentinel>,
    sortedPhrases: string[],
): TimeEntryTypeEnum | undefined {
    if (description.trim().length === 0) {
        return undefined;
    }

    const features = buildFeatures(description, substituteMap, sortedPhrases);
    if (Object.keys(features).length === 0) {
        return undefined;
    }

    const scores = model.intercepts.map(
        (intercept, classIdx) => classScore(intercept, model.weights[classIdx], features),
    );
    const probabilities = softmax(scores);
    const bestIdx = argmax(probabilities);

    const bestProb = probabilities[bestIdx] ?? 0;
    const classThreshold = model.thresholds[bestIdx] ?? 1.0;
    if (bestProb < classThreshold) {
        return undefined;
    }

    return model.classes[bestIdx];
}

const WORK_ITEM_CLASSIFIER_ENTITIES_QUERY = gql`
    query WorkItemClassifierEntities {
        private {
            id
            allProjects {
                id
                name
                shortName
            }
            clients(pagination: { limit: 9999 }) {
                items {
                    id
                    name
                }
            }
            contractors(pagination: { limit: 9999 }) {
                items {
                    id
                    name
                }
            }
            users(pagination: { limit: 9999 }) {
                items {
                    id
                    displayName
                }
            }
        }
    }
`;

function useWorkItemClassifier(): (description: string) => TimeEntryTypeEnum | undefined {
    const [result] = useQuery<
        WorkItemClassifierEntitiesQuery,
        WorkItemClassifierEntitiesQueryVariables
    >({
        query: WORK_ITEM_CLASSIFIER_ENTITIES_QUERY,
        requestPolicy: 'cache-and-network',
    });
    const { data } = result;

    return useMemo(() => {
        const substituteMap = buildSubstituteMap(data);
        // Sort phrases longest-first so multi-word names win over their parts
        const sortedPhrases = Object.keys(substituteMap).sort((a, b) => b.length - a.length);
        return (description: string) => inferType(description, substituteMap, sortedPhrases);
    }, [data]);
}

export default useWorkItemClassifier;
