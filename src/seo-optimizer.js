// src/seo-optimizer.js
const chalk = require("chalk");

class SEOOptimizer {
  constructor(websiteUrl) {
    this.websiteUrl = websiteUrl || "https://yoursite.com";
    this.targetKeywordDensity = { min: 1, max: 3 }; // 1-3% keyword density
    this.optimalWordCount = { min: 1200, max: 1800 };
    this.optimalTitleLength = { min: 50, max: 60 };
    this.optimalMetaLength = { min: 140, max: 160 };
  }

  /**
   * Main SEO optimization function
   */
  optimizeContent(content, primaryKeyword, metadata = {}) {
    const analysis = this.analyzeContent(content, primaryKeyword);
    const optimizedMeta = this.generateOptimizedMeta(
      content,
      primaryKeyword,
      metadata
    );
    const suggestions = this.generateOptimizationSuggestions(analysis);
    const seoScore = this.calculateSEOScore(analysis);

    return {
      analysis,
      optimizedMeta,
      suggestions,
      seoScore,
      schema: this.generateJobSchema(content, metadata),
      socialMeta: this.generateSocialMetaTags(content, metadata),
    };
  }

  /**
   * Analyze content for SEO factors
   */
  analyzeContent(content, primaryKeyword) {
    const wordCount = this.getWordCount(content);
    const keywordAnalysis = this.analyzeKeywords(content, primaryKeyword);
    const headingStructure = this.analyzeHeadingStructure(content);
    const readability = this.analyzeReadability(content);
    const internalLinks = this.analyzeInternalLinks(content);

    return {
      wordCount,
      keywordAnalysis,
      headingStructure,
      readability,
      internalLinks,
      contentStructure: this.analyzeContentStructure(content),
    };
  }

  /**
   * Analyze keyword usage and density
   */
  analyzeKeywords(content, primaryKeyword) {
    const contentLower = content.toLowerCase();
    const words = contentLower.split(/\s+/).filter((word) => word.length > 0);
    const totalWords = words.length;

    // Count primary keyword occurrences (simple approach)
    const primaryMatches = this.countKeywordSimple(
      contentLower,
      primaryKeyword.toLowerCase()
    );
    const primaryDensity =
      totalWords > 0 ? (primaryMatches / totalWords) * 100 : 0;

    // IT-related keywords for analysis
    const itKeywords = [
      "developer",
      "programming",
      "software",
      "tech",
      "engineer",
      "javascript",
      "python",
      "java",
      "react",
      "node",
      "remote",
      "salary",
      "career",
      "job",
      "skills",
    ];

    const relatedKeywords = itKeywords
      .map((keyword) => ({
        keyword,
        count: this.countKeywordSimple(contentLower, keyword),
        density:
          totalWords > 0
            ? (this.countKeywordSimple(contentLower, keyword) / totalWords) *
              100
            : 0,
      }))
      .filter((k) => k.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      primary: {
        keyword: primaryKeyword,
        count: primaryMatches,
        density: primaryDensity,
        optimal:
          primaryDensity >= this.targetKeywordDensity.min &&
          primaryDensity <= this.targetKeywordDensity.max,
      },
      related: relatedKeywords.slice(0, 10),
      totalUniqueKeywords: relatedKeywords.length,
    };
  }

  /**
   * Simple keyword counting (avoiding complex regex)
   */
  countKeywordSimple(content, keyword) {
    const words = content.split(/\s+/);
    return words.filter((word) => word.includes(keyword)).length;
  }

  /**
   * Analyze heading structure
   */
  analyzeHeadingStructure(content) {
    const lines = content.split("\n");

    const headings = {
      h1: lines.filter((line) => line.startsWith("# ")).length,
      h2: lines.filter((line) => line.startsWith("## ")).length,
      h3: lines.filter((line) => line.startsWith("### ")).length,
      h4: lines.filter((line) => line.startsWith("#### ")).length,
    };

    const totalHeadings = Object.values(headings).reduce(
      (sum, count) => sum + count,
      0
    );
    const properStructure = headings.h1 === 1 && headings.h2 >= 2;

    return {
      ...headings,
      total: totalHeadings,
      properStructure,
      ratio:
        totalHeadings /
        Math.max(1, Math.floor(this.getWordCount(content) / 300)),
    };
  }

  /**
   * Analyze content readability
   */
  analyzeReadability(content) {
    // Simple readability analysis
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const words = content.split(/\s+/).filter((w) => w.length > 0);
    const avgWordsPerSentence =
      sentences.length > 0 ? words.length / sentences.length : 0;

    // Simple complexity measure based on word length
    const complexWords = words.filter((word) => word.length >= 7).length;
    const complexWordsPercentage =
      words.length > 0 ? (complexWords / words.length) * 100 : 0;

    // Simple readability score
    const readabilityScore = Math.max(
      0,
      100 - avgWordsPerSentence - complexWordsPercentage
    );

    return {
      sentences: sentences.length,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      complexWordsPercentage: Math.round(complexWordsPercentage * 10) / 10,
      readabilityScore: Math.round(readabilityScore),
      grade: this.getReadabilityGrade(readabilityScore),
    };
  }

  /**
   * Get readability grade
   */
  getReadabilityGrade(score) {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    if (score >= 50) return "Difficult";
    return "Very Difficult";
  }

  /**
   * Analyze internal links
   */
  analyzeInternalLinks(content) {
    // Simple approach - look for the website URL in content
    const linkCount = (content.match(new RegExp(this.websiteUrl, "g")) || [])
      .length;

    return {
      count: linkCount,
      optimal: linkCount >= 1 && linkCount <= 3,
      links: linkCount > 0 ? [this.websiteUrl] : [],
    };
  }

  /**
   * Analyze content structure (simplified)
   */
  analyzeContentStructure(content) {
    const paragraphs = content.split("\n\n").filter((p) => p.trim().length > 0);
    const bulletPoints = content
      .split("\n")
      .filter(
        (line) => line.trim().startsWith("*") || line.trim().startsWith("-")
      ).length;

    return {
      paragraphs: paragraphs.length,
      lists: bulletPoints,
      avgParagraphLength:
        paragraphs.length > 0
          ? paragraphs.reduce((sum, p) => sum + p.split(" ").length, 0) /
            paragraphs.length
          : 0,
    };
  }

  /**
   * Generate optimized meta tags
   */
  generateOptimizedMeta(content, primaryKeyword, metadata) {
    const title = this.extractTitle(content);
    const optimizedTitle = this.optimizeTitle(title, primaryKeyword);
    const metaDescription = this.generateMetaDescription(
      content,
      primaryKeyword
    );
    const keywords = this.generateMetaKeywords(content, primaryKeyword);

    return {
      title: optimizedTitle,
      metaDescription,
      keywords,
      canonicalUrl: `${this.websiteUrl}/${
        metadata.slug || this.generateSlug(title)
      }`,
      ogTags: this.generateOpenGraphTags(
        optimizedTitle,
        metaDescription,
        metadata
      ),
      twitterTags: this.generateTwitterTags(
        optimizedTitle,
        metaDescription,
        metadata
      ),
    };
  }

  /**
   * Extract title from content (safe version)
   */
  extractTitle(content) {
    try {
      const lines = content.split("\n");
      const titleLine = lines.find((line) => line.startsWith("# "));
      if (titleLine) {
        return titleLine.replace("# ", "").trim();
      }
    } catch (error) {
      console.log(chalk.yellow("⚠️ Could not extract title"));
    }
    return "IT Job Market Insights";
  }

  /**
   * Optimize title for SEO
   */
  optimizeTitle(title, primaryKeyword) {
    if (!title.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      title = `${primaryKeyword}: ${title}`;
    }

    if (title.length > this.optimalTitleLength.max) {
      title = title.substring(0, this.optimalTitleLength.max - 3) + "...";
    }

    return title;
  }

  /**
   * Generate meta description (safe version)
   */
  generateMetaDescription(content, primaryKeyword) {
    try {
      const paragraphs = content
        .split("\n\n")
        .filter(
          (p) =>
            p.trim() &&
            !p.startsWith("#") &&
            !p.startsWith("*") &&
            !p.startsWith("-")
        );

      let description =
        "Expert insights on the IT job market with actionable career advice for tech professionals.";

      if (paragraphs.length > 0 && paragraphs[0]) {
        description = paragraphs[0]
          .replace(/\*\*/g, "")
          .replace(/__/g, "")
          .replace(/##/g, "")
          .replace(/#/g, "")
          .trim();
      }

      // Include primary keyword if not present
      if (!description.toLowerCase().includes(primaryKeyword.toLowerCase())) {
        description = `${primaryKeyword} insights: ${description}`;
      }

      // Optimize length
      if (description.length > this.optimalMetaLength.max) {
        description =
          description.substring(0, this.optimalMetaLength.max - 3) + "...";
      }

      return description;
    } catch (error) {
      return `Professional insights about ${primaryKeyword} in the IT job market.`;
    }
  }

  /**
   * Generate meta keywords
   */
  generateMetaKeywords(content, primaryKeyword) {
    const baseKeywords = [
      primaryKeyword,
      "IT jobs",
      "tech careers",
      "developer",
      "programming",
    ];
    return baseKeywords.join(", ");
  }

  /**
   * Generate optimization suggestions
   */
  generateOptimizationSuggestions(analysis) {
    const suggestions = [];

    // Word count suggestions
    if (analysis.wordCount < this.optimalWordCount.min) {
      suggestions.push({
        type: "content",
        priority: "high",
        message: `Content is too short (${analysis.wordCount} words). Aim for ${this.optimalWordCount.min}-${this.optimalWordCount.max} words.`,
      });
    }

    // Keyword density suggestions
    if (!analysis.keywordAnalysis.primary.optimal) {
      const density = analysis.keywordAnalysis.primary.density;
      if (density < this.targetKeywordDensity.min) {
        suggestions.push({
          type: "keywords",
          priority: "medium",
          message: `Primary keyword density is low (${density.toFixed(
            1
          )}%). Add more variations naturally.`,
        });
      } else {
        suggestions.push({
          type: "keywords",
          priority: "high",
          message: `Primary keyword density is too high (${density.toFixed(
            1
          )}%). Reduce to avoid keyword stuffing.`,
        });
      }
    }

    // Heading structure suggestions
    if (!analysis.headingStructure.properStructure) {
      suggestions.push({
        type: "structure",
        priority: "medium",
        message:
          "Improve heading structure. Use one H1 and multiple H2s for better SEO.",
      });
    }

    // Readability suggestions
    if (analysis.readability.readabilityScore < 60) {
      suggestions.push({
        type: "readability",
        priority: "medium",
        message:
          "Content readability could be improved. Use shorter sentences and simpler words.",
      });
    }

    return suggestions;
  }

  /**
   * Calculate SEO score
   */
  calculateSEOScore(analysis) {
    let score = 0;
    let maxScore = 100;

    // Word count (25 points)
    if (
      analysis.wordCount >= this.optimalWordCount.min &&
      analysis.wordCount <= this.optimalWordCount.max
    ) {
      score += 25;
    } else if (analysis.wordCount >= this.optimalWordCount.min * 0.8) {
      score += 15;
    } else {
      score += 5;
    }

    // Keyword optimization (25 points)
    if (analysis.keywordAnalysis.primary.optimal) {
      score += 25;
    } else {
      score += 10;
    }

    // Heading structure (25 points)
    if (analysis.headingStructure.properStructure) {
      score += 25;
    } else if (analysis.headingStructure.h1 === 1) {
      score += 15;
    } else {
      score += 5;
    }

    // Readability (25 points)
    score += Math.round((analysis.readability.readabilityScore / 100) * 25);

    return {
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      grade: this.getSEOGrade((score / maxScore) * 100),
    };
  }

  /**
   * Get SEO grade
   */
  getSEOGrade(percentage) {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  }

  /**
   * Generate Job Schema markup
   */
  generateJobSchema(content, metadata) {
    const title = this.extractTitle(content);

    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: this.generateMetaDescription(content, metadata.topic || ""),
      author: {
        "@type": "Organization",
        name: "IT Career Insights",
        url: this.websiteUrl,
      },
      publisher: {
        "@type": "Organization",
        name: "IT Career Insights",
        url: this.websiteUrl,
      },
      datePublished: metadata.generatedAt || new Date().toISOString(),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${this.websiteUrl}/${
          metadata.slug || this.generateSlug(title)
        }`,
      },
      articleSection: "IT Jobs",
      keywords: metadata.keywords || "IT jobs, tech careers, programming jobs",
    };
  }

  /**
   * Generate social media meta tags
   */
  generateSocialMetaTags(content, metadata) {
    const title = this.extractTitle(content);
    const description = this.generateMetaDescription(
      content,
      metadata.topic || ""
    );

    return {
      openGraph: this.generateOpenGraphTags(title, description, metadata),
      twitter: this.generateTwitterTags(title, description, metadata),
    };
  }

  /**
   * Generate Open Graph tags
   */
  generateOpenGraphTags(title, description, metadata) {
    return {
      "og:title": title,
      "og:description": description,
      "og:type": "article",
      "og:url": `${this.websiteUrl}/${
        metadata.slug || this.generateSlug(title)
      }`,
      "og:site_name": "IT Career Insights",
    };
  }

  /**
   * Generate Twitter Card tags
   */
  generateTwitterTags(title, description, metadata) {
    return {
      "twitter:card": "summary_large_image",
      "twitter:title": title,
      "twitter:description": description,
    };
  }

  // Helper methods
  getWordCount(content) {
    return content.split(/\s+/).filter((word) => word.length > 0).length;
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
}

module.exports = SEOOptimizer;
