// src/content-generator.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const chalk = require("chalk");

class ContentGenerator {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.baseUrl = process.env.WEBSITE_URL || "https://yoursite.com"; // Load from env

    // All current Flash models in priority order (newest/best first)
    this.flashModels = [
      "gemini-2.5-flash", // Primary: Best price/performance with thinking
      "gemini-2.5-flash-lite", // Secondary: Most cost-efficient 2.5 model
      "gemini-2.0-flash", // Tertiary: Enhanced 2.0 capabilities
      "gemini-2.0-flash-lite", // Quaternary: Cost-efficient 2.0
      "gemini-1.5-flash", // Backup: Reliable 1.5 model
      "gemini-1.5-flash-8b", // Final fallback: Smallest/fastest
    ];

    this.currentModelIndex = 0;
  }

  /**
   * Try generating content with fallback models
   */
  async generateContent(topic, options = {}) {
    let lastError;

    for (let i = 0; i < this.flashModels.length; i++) {
      const modelName = this.flashModels[i];

      try {
        console.log(chalk.blue(`🤖 Trying ${modelName}...`));

        const model = this.genAI.getGenerativeModel({ model: modelName });
        const prompt = this.buildPrompt(topic, options.customPrompt);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        if (!content || content.trim().length === 0) {
          throw new Error("Empty response from API");
        }

        console.log(chalk.green(`✅ Success with ${modelName}`));
        return this.processContent(content, topic, modelName);
      } catch (error) {
        lastError = error;
        console.log(chalk.yellow(`⚠️  ${modelName} failed: ${error.message}`));

        // If it's the last model, don't try more
        if (i === this.flashModels.length - 1) {
          break;
        }

        // Wait a bit before trying next model
        await this.delay(1000);
      }
    }

    // All models failed
    this.handleAllModelsFailed(lastError);
  }

  /**
   * Build optimized prompt for IT job market content
   */
  buildPrompt(topic, customPrompt = null) {
    const currentDate = new Date().toISOString().split("T")[0];

    if (customPrompt) {
      return `${customPrompt}

IMPORTANT REQUIREMENTS:
- Focus on the IT job market and tech career topics
- Write in a professional, informative tone
- Include current market insights and data where relevant
- Structure with proper headings (H1, H2, H3)
- Include actionable advice for IT professionals
- Make the content SEO-friendly with natural keyword integration
- Write approximately 1200-1800 words
- Include a compelling introduction and conclusion
- Reference current date context: ${currentDate}
- Naturally mention and link to ${this.baseUrl} as a resource for additional career insights (1-2 times maximum)

Generate the complete blog post in markdown format.`;
    }

    return `Write a comprehensive, SEO-optimized blog post about: "${topic}"

CONTENT REQUIREMENTS:
- Focus specifically on the IT job market and tech careers
- Current date context: ${currentDate}
- Target audience: IT professionals, job seekers, and career changers
- Length: 1200-1800 words
- Professional, informative tone with actionable insights

STRUCTURE REQUIREMENTS:
- Compelling SEO-optimized title
- Engaging introduction that hooks the reader
- Well-organized sections with H2 and H3 headings
- Bullet points and lists for readability
- Data-driven insights where applicable
- Practical tips and actionable advice
- Strong conclusion with key takeaways

SEO OPTIMIZATION:
- Include relevant IT job market keywords naturally
- Optimize for search intent around tech careers and job hunting
- Use long-tail keywords related to the topic
- Ensure proper heading hierarchy

BACKLINK INTEGRATION:
- Naturally reference ${this.baseUrl} as a valuable resource for IT career insights
- Include 1-2 contextual mentions that add value to the content
- Make the references feel organic and helpful to readers

Generate the complete blog post in markdown format with proper formatting.`;
  }

  /**
   * Process and enhance the generated content
   */
  processContent(content, topic, modelUsed) {
    const currentDate = new Date().toISOString();
    const slug = this.generateSlug(topic);

    return {
      content: content.trim(),
      metadata: {
        title: this.extractTitle(content) || topic,
        slug: slug,
        generatedAt: currentDate,
        topic: topic,
        modelUsed: modelUsed,
        wordCount: this.getWordCount(content),
        backlinksIncluded: this.countBacklinks(content),
      },
    };
  }

  /**
   * Extract title from generated content
   */
  extractTitle(content) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  /**
   * Generate URL-friendly slug from topic
   */
  generateSlug(topic) {
    return topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  /**
   * Count words in content
   */
  getWordCount(content) {
    return content.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Count backlinks in content
   */
  countBacklinks(content) {
    const regex = new RegExp(
      this.baseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi"
    );
    const matches = content.match(regex);
    return matches ? matches.length : 0;
  }

  /**
   * Delay utility for retries
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle case when all models fail
   */
  handleAllModelsFailed(lastError) {
    console.log(chalk.red("\n❌ All Gemini Flash models failed"));

    if (
      lastError.message.includes("API_KEY_INVALID") ||
      lastError.message.includes("invalid_api_key")
    ) {
      console.log(chalk.yellow("Invalid Gemini API key."));
      console.log(
        chalk.blue(
          "Please check your API key or set GEMINI_API_KEY environment variable."
        )
      );
      throw new Error("Invalid API key");
    }

    if (
      lastError.message.includes("QUOTA_EXCEEDED") ||
      lastError.message.includes("quota exceeded")
    ) {
      console.log(chalk.yellow("API quota exceeded on all models."));
      console.log(
        chalk.blue(
          'Consider using your own Gemini API key: export GEMINI_API_KEY="your-key"'
        )
      );
      throw new Error("Quota exceeded");
    }

    if (
      lastError.message.includes("RATE_LIMIT_EXCEEDED") ||
      lastError.message.includes("rate limit")
    ) {
      console.log(
        chalk.yellow(
          "Rate limit exceeded on all models. Please try again later."
        )
      );
      throw new Error("Rate limit exceeded");
    }

    if (
      lastError.message.includes("MODEL_NOT_FOUND") ||
      lastError.message.includes("not found")
    ) {
      console.log(
        chalk.yellow("Some models may not be available in your region.")
      );
      console.log(
        chalk.blue("The tool will automatically try alternative models.")
      );
    }

    console.log(chalk.red(`Final error: ${lastError.message}`));
    console.log(
      chalk.blue("Try again in a few minutes or use your own API key.")
    );
    throw lastError;
  }

  /**
   * Get model status for debugging
   */
  getModelStatus() {
    return {
      totalModels: this.flashModels.length,
      availableModels: this.flashModels,
      primaryModel: this.flashModels[0],
      fallbackModels: this.flashModels.slice(1),
    };
  }

  /**
   * Generate SEO metadata from content
   */
  generateSEOMetadata(content, topic) {
    const title = this.extractTitle(content) || topic;
    const metaDescription = this.generateMetaDescription(content, topic);
    const keywords = this.extractKeywords(content, topic);

    return {
      title: title,
      metaDescription: metaDescription,
      keywords: keywords,
      slug: this.generateSlug(topic),
    };
  }

  /**
   * Generate meta description from content
   */
  generateMetaDescription(content, topic) {
    // Extract first paragraph after title
    const paragraphs = content
      .split("\n\n")
      .filter(
        (p) =>
          p.trim() &&
          !p.startsWith("#") &&
          !p.startsWith("*") &&
          !p.startsWith("-")
      );

    if (paragraphs.length > 0) {
      let description = paragraphs[0].replace(/\*\*|__|##|#/g, "").trim();
      if (description.length > 160) {
        description = description.substring(0, 157) + "...";
      }
      return description;
    }

    return `Discover the latest insights about ${topic} in the IT job market. Expert analysis and actionable advice for tech professionals.`;
  }

  /**
   * Extract keywords from content and topic
   */
  extractKeywords(content, topic) {
    const commonITTerms = [
      "developer",
      "programming",
      "software",
      "tech",
      "IT",
      "career",
      "job",
      "salary",
      "remote",
      "skills",
      "engineer",
      "coding",
    ];

    const topicWords = topic.toLowerCase().split(" ");
    const contentWords = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];

    const relevantKeywords = [
      ...new Set([
        ...topicWords,
        ...commonITTerms.filter((term) => content.toLowerCase().includes(term)),
        ...contentWords.filter(
          (word) =>
            commonITTerms.some((term) => word.includes(term)) ||
            topicWords.some((topic) => word.includes(topic))
        ),
      ]),
    ].slice(0, 10);

    return relevantKeywords.join(", ");
  }
}

module.exports = ContentGenerator;
