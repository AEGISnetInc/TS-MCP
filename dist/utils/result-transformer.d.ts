import type { ExecutionDetailResponse, ScriptExecDetailResponse, SummarizedTestResults } from '../touchstone/types.js';
/**
 * Transform execution detail and optional script details into summarized results.
 *
 * @param execDetail - The execution detail response from /api/testExecDetail/<id>
 * @param scriptDetails - Map of script path to script detail response (for failed scripts)
 */
export declare function transformResults(execDetail: ExecutionDetailResponse, scriptDetails?: Map<string, ScriptExecDetailResponse>): SummarizedTestResults;
//# sourceMappingURL=result-transformer.d.ts.map