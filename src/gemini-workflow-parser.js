const { GoogleGenerativeAI } = require("@google/generative-ai");
const chalk = require("chalk");

class GeminiWorkflowParser {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    this.workflowCache = new Map();
  }

  /**
   * Parse natural language instruction into structured workflow
   */
  async parseInstruction(instruction) {
    try {
      console.log(chalk.blue("🧠 Analyzing instruction with Gemini..."));

      // Check cache first
      const cachedResult = this.getCachedParsing(instruction);
      if (cachedResult) {
        console.log(chalk.gray("💾 Using cached parsing result"));
        return cachedResult;
      }

      const prompt = this.buildParsingPrompt(instruction);
      const result = await this.model.generateContent(prompt);
      const parsedWorkflow = JSON.parse(result.response.text());

      // Cache the result
      this.cacheResult(instruction, parsedWorkflow);

      return this.validateAndEnhance(parsedWorkflow, instruction);
    } catch (error) {
      console.log(chalk.yellow("⚠️ Gemini parsing failed, using fallback..."));
      return this.createFallbackWorkflow(instruction);
    }
  }

  /**
   * Build the parsing prompt for Gemini
   */
  buildParsingPrompt(instruction) {
    return `You are an expert content planning assistant. Analyze this user instruction and extract ALL constraints and requirements into structured JSON.

User Instruction: "${instruction}"

CONSTRAINT DETECTION PRIORITIES:
1. WORD COUNT/LENGTH constraints (highest priority)
2. TIME constraints (deadlines, publication timing)
3. FORMAT constraints (structure, style requirements)
4. CONTENT constraints (what to include/exclude)
5. AUDIENCE constraints (who this is for)
6. STYLE constraints (tone, complexity level)

WORD COUNT PARSING RULES:
- "in X words" = exact target
- "under/below X words" = maximum limit  
- "at least X words" = minimum requirement
- "around/approximately X words" = flexible target (±10%)
- "brief/short" = 200-400 words
- "comprehensive/detailed" = 1200+ words
- "quick/summary" = 100-300 words

Extract into this EXACT JSON structure:

{
  "contentType": "blog-post|guide|tutorial|analysis|comparison|listicle|news-article|summary|overview",
  "topic": "main subject matter",
  "audience": {
    "level": "beginners|professionals|general|experts|mixed",
    "industry": "tech|business|general|specific-domain",
    "expertise": "none|basic|intermediate|advanced"
  },
  "lengthConstraints": {
    "wordLimit": null or number,
    "constraintType": "exact|maximum|minimum|flexible",
    "priority": "critical|important|suggestion",
    "reasoning": "why this length was chosen",
    "fallbackLength": "if primary constraint fails"
  },
  "styleConstraints": {
    "tone": "professional|casual|technical|friendly|formal|conversational",
    "complexity": "simple|moderate|advanced|expert-level",
    "format": "standard|structured|listicle|step-by-step|comparison",
    "voice": "active|passive|mixed",
    "perspective": "first-person|third-person|instructional"
  },
  "contentConstraints": {
    "mustInclude": ["required", "elements"],
    "shouldInclude": ["preferred", "elements"],
    "mustExclude": ["forbidden", "content"],
    "dataRequirements": "statistics|examples|case-studies|research|none",
    "depthLevel": "surface|moderate|deep|exhaustive"
  },
  "structureRequirements": {
    "headingStructure": "simple|complex|specific-format",
    "sectionsRequired": ["intro", "main", "conclusion"],
    "listFormat": "bullets|numbers|mixed|none",
    "examplesPlacement": "integrated|separate|callouts"
  },
  "timeConstraints": {
    "urgency": "immediate|soon|flexible",
    "publicationTime": "specific-date|asap|scheduled",
    "contentLifespan": "evergreen|trending|time-sensitive"
  },
  "seoConstraints": {
    "primaryKeywords": ["main", "keywords"],
    "keywordDensity": "natural|light|moderate|heavy",
    "searchIntent": "informational|commercial|navigational|transactional"
  },
  "qualityConstraints": {
    "factAccuracy": "critical|important|moderate",
    "originalityLevel": "unique|adapted|referenced",
    "evidenceRequired": "citations|examples|data|none"
  },
  "outputConstraints": {
    "format": "json|markdown|html|plain-text",
    "metadata": "full|minimal|none",
    "additionalFiles": "none|images|documents"
  },
  "conflictResolution": {
    "hasConflicts": true/false,
    "conflictTypes": ["length vs depth", "time vs quality"],
    "recommendedPriority": "constraint priority order"
  }
}

CRITICAL ANALYSIS REQUIREMENTS:
1. Extract EXACT word counts when mentioned
2. Identify constraint conflicts (e.g., "brief but comprehensive")
3. Determine constraint priority (critical vs nice-to-have)
4. Flag impossible combinations
5. Suggest alternatives for conflicting requirements

Return ONLY valid JSON. If uncertain about constraints, mark as "flexible" rather than guessing.`;
  }

  /**
   * Validate and enhance parsed workflow
   */
  validateAndEnhance(parsedWorkflow, originalInstruction) {
    // Add original instruction for reference
    parsedWorkflow.originalInstruction = originalInstruction;
    parsedWorkflow.parsedAt = new Date().toISOString();

    // Ensure required fields exist with defaults
    if (!parsedWorkflow.contentType) {
      parsedWorkflow.contentType = "blog-post";
    }

    if (!parsedWorkflow.topic) {
      parsedWorkflow.topic = this.extractSimpleTopic(originalInstruction);
    }

    if (!parsedWorkflow.audience) {
      parsedWorkflow.audience = "general";
    }

    if (!parsedWorkflow.style) {
      parsedWorkflow.style = {
        tone: "professional",
        depth: "intermediate",
        format: "standard",
      };
    }

    if (
      !parsedWorkflow.seoKeywords ||
      parsedWorkflow.seoKeywords.length === 0
    ) {
      parsedWorkflow.seoKeywords = this.extractKeywords(originalInstruction);
    }

    return parsedWorkflow;
  }

  /**
   * Create fallback workflow for failed parsing
   */
  createFallbackWorkflow(instruction) {
    return {
      contentType: "blog-post",
      topic: this.extractSimpleTopic(instruction),
      audience: "general",
      style: {
        tone: "professional",
        depth: "intermediate",
        format: "standard",
      },
      requirements: {
        includeExamples: true,
        includeData: false,
        includeTrends: true,
        includeSteps: false,
        includeComparison: false,
      },
      specialInstructions: [instruction],
      estimatedLength: "medium",
      seoKeywords: this.extractKeywords(instruction),
      isComplex: false,
      originalInstruction: instruction,
      parsedAt: new Date().toISOString(),
      fallbackUsed: true,
    };
  }

  /**
   * Extract simple topic from instruction
   */
  extractSimpleTopic(instruction) {
    // Remove common command words and extract main topic
    const cleanInstruction = instruction
      .replace(/create|write|generate|make|build/gi, "")
      .replace(/blog post|article|guide|tutorial|analysis/gi, "")
      .replace(/about|on|regarding|concerning/gi, "")
      .trim();

    return cleanInstruction || "General topic";
  }

  /**
   * Extract keywords from instruction
   */
  extractKeywords(instruction) {
    const words = instruction.toLowerCase().split(/\s+/);
    const keywords = words.filter(
      (word) =>
        word.length > 3 &&
        ![
          "create",
          "write",
          "generate",
          "blog",
          "post",
          "article",
          "about",
          "with",
          "including",
        ].includes(word)
    );

    return keywords.slice(0, 5); // Return top 5 keywords
  }

  /**
   * Simple caching mechanism
   */
  getCachedParsing(instruction) {
    const instructionKey = instruction.toLowerCase().trim();
    return this.workflowCache.get(instructionKey);
  }

  cacheResult(instruction, result) {
    const instructionKey = instruction.toLowerCase().trim();
    this.workflowCache.set(instructionKey, result);

    // Limit cache size to prevent memory issues
    if (this.workflowCache.size > 50) {
      const firstKey = this.workflowCache.keys().next().value;
      this.workflowCache.delete(firstKey);
    }
  }

  /**
   * Generate enhanced content prompt based on parsed workflow
   */
  generateContentPrompt(workflow) {
    const {
      contentType,
      topic,
      audience,
      lengthConstraints,
      styleConstraints,
      contentConstraints,
      structureRequirements,
      timeConstraints,
      seoConstraints,
      qualityConstraints,
    } = workflow;

    let prompt = `Create ${this.getContentTypeDescription(
      contentType
    )} about "${topic}".`;

    // CRITICAL CONSTRAINTS SECTION
    prompt += "\n\n🚨 CRITICAL CONSTRAINTS - MUST BE FOLLOWED:";

    // Word count constraints (highest priority)
    if (
      lengthConstraints &&
      lengthConstraints.wordLimit &&
      lengthConstraints.priority === "critical"
    ) {
      prompt += `\n━━━ WORD COUNT CONSTRAINT ━━━`;
      prompt += `\nTarget: ${lengthConstraints.constraintType.toUpperCase()} ${
        lengthConstraints.wordLimit
      } words`;
      prompt += `\nPriority: MANDATORY - This constraint cannot be violated`;

      if (lengthConstraints.constraintType === "exact") {
        prompt += `\nRequirement: Content must be precisely ${lengthConstraints.wordLimit} words (±5 words acceptable)`;
      } else if (lengthConstraints.constraintType === "maximum") {
        prompt += `\nRequirement: Content must NOT exceed ${lengthConstraints.wordLimit} words`;
      } else if (lengthConstraints.constraintType === "minimum") {
        prompt += `\nRequirement: Content must be at least ${lengthConstraints.wordLimit} words`;
      }

      // Adjust content strategy based on word limit
      if (lengthConstraints.wordLimit <= 300) {
        prompt += `\nStrategy for ${lengthConstraints.wordLimit} words: Use bullet points, focus on key facts only, eliminate fluff`;
      } else if (lengthConstraints.wordLimit <= 500) {
        prompt += `\nStrategy for ${lengthConstraints.wordLimit} words: 3-4 main points, brief examples, concise explanations`;
      } else if (lengthConstraints.wordLimit <= 800) {
        prompt += `\nStrategy for ${lengthConstraints.wordLimit} words: 5-6 main points, 1-2 examples per point, moderate detail`;
      } else {
        prompt += `\nStrategy for ${lengthConstraints.wordLimit} words: Comprehensive coverage with detailed examples and explanations`;
      }
    }

    // Audience constraints
    if (audience && audience.level) {
      prompt += `\n\n━━━ AUDIENCE CONSTRAINTS ━━━`;
      prompt += `\nTarget Audience: ${audience.level} in ${
        audience.industry || "general"
      } field`;
      prompt += `\nExpertise Level: ${audience.expertise || "mixed"}`;

      switch (audience.level) {
        case "beginners":
          prompt += `\nApproach: Define technical terms, use simple analogies, provide step-by-step explanations`;
          break;
        case "professionals":
          prompt += `\nApproach: Industry terminology is acceptable, focus on practical applications and ROI`;
          break;
        case "experts":
          prompt += `\nApproach: Technical depth expected, discuss advanced concepts, assume prior knowledge`;
          break;
      }
    }

    // Style constraints
    if (styleConstraints) {
      prompt += `\n\n━━━ STYLE CONSTRAINTS ━━━`;
      prompt += `\nTone: ${styleConstraints.tone || "professional"}`;
      prompt += `\nComplexity: ${styleConstraints.complexity || "moderate"}`;
      prompt += `\nFormat: ${styleConstraints.format || "standard"}`;
      prompt += `\nPerspective: ${
        styleConstraints.perspective || "third-person"
      }`;
    }

    // Content requirements
    if (contentConstraints) {
      prompt += `\n\n━━━ CONTENT REQUIREMENTS ━━━`;

      if (
        contentConstraints.mustInclude &&
        contentConstraints.mustInclude.length > 0
      ) {
        prompt += `\nMUST INCLUDE (Mandatory):`;
        contentConstraints.mustInclude.forEach((item) => {
          prompt += `\n  ✓ ${item}`;
        });
      }

      if (
        contentConstraints.shouldInclude &&
        contentConstraints.shouldInclude.length > 0
      ) {
        prompt += `\nSHOULD INCLUDE (If space allows):`;
        contentConstraints.shouldInclude.forEach((item) => {
          prompt += `\n  • ${item}`;
        });
      }

      if (
        contentConstraints.mustExclude &&
        contentConstraints.mustExclude.length > 0
      ) {
        prompt += `\nMUST EXCLUDE (Forbidden):`;
        contentConstraints.mustExclude.forEach((item) => {
          prompt += `\n  ✗ ${item}`;
        });
      }
    }

    // Structure requirements
    if (structureRequirements && structureRequirements.sectionsRequired) {
      prompt += `\n\n━━━ STRUCTURE REQUIREMENTS ━━━`;
      prompt += `\nRequired Sections: ${structureRequirements.sectionsRequired.join(
        " → "
      )}`;

      if (structureRequirements.headingStructure === "specific-format") {
        prompt += `\nHeading Format: Use clear H1 for title, H2 for main sections, H3 for subsections`;
      }

      if (structureRequirements.listFormat !== "none") {
        prompt += `\nList Format: Use ${structureRequirements.listFormat} for key points`;
      }
    }

    // SEO constraints
    if (seoConstraints && seoConstraints.primaryKeywords.length > 0) {
      prompt += `\n\n━━━ SEO REQUIREMENTS ━━━`;
      prompt += `\nPrimary Keywords: ${seoConstraints.primaryKeywords.join(
        ", "
      )}`;
      prompt += `\nKeyword Integration: ${
        seoConstraints.keywordDensity || "natural"
      } density`;
      prompt += `\nSearch Intent: ${
        seoConstraints.searchIntent || "informational"
      }`;
    }

    // Conflict resolution
    if (
      workflow.conflictResolution &&
      workflow.conflictResolution.hasConflicts
    ) {
      prompt += `\n\n⚠️ CONSTRAINT CONFLICTS DETECTED`;
      prompt += `\nConflicts: ${workflow.conflictResolution.conflictTypes.join(
        ", "
      )}`;
      prompt += `\nResolution Priority: ${workflow.conflictResolution.recommendedPriority}`;
    }

    // Final instructions
    prompt += `\n\n━━━ EXECUTION INSTRUCTIONS ━━━`;
    prompt += `\n1. Follow word count constraint EXACTLY - count words before finalizing`;
    prompt += `\n2. Prioritize critical constraints over nice-to-have features`;
    prompt += `\n3. If conflicts arise, follow the constraint priority order`;
    prompt += `\n4. Maintain quality while respecting all constraints`;
    prompt += `\n5. Double-check that all MUST INCLUDE items are present`;

    // Word count reminder
    if (
      lengthConstraints &&
      lengthConstraints.wordLimit &&
      lengthConstraints.priority === "critical"
    ) {
      prompt += `\n\n🎯 FINAL WORD COUNT REMINDER: This content MUST be ${lengthConstraints.constraintType} ${lengthConstraints.wordLimit} words. Count carefully!`;
    }

    return prompt;
  }

  validateConstraints(workflow) {
    const validation = {
      isValid: true,
      conflicts: [],
      warnings: [],
      suggestions: [],
      criticalIssues: [],
    };

    // Check for constraint conflicts
    if (workflow.lengthConstraints && workflow.contentConstraints) {
      const wordLimit = workflow.lengthConstraints.wordLimit;
      const mustIncludeCount = workflow.contentConstraints.mustInclude
        ? workflow.contentConstraints.mustInclude.length
        : 0;

      // Conflict: Too many requirements for word limit
      if (wordLimit && wordLimit < 500 && mustIncludeCount > 3) {
        validation.conflicts.push({
          type: "length_vs_requirements",
          message: `Word limit of ${wordLimit} is too restrictive for ${mustIncludeCount} required elements`,
          suggestion: "Consider increasing word limit or reducing requirements",
        });
      }

      // Conflict: Brief content with comprehensive requirements
      if (
        wordLimit &&
        wordLimit < 400 &&
        workflow.contentConstraints.depthLevel === "deep"
      ) {
        validation.conflicts.push({
          type: "length_vs_depth",
          message: "Brief word limit conflicts with deep analysis requirement",
          suggestion: "Choose either brief summary OR deep analysis",
        });
      }
    }

    // Style constraint conflicts
    if (workflow.styleConstraints) {
      if (
        workflow.styleConstraints.tone === "casual" &&
        workflow.audience &&
        workflow.audience.level === "experts"
      ) {
        validation.warnings.push({
          type: "style_vs_audience",
          message: "Casual tone may not be appropriate for expert audience",
          suggestion: "Consider professional or technical tone",
        });
      }
    }

    // Time constraint validation
    if (
      workflow.timeConstraints &&
      workflow.timeConstraints.urgency === "immediate" &&
      workflow.lengthConstraints &&
      workflow.lengthConstraints.wordLimit > 1500
    ) {
      validation.warnings.push({
        type: "time_vs_length",
        message:
          "Immediate deadline may conflict with comprehensive content requirement",
        suggestion: "Consider shorter content for faster delivery",
      });
    }

    // Critical word count validation
    if (workflow.lengthConstraints && workflow.lengthConstraints.wordLimit) {
      const limit = workflow.lengthConstraints.wordLimit;
      if (limit < 50) {
        validation.criticalIssues.push(
          "Word limit too low for meaningful content"
        );
      }
      if (limit > 5000) {
        validation.warnings.push(
          "Very long content may reduce reader engagement"
        );
      }
    }

    return validation;
  }

  resolveConstraintConflicts(workflow) {
    const conflicts = this.validateConstraints(workflow).conflicts;

    if (conflicts.length === 0) {
      return workflow; // No conflicts
    }

    const resolved = { ...workflow };

    conflicts.forEach((conflict) => {
      switch (conflict.type) {
        case "length_vs_requirements":
          // Prioritize word count, reduce requirements
          if (resolved.contentConstraints.mustInclude.length > 3) {
            resolved.contentConstraints.shouldInclude = [
              ...resolved.contentConstraints.shouldInclude,
              ...resolved.contentConstraints.mustInclude.slice(3),
            ];
            resolved.contentConstraints.mustInclude =
              resolved.contentConstraints.mustInclude.slice(0, 3);
          }
          break;

        case "length_vs_depth":
          // Adjust depth based on word limit
          if (resolved.lengthConstraints.wordLimit < 500) {
            resolved.contentConstraints.depthLevel = "surface";
            resolved.styleConstraints.complexity = "simple";
          }
          break;

        case "style_vs_audience":
          // Adjust style to match audience
          if (resolved.audience.level === "experts") {
            resolved.styleConstraints.tone = "professional";
          }
          break;
      }
    });

    // Mark as resolved
    resolved.conflictResolution = {
      hasConflicts: false,
      resolvedConflicts: conflicts.map((c) => c.type),
      resolutionApplied: true,
    };

    return resolved;
  }

  /**
   * Get content type description for prompts
   */
  getContentTypeDescription(contentType) {
    const descriptions = {
      "blog-post": "a comprehensive blog post",
      guide: "a detailed step-by-step guide",
      tutorial: "an educational tutorial",
      analysis: "an in-depth analysis",
      comparison: "a detailed comparison",
      listicle: "an engaging listicle",
      "news-article": "a news-style article",
    };

    return descriptions[contentType] || "a comprehensive blog post";
  }
}

module.exports = GeminiWorkflowParser;
