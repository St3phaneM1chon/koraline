/**
 * CRM Skills-Based Routing - C12/A8
 *
 * Routes calls and leads to the best-matched agent based on skill profiles.
 * Skills include language proficiency, product expertise, customer tier,
 * and channel capability. Each skill has a proficiency level (1-5).
 *
 * Agent skills are stored in an in-memory map backed by a JSON config file.
 * In production, this should be backed by Redis or a dedicated DB table.
 *
 * Functions:
 * - findBestAgent: Find the best available agent for given skill requirements
 * - calculateSkillMatch: Score how well an agent matches required skills
 * - getAgentSkills: Retrieve an agent's skill profile
 * - updateAgentSkills: Update an agent's skill profile
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Skill {
  name: string;        // e.g., "french", "peptide-bpc157", "vip-tier"
  category: string;    // "language" | "product" | "tier" | "channel"
  level: number;       // 1-5 proficiency
}

interface SkillRequirement {
  name: string;
  category: string;
  minLevel: number;    // Minimum acceptable proficiency
}

interface AgentMatch {
  agentId: string;
  agentName: string;
  matchScore: number;  // 0.0 to 1.0
  matchedSkills: string[];
  missingSkills: string[];
}

type RoutingChannel = 'call' | 'chat' | 'email' | 'sms';

interface SkillsConfig {
  agents: Record<string, Skill[]>; // agentId -> skills
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum match score to consider an agent eligible */
const MIN_MATCH_SCORE = 0.5;

/** Bonus score for agents who are currently ONLINE (not BUSY) */
const AVAILABILITY_BONUS = 0.1;

// ---------------------------------------------------------------------------
// Config file path (use /tmp for Azure compatibility)
// ---------------------------------------------------------------------------

const CONFIG_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp'
  : path.resolve(process.cwd(), 'data');

const CONFIG_PATH = path.join(CONFIG_DIR, 'agent-skills.json');

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

function ensureConfigDir(): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  } catch {
    // Directory may already exist
  }
}

function readSkillsConfig(): SkillsConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(raw) as SkillsConfig;
    }
  } catch (err) {
    logger.warn('Skills routing: failed to read config', {
      event: 'skills_config_read_error',
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return { agents: {} };
}

function writeSkillsConfig(config: SkillsConfig): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// getAgentSkills
// ---------------------------------------------------------------------------

/**
 * Retrieve an agent's skill profile.
 *
 * @param agentId - The user ID of the agent
 * @returns Array of skills with name, category, and level
 */
export async function getAgentSkills(agentId: string): Promise<Skill[]> {
  const config = readSkillsConfig();
  return config.agents[agentId] ?? [];
}

// ---------------------------------------------------------------------------
// updateAgentSkills
// ---------------------------------------------------------------------------

/**
 * Update an agent's skill profile.
 *
 * Each skill is identified by name+category; existing skills are updated,
 * new skills are added.
 *
 * @param agentId - The user ID of the agent
 * @param skills - The skills to set or update
 */
export async function updateAgentSkills(
  agentId: string,
  skills: Skill[]
): Promise<void> {
  const config = readSkillsConfig();
  const existingSkills = config.agents[agentId] ?? [];

  // Merge: update existing skills, add new ones
  const skillMap = new Map<string, Skill>();
  for (const skill of existingSkills) {
    skillMap.set(`${skill.category}:${skill.name}`, skill);
  }
  for (const skill of skills) {
    skillMap.set(`${skill.category}:${skill.name}`, skill);
  }

  config.agents[agentId] = Array.from(skillMap.values());
  writeSkillsConfig(config);

  logger.info('Skills routing: agent skills updated', {
    event: 'agent_skills_updated',
    agentId,
    skillCount: config.agents[agentId].length,
    updatedSkills: skills.map((s) => `${s.category}:${s.name}(${s.level})`),
  });
}

// ---------------------------------------------------------------------------
// calculateSkillMatch
// ---------------------------------------------------------------------------

/**
 * Calculate how well an agent's skills match the required skills.
 *
 * Scoring:
 * - Each required skill that the agent has at or above minLevel adds to the score
 * - Skills below minLevel but present add a partial score
 * - Missing skills contribute 0
 * - Final score is normalized to 0.0-1.0
 *
 * @param agentSkills - The agent's skills
 * @param requirements - The required skills with minimum levels
 * @returns Match score between 0.0 and 1.0
 */
export function calculateSkillMatch(
  agentSkills: Skill[],
  requirements: SkillRequirement[]
): { score: number; matched: string[]; missing: string[] } {
  if (requirements.length === 0) {
    return { score: 1.0, matched: [], missing: [] };
  }

  const skillMap = new Map<string, number>();
  for (const skill of agentSkills) {
    skillMap.set(`${skill.category}:${skill.name}`, skill.level);
  }

  let totalScore = 0;
  const matched: string[] = [];
  const missing: string[] = [];

  for (const req of requirements) {
    const key = `${req.category}:${req.name}`;
    const agentLevel = skillMap.get(key);

    if (agentLevel === undefined) {
      // Skill completely missing
      missing.push(req.name);
      continue;
    }

    if (agentLevel >= req.minLevel) {
      // Full match
      totalScore += 1.0;
      matched.push(req.name);
    } else {
      // Partial match (agent has skill but below required level)
      totalScore += agentLevel / req.minLevel * 0.5;
      matched.push(req.name);
    }
  }

  const score = Math.round((totalScore / requirements.length) * 100) / 100;

  return { score, matched, missing };
}

// ---------------------------------------------------------------------------
// findBestAgent
// ---------------------------------------------------------------------------

/**
 * Find the best available agent matching the required skills.
 *
 * Searches all agents with ONLINE or BUSY SIP extensions, scores them
 * against the required skills, and returns the best match that exceeds
 * the minimum threshold.
 *
 * ONLINE agents get a small bonus over BUSY agents.
 *
 * @param requirements - Skills required for this interaction
 * @param channel - The communication channel (call, chat, email, sms)
 * @returns The best matching agent, or null if no suitable agent found
 */
export async function findBestAgent(
  requirements: SkillRequirement[],
  channel: RoutingChannel = 'call'
): Promise<AgentMatch | null> {
  // Get all agents with active SIP extensions
  const extensions = await prisma.sipExtension.findMany({
    where: {
      status: { in: ['ONLINE', 'BUSY'] },
    },
    select: {
      userId: true,
      status: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (extensions.length === 0) {
    logger.warn('Skills routing: no agents available', {
      event: 'skills_no_agents',
      channel,
      requiredSkills: requirements.map((r) => r.name),
    });
    return null;
  }

  // Load skills config once for all agents
  const config = readSkillsConfig();

  // Add channel requirement if not already specified
  const allRequirements = [...requirements];
  const hasChannelReq = requirements.some((r) => r.category === 'channel');
  if (!hasChannelReq) {
    allRequirements.push({ name: channel, category: 'channel', minLevel: 1 });
  }

  // Score each agent
  const candidates: AgentMatch[] = [];

  for (const ext of extensions) {
    const agentSkills = config.agents[ext.user.id] ?? [];
    const { score, matched, missing } = calculateSkillMatch(agentSkills, allRequirements);

    // Apply availability bonus
    const adjustedScore = ext.status === 'ONLINE'
      ? Math.min(1.0, score + AVAILABILITY_BONUS)
      : score;

    if (adjustedScore >= MIN_MATCH_SCORE) {
      candidates.push({
        agentId: ext.user.id,
        agentName: ext.user.name ?? 'Unknown',
        matchScore: adjustedScore,
        matchedSkills: matched,
        missingSkills: missing,
      });
    }
  }

  if (candidates.length === 0) {
    logger.info('Skills routing: no agents meet minimum score', {
      event: 'skills_no_match',
      channel,
      requiredSkills: requirements.map((r) => r.name),
      totalAgents: extensions.length,
      minScore: MIN_MATCH_SCORE,
    });
    return null;
  }

  // Sort by score descending
  candidates.sort((a, b) => b.matchScore - a.matchScore);

  const best = candidates[0];

  logger.info('Skills routing: best agent found', {
    event: 'skills_agent_matched',
    channel,
    agentId: best.agentId,
    agentName: best.agentName,
    matchScore: best.matchScore,
    matchedSkills: best.matchedSkills,
    missingSkills: best.missingSkills,
    candidatesCount: candidates.length,
  });

  return best;
}
