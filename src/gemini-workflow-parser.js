const { GoogleGenerativeAI } = require("@google/generative-ai");
const chalk = require("chalk");

class GeminiWorkflowParser {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Define model fallback chain - ordered by preference
    this.modelChain = [
      { name: 'gemini-2.5-flash', description: 'Primary (fastest)' },
      { name: 'gemini-1.5-flash', description: 'Fallback 1 (reliable)' },
      { name: 'gemini-1.5-pro', description: 'Fallback 2 (comprehensive)' },
      { name: 'gemini-1.0-pro', description: 'Fallback 3 (stable)' }
    ];
    
    this.workflowCache = new Map();
    this.modelFailures = new Map(); // Track model failures
  }

  /**
   * Parse natural language instruction with multi-model fallback
   */
  async parseInstruction(instruction) {
    console.log(chalk.blue("🧠 Analyzing instruction with Gemini..."));

    // Check cache first
    const cachedResult = this.getCachedParsing(instruction);
    if (cachedResult) {
      console.log(chalk.gray("💾 Using cached parsing result"));
      return cachedResult;
    }

    // Try each model in the fallback chain
    for (let i = 0; i < this.modelChain.length; i++) {
      const modelInfo = this.modelChain[i];
      
      // Skip models that have failed recently (rate limiting)
      if (this.isModelTemporarilyBlocked(modelInfo.name)) {
        console.log(chalk.yellow(`⏭️ Skipping ${modelInfo.name} (temporarily blocked)`));
        continue;
      }

      try {
        console.log(chalk.blue(`🤖 Trying ${modelInfo.name} (${modelInfo.description})...`));
        
        const result = await this.tryModelParsing(modelInfo.name, instruction);
        
        if (result) {
          console.log(chalk.green(`✅ Successfully parsed with ${modelInfo.name}`));
          
          // Cache successful result
          this.cacheResult(instruction, result);
          
          // Clear any failure records for this model
          this.clearModelFailure(modelInfo.name);
          
          return result;
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️ ${modelInfo.name} failed: ${error.message}`));
        
        // Record model failure
        this.recordModelFailure(modelInfo.name, error);
        
        // Continue to next model
        continue;
      }
    }

    // All models failed, use regex fallback
    console.log(chalk.red("❌ All Gemini models failed, using regex fallback..."));
    return this.createFallbackWorkflow(instruction);
  }

  /**
   * Try parsing with a specific model
   */
  async tryModelParsing(modelName, instruction) {
    const model = this.genAI.getGenerativeModel({ model: modelName });
    const prompt = this.buildParsingPrompt(instruction);
    
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Validate JSON response
      const parsedWorkflow = this.parseAndValidateJSON(responseText);
      
      if (parsedWorkflow) {
        return this.validateAndEnhance(parsedWorkflow, instruction, modelName);
      }
      
      return null;
    } catch (error) {
      // Handle specific API errors
      if (error.message.includes('quota')) {
        throw new Error(`Quota exceeded for ${modelName}`);
      } else if (error.message.includes('rate limit')) {
        throw new Error(`Rate limited for ${modelName}`);
      } else if (error.message.includes('not found')) {
        throw new Error(`Model ${modelName} not available`);
      } else {
        throw new Error(`API error: ${error.message}`);
      }
    }
  }

  /**
   * Parse and validate JSON response with error recovery
   */
  parseAndValidateJSON(responseText) {
    try {
      // First try direct JSON parsing
      return JSON.parse(responseText);
    } catch (error) {
      // Try to extract JSON from text that might have extra content
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.log(chalk.yellow("⚠️ Failed to parse extracted JSON"));
        }
      }
      
      // Try to fix common JSON issues
      const cleanedText = this.cleanJSONResponse(responseText);
      try {
        return JSON.parse(cleanedText);
      } catch (finalError) {
        console.log(chalk.yellow("⚠️ JSON parsing completely failed"));
        return null;
      }
    }
  }

  /**
   * Clean common JSON response issues
   */
  cleanJSONResponse(text) {
    return text
      .replace(/```/, '')

      .replace(/```\s*/g, '')
      .replace(/^\s*```/g, '')
      .replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1') // Extract JSON object
      .trim();
  }

  /**
   * Enhanced build parsing prompt with model-specific optimizations
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

IMPORTANT: You MUST return ONLY a valid JSON object. No explanations, no markdown, no code blocks.

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
    "hasCriticalLimit": true/false
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
  "seoConstraints": {
    "primaryKeywords": ["main", "keywords"],
    "keywordDensity": "natural|light|moderate|heavy",
    "searchIntent": "informational|commercial|navigational|transactional"
  },
  "conflictResolution": {
    "hasConflicts": true/false,
    "conflictTypes": ["length vs depth", "time vs quality"],
    "recommendedPriority": "constraint priority order"
  }
}

CRITICAL REQUIREMENTS:
1. Extract EXACT word counts when mentioned
2. Set hasCriticalLimit to true if word count is explicitly specified
3. Identify constraint conflicts
4. Return ONLY valid JSON - no additional text, explanations, or formatting`;
  }

  /**
   * Enhanced validation with model tracking
   */
  validateAndEnhance(parsedWorkflow, originalInstruction, modelUsed = 'unknown') {
    // Add metadata
    parsedWorkflow.originalInstruction = originalInstruction;
    parsedWorkflow.parsedAt = new Date().toISOString();
    parsedWorkflow.modelUsed = modelUsed;
    parsedWorkflow.fallbackUsed = false;

    // Enhanced length constraint parsing if Gemini missed it
    if (!parsedWorkflow.lengthConstraints || !parsedWorkflow.lengthConstraints.wordLimit) {
      const extractedConstraints = this.extractLengthConstraints(originalInstruction);
      if (extractedConstraints.wordLimit) {
        parsedWorkflow.lengthConstraints = extractedConstraints;
        console.log(chalk.blue(`🔍 Enhanced with regex-detected word limit: ${extractedConstraints.wordLimit}`));
      }
    }

    // Ensure required fields exist with defaults
    if (!parsedWorkflow.contentType) {
      parsedWorkflow.contentType = "blog-post";
    }

    if (!parsedWorkflow.topic) {
      parsedWorkflow.topic = this.extractSimpleTopic(originalInstruction);
    }

    if (!parsedWorkflow.audience) {
      parsedWorkflow.audience = {
        level: "general",
        industry: "general", 
        expertise: "basic"
      };
    }

    if (!parsedWorkflow.styleConstraints) {
      parsedWorkflow.styleConstraints = {
        tone: "professional",
        complexity: "moderate",
        format: "standard",
        voice: "active",
        perspective: "third-person"
      };
    }

    if (!parsedWorkflow.contentConstraints) {
      parsedWorkflow.contentConstraints = {
        mustInclude: [],
        shouldInclude: ["examples", "current trends"],
        mustExclude: [],
        dataRequirements: "examples",
        depthLevel: "moderate"
      };
    }

    if (!parsedWorkflow.seoConstraints) {
      parsedWorkflow.seoConstraints = {
        primaryKeywords: this.extractKeywords(originalInstruction),
        keywordDensity: "natural",
        searchIntent: "informational"
      };
    }

    // Legacy compatibility for existing code
    parsedWorkflow.style = parsedWorkflow.styleConstraints || {
      tone: "professional",
      depth: "intermediate",
      format: "standard"
    };

    parsedWorkflow.seoKeywords = parsedWorkflow.seoConstraints?.primaryKeywords || 
      this.extractKeywords(originalInstruction);

    parsedWorkflow.requirements = {
      includeExamples: parsedWorkflow.contentConstraints?.dataRequirements === 'examples',
      includeData: parsedWorkflow.contentConstraints?.dataRequirements === 'statistics',
      includeTrends: true,
      includeSteps: parsedWorkflow.styleConstraints?.format === 'step-by-step',
      includeComparison: parsedWorkflow.contentType === 'comparison'
    };

    parsedWorkflow.estimatedLength = this.getEstimatedLength(parsedWorkflow.lengthConstraints);
    parsedWorkflow.isComplex = this.isComplexWorkflow(parsedWorkflow);

    return parsedWorkflow;
  }

  /**
   * Enhanced fallback workflow with better regex detection
   */
  createFallbackWorkflow(instruction) {
    const lengthConstraints = this.extractLengthConstraints(instruction);
    
    return {
      contentType: "blog-post",
      topic: this.extractSimpleTopic(instruction),
      audience: {
        level: "general",
        industry: "general",
        expertise: "basic"
      },
      lengthConstraints,
      styleConstraints: {
        tone: "professional",
        complexity: "moderate",
        format: "standard",
        voice: "active",
        perspective: "third-person"
      },
      contentConstraints: {
        mustInclude: [],
        shouldInclude: ["examples", "current trends"],
        mustExclude: [],
        dataRequirements: "examples",
        depthLevel: "moderate"
      },
      seoConstraints: {
        primaryKeywords: this.extractKeywords(instruction),
        keywordDensity: "natural",
        searchIntent: "informational"
      },
      conflictResolution: {
        hasConflicts: false,
        conflictTypes: [],
        recommendedPriority: "word count > audience > style"
      },
      originalInstruction: instruction,
      parsedAt: new Date().toISOString(),
      modelUsed: 'regex-fallback',
      fallbackUsed: true,
      
      // Legacy compatibility
      style: {
        tone: "professional",
        depth: "intermediate", 
        format: "standard"
      },
      requirements: {
        includeExamples: true,
        includeData: false,
        includeTrends: true,
        includeSteps: false,
        includeComparison: false
      },
      seoKeywords: this.extractKeywords(instruction),
      estimatedLength: this.getEstimatedLength(lengthConstraints),
      isComplex: false
    };
  }

  /**
   * Advanced length constraint extraction with multiple patterns
   */
  extractLengthConstraints(instruction) {
    const instructionLower = instruction.toLowerCase();

    // Advanced word count patterns
    const exactPatterns = [
      /(?:exactly|precisely|must be)\s*(\d+)\s*words?/,
      /\bin\s*(\d+)\s*words?\b/,
      /(?:write|create|generate).*?(\d+)\s*words?/,
    ];

    const maxPatterns = [
      /(?:under|below|less than|max|maximum|no more than)\s*(\d+)\s*words?/,
      /keep\s*it\s*(?:under|to|below)\s*(\d+)\s*words?/,
      /(?:limit|cap)\s*(?:to|at)\s*(\d+)\s*words?/,
    ];

    const minPatterns = [
      /(?:at least|minimum|min|no less than)\s*(\d+)\s*words?/,
      /(?:over|above|more than)\s*(\d+)\s*words?/,
    ];

    const flexiblePatterns = [
      /(?:around|about|approximately|roughly)\s*(\d+)\s*words?/,
      /(?:~|±)\s*(\d+)\s*words?/,
    ];

    // Check exact patterns first (highest priority)
    for (const pattern of exactPatterns) {
      const match = instructionLower.match(pattern);
      if (match) {
        return {
          wordLimit: parseInt(match),
          constraintType: "exact",
          priority: "critical",
          reasoning: "Exact word count specified in instruction",
          hasCriticalLimit: true
        };
      }
    }

    // Check maximum patterns
    for (const pattern of maxPatterns) {
      const match = instructionLower.match(pattern);
      if (match) {
        return {
          wordLimit: parseInt(match),
          constraintType: "maximum",
          priority: "critical", 
          reasoning: "Maximum word limit specified",
          hasCriticalLimit: true
        };
      }
    }

    // Check minimum patterns
    for (const pattern of minPatterns) {
      const match = instructionLower.match(pattern);
      if (match) {
        return {
          wordLimit: parseInt(match),
          constraintType: "minimum",
          priority: "important",
          reasoning: "Minimum word count specified",
          hasCriticalLimit: true
        };
      }
    }

    // Check flexible patterns
    for (const pattern of flexiblePatterns) {
      const match = instructionLower.match(pattern);
      if (match) {
        return {
          wordLimit: parseInt(match),
          constraintType: "flexible",
          priority: "important",
          reasoning: "Approximate word count specified",
          hasCriticalLimit: true
        };
      }
    }

    // Descriptive length terms
    const lengthDescriptors = {
      'brief': { wordLimit: 300, constraintType: "maximum", priority: "important" },
      'short': { wordLimit: 500, constraintType: "maximum", priority: "important" },
      'quick': { wordLimit: 400, constraintType: "maximum", priority: "important" },
      'summary': { wordLimit: 350, constraintType: "maximum", priority: "important" },
      'overview': { wordLimit: 600, constraintType: "flexible", priority: "suggestion" },
      'comprehensive': { wordLimit: 1500, constraintType: "minimum", priority: "suggestion" },
      'detailed': { wordLimit: 1200, constraintType: "minimum", priority: "suggestion" },
      'in-depth': { wordLimit: 2000, constraintType: "minimum", priority: "suggestion" }
    };

    for (const [descriptor, constraints] of Object.entries(lengthDescriptors)) {
      if (instructionLower.includes(descriptor)) {
        return {
          ...constraints,
          reasoning: `Descriptive length term "${descriptor}" detected`,
          hasCriticalLimit: false
        };
      }
    }

    // Default - no specific constraints
    return {
      wordLimit: null,
      constraintType: "flexible",
      priority: "suggestion",
      reasoning: "No specific length constraints detected",
      hasCriticalLimit: false
    };
  }

  /**
   * Model failure tracking
   */
  recordModelFailure(modelName, error) {
    const now = Date.now();
    const failures = this.modelFailures.get(modelName) || [];
    
    failures.push({
      timestamp: now,
      error: error.message,
      type: this.getErrorType(error.message)
    });
    
    // Keep only recent failures (last hour)
    const recentFailures = failures.filter(f => now - f.timestamp < 3600000);
    this.modelFailures.set(modelName, recentFailures);
  }

  clearModelFailure(modelName) {
    this.modelFailures.delete(modelName);
  }

  isModelTemporarilyBlocked(modelName) {
    const failures = this.modelFailures.get(modelName) || [];
    const now = Date.now();
    
    // Block model if more than 3 failures in last 15 minutes
    const recentFailures = failures.filter(f => now - f.timestamp < 900000);
    return recentFailures.length >= 3;
  }

  getErrorType(errorMessage) {
    if (errorMessage.includes('quota')) return 'quota';
    if (errorMessage.includes('rate limit')) return 'rate_limit';
    if (errorMessage.includes('not found')) return 'not_available';
    return 'api_error';
  }

  /**
   * Get estimated length from constraints
   */
  getEstimatedLength(lengthConstraints) {
    if (!lengthConstraints || !lengthConstraints.wordLimit) {
      return 'medium';
    }
    
    const limit = lengthConstraints.wordLimit;
    if (limit <= 300) return 'short';
    if (limit <= 800) return 'medium';
    if (limit <= 1500) return 'long';
    return 'comprehensive';
  }

  /**
   * Determine if workflow is complex
   */
  isComplexWorkflow(workflow) {
    const hasWordConstraints = workflow.lengthConstraints?.hasCriticalLimit;
    const hasMultipleRequirements = workflow.contentConstraints?.mustInclude?.length > 2;
    const isAdvancedContent = ['guide', 'tutorial', 'analysis', 'comparison'].includes(workflow.contentType);
    
    return hasWordConstraints || hasMultipleRequirements || isAdvancedContent;
  }

  /**
   * Get model status for debugging
   */
  getModelStatus() {
    const status = {};
    
    this.modelChain.forEach(model => {
      const failures = this.modelFailures.get(model.name) || [];
      const isBlocked = this.isModelTemporarilyBlocked(model.name);
      
      status[model.name] = {
        description: model.description,
        recentFailures: failures.length,
        temporarilyBlocked: isBlocked,
        lastFailure: failures.length > 0 ? new Date(failures[failures.length - 1].timestamp) : null
      };
    });
    
    return status;
  }

  /**
   * Extract simple topic from instruction
   */
  extractSimpleTopic(instruction) {
    const cleanInstruction = instruction
      .replace(/create|write|generate|make|build/gi, "")
      .replace(/blog post|article|guide|tutorial|analysis/gi, "")
      .replace(/about|on|regarding|concerning/gi, "")
      .replace(/under \d+ words?/gi, "")
      .replace(/in \d+ words?/gi, "")
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
          "under",
          "words",
          "make",
          "build"
        ].includes(word) &&
        !/^\d+$/.test(word) // exclude numbers
    );

    return keywords.slice(0, 5);
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
      seoConstraints,
    } = workflow;

    let prompt = `Create ${this.getContentTypeDescription(contentType)} about "${topic}".`;

    // CRITICAL CONSTRAINTS SECTION
    prompt += "\n\n🚨 CRITICAL CONSTRAINTS - MUST BE FOLLOWED:";

    // Word count constraints (highest priority)
    if (lengthConstraints && lengthConstraints.wordLimit && lengthConstraints.hasCriticalLimit) {
      prompt += `\n━━━ WORD COUNT CONSTRAINT ━━━`;
      prompt += `\nTarget: ${lengthConstraints.constraintType.toUpperCase()} ${lengthConstraints.wordLimit} words`;
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
      prompt += `\nTarget Audience: ${audience.level} in ${audience.industry || "general"} field`;
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
      prompt += `\nPerspective: ${styleConstraints.perspective || "third-person"}`;
    }

    // SEO constraints
    if (seoConstraints && seoConstraints.primaryKeywords.length > 0) {
      prompt += `\n\n━━━ SEO REQUIREMENTS ━━━`;
      prompt += `\nPrimary Keywords: ${seoConstraints.primaryKeywords.join(", ")}`;
      prompt += `\nKeyword Integration: ${seoConstraints.keywordDensity || "natural"} density`;
      prompt += `\nSearch Intent: ${seoConstraints.searchIntent || "informational"}`;
    }

    // Final instructions
    prompt += `\n\n━━━ EXECUTION INSTRUCTIONS ━━━`;
    prompt += `\n1. Follow word count constraint EXACTLY - count words before finalizing`;
    prompt += `\n2. Prioritize critical constraints over nice-to-have features`;
    prompt += `\n3. Maintain quality while respecting all constraints`;
    prompt += `\n4. Use proper heading structure (H1, H2, H3)`;
    prompt += `\n5. Include internal linking opportunities`;

    // Word count reminder
    if (lengthConstraints && lengthConstraints.wordLimit && lengthConstraints.hasCriticalLimit) {
      prompt += `\n\n🎯 FINAL WORD COUNT REMINDER: This content MUST be ${lengthConstraints.constraintType} ${lengthConstraints.wordLimit} words. Count carefully!`;
    }

    return prompt;
  }

  /**
   * Advanced constraint validation and conflict detection
   */
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
      const mustIncludeCount = workflow.contentConstraints.mustInclude ? workflow.contentConstraints.mustInclude.length : 0;

      // Conflict: Too many requirements for word limit
      if (wordLimit && wordLimit < 500 && mustIncludeCount > 3) {
        validation.conflicts.push({
          type: "length_vs_requirements",
          message: `Word limit of ${wordLimit} is too restrictive for ${mustIncludeCount} required elements`,
          suggestion: "Consider increasing word limit or reducing requirements",
        });
      }

      // Conflict: Brief content with comprehensive requirements
      if (wordLimit && wordLimit < 400 && workflow.contentConstraints.depthLevel === "deep") {
        validation.conflicts.push({
          type: "length_vs_depth",
          message: "Brief word limit conflicts with deep analysis requirement",
          suggestion: "Choose either brief summary OR deep analysis",
        });
      }
    }

    // Style constraint conflicts
    if (workflow.styleConstraints && workflow.audience) {
      if (workflow.styleConstraints.tone === "casual" && workflow.audience.level === "experts") {
        validation.warnings.push({
          type: "style_vs_audience",
          message: "Casual tone may not be appropriate for expert audience",
          suggestion: "Consider professional or technical tone",
        });
      }
    }

    // Critical word count validation
    if (workflow.lengthConstraints && workflow.lengthConstraints.wordLimit) {
      const limit = workflow.lengthConstraints.wordLimit;
      if (limit < 50) {
        validation.criticalIssues.push("Word limit too low for meaningful content");
      }
      if (limit > 5000) {
        validation.warnings.push("Very long content may reduce reader engagement");
      }
    }

    return validation;
  }

  /**
   * Get content type description for prompts
   */
  getContentTypeDescription(contentType) {
    const descriptions = {
      "blog-post": "a comprehensive blog post",
      "guide": "a detailed step-by-step guide",
      "tutorial": "an educational tutorial",
      "analysis": "an in-depth analysis",
      "comparison": "a detailed comparison",
      "listicle": "an engaging listicle",
      "news-article": "a news-style article",
      "summary": "a concise summary",
      "overview": "a comprehensive overview"
    };

    return descriptions[contentType] || "a comprehensive blog post";
  }
}

module.exports = GeminiWorkflowParser;
