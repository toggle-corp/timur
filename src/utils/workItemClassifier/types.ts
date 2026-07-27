import type { TimeEntryTypeEnum } from '#generated/types/graphql';

interface WorkItemClassifierModelMeta {
    trainedAt: string;
    trainSize: number;
    evalSize: number;
    evalMacroF1: number | null;
    evalCoverage: number | null;
    note?: string;
}

export interface WorkItemClassifierModel {
    classes: TimeEntryTypeEnum[];
    vocabulary: string[];
    idf: number[];
    intercepts: number[];
    weights: [number, number][][];
    /**
     * Per-class confidence thresholds (aligned with `classes`). The model
     * returns a class only when its top-class probability meets that class's
     * threshold. Each is tuned independently to maximize that class's F1.
     */
    thresholds: number[];
    meta: WorkItemClassifierModelMeta;
}
