/**
 * AUDIT FORGE v5.0 — Module Index
 * Import all audit components from a single entry point.
 */

// Core configuration
export * from './audit-config';

// Prompt engineering
export { buildFunctionContext, buildEnhancedPrompt, buildCriticPrompt, DIMENSION_PROMPTS } from './audit-prompts';
export { generateThreatPreamble, THREAT_MODELS } from './threat-models';

// Function extraction
export { extractAllFunctions } from './function-extractor';

// Pipeline components
export { applyConsensus, generateConsensusReport } from './consensus';
export { applyFrameworkCritic, analyzeFrameworkContext, generateCriticReport } from './framework-critic';
export { analyzeCrossModule, loadAllDomainFindings, generateCrossModuleReport } from './cross-module-check';

// Scoring and tracking
export { calculateDomainScore, calculateGlobalScore } from './audit-config';
export { scoreFunctionFindings, compareDomainAudits, generateScoreDashboard, generateLifecycleSummary } from './scoring';
export { saveWeeklyResult, saveMonthlyReport, saveBaseline, getLatestWeeklyResult, getLatestBaseline, getTrends, detectRegressions, ensureDirectories } from './historical-tracker';

// Scheduling
export { calculatePriorities, getNextDomain, printDashboard } from './audit-scheduler';

// Testing
export { generateMutations, runMutationTest, generateMutationReport } from './mutation-tester';
