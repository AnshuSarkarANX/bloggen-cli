// src/file-manager.js
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
require("dotenv").config();

class FileManager {
  constructor() {
    this.defaultOutputDir = process.env.DEFAULT_OUTPUT_DIR || "./blog-posts";
    this.websiteUrl = process.env.WEBSITE_URL || "https://yoursite.com";
  }

  /**
   * Ensure output directory exists
   */
  async ensureOutputDirectory(outputDir = null) {
    const dir = outputDir || this.defaultOutputDir;

    try {
      await fs.ensureDir(dir);
      return dir;
    } catch (error) {
      console.log(chalk.red(`❌ Failed to create directory: ${dir}`));
      throw error;
    }
  }

  /**
   * Generate structured filename
   */
  generateFilename(topic, customName = null) {
    if (customName) {
      return customName.endsWith(".txt") ? customName : `${customName}.txt`;
    }

    const date = new Date().toISOString().split("T")[0];
    const time = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
    const slug = this.createSlug(topic);

    return `${date}-${time}-${slug}.txt`;
  }

  /**
   * Create URL-friendly slug
   */
  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 50);
  }

  /**
   * Format complete blog post output
   */
  formatBlogPost(result, additionalMetadata = {}) {
    const { content, metadata } = result;
    const seoData = this.extractSEOData(content);
    const timestamp = new Date().toLocaleString();

    return `=== BLOG POST METADATA ===
Title: ${seoData.title}
Meta Description: ${seoData.metaDescription}
Keywords: ${seoData.keywords}
Generated: ${timestamp}
Model Used: ${metadata.modelUsed}
Word Count: ${metadata.wordCount}
Backlinks Included: ${metadata.backlinksIncluded}
Topic: ${metadata.topic}
Slug: ${metadata.slug}
Website: ${this.websiteUrl}

=== SEO OPTIMIZED CONTENT ===
${content}

=== TECHNICAL DETAILS ===
- Generator: Bloggen CLI v1.0.0
- Target: IT Job Market Blog
- Format: SEO-optimized Markdown
- Date Generated: ${metadata.generatedAt}
- File Created: ${timestamp}
- Ready for: WordPress, Ghost, Static Sites

=== USAGE INSTRUCTIONS ===
1. Review content for accuracy and tone
2. Copy content section for publishing
3. Use metadata for CMS fields
4. Ensure backlinks are appropriate
5. Optimize images if needed`;
  }

  /**
   * Extract SEO data from content
   */
  extractSEOData(content) {
    // Extract title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "IT Job Market Insights";

    // Generate meta description from first meaningful paragraph
    const paragraphs = content
      .split("\n\n")
      .filter(
        (p) =>
          p.trim() &&
          !p.startsWith("#") &&
          !p.startsWith("*") &&
          !p.startsWith("-") &&
          !p.startsWith(">")
      );

    let metaDescription =
      "Expert insights on the IT job market with actionable career advice for tech professionals.";
    if (paragraphs.length > 0) {
      let desc = paragraphs[0]
        .replace(/\*\*|__|##|#|\*|\[|\]|\(|\)/g, "")
        .trim();

      if (desc.length > 160) {
        desc = desc.substring(0, 157) + "...";
      }
      metaDescription = desc;
    }

    // Extract relevant keywords
    const itKeywords = this.extractITKeywords(content);

    return {
      title,
      metaDescription,
      keywords: itKeywords.join(", "),
    };
  }

  /**
   * Extract IT-relevant keywords from content
   */
  extractITKeywords(content) {
    const commonITTerms = [
      "developer",
      "programming",
      "software",
      "tech",
      "IT",
      "engineer",
      "javascript",
      "python",
      "java",
      "react",
      "node",
      "devops",
      "data scientist",
      "full stack",
      "frontend",
      "backend",
      "remote work",
      "salary",
      "career",
      "job market",
      "hiring",
      "cybersecurity",
      "cloud",
      "artificial intelligence",
      "machine learning",
    ];

    const contentLower = content.toLowerCase();
    const foundKeywords = commonITTerms.filter((term) =>
      contentLower.includes(term.toLowerCase())
    );

    // Add context-specific keywords
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      const titleWords = titleMatch[1]
        .toLowerCase()
        .split(" ")
        .filter((word) => word.length > 3)
        .slice(0, 3);
      foundKeywords.push(...titleWords);
    }

    // Remove duplicates and limit to 8 keywords
    return [...new Set(foundKeywords)].slice(0, 8);
  }

  /**
   * Save blog post to file
   */
  async saveBlogPost(result, options = {}) {
    try {
      const outputDir = await this.ensureOutputDirectory(options.outputDir);
      const filename = this.generateFilename(
        result.metadata.topic,
        options.filename
      );
      const filepath = path.join(outputDir, filename);

      const formattedContent = this.formatBlogPost(result, options.metadata);

      await fs.writeFile(filepath, formattedContent, "utf8");

      return {
        filepath,
        filename,
        directory: outputDir,
        size: Buffer.byteLength(formattedContent, "utf8"),
      };
    } catch (error) {
      console.log(chalk.red(`❌ Failed to save blog post: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(filepath) {
    try {
      const stats = await fs.stat(filepath);
      const content = await fs.readFile(filepath, "utf8");

      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        wordCount: content.split(/\s+/).length,
        lines: content.split("\n").length,
      };
    } catch (error) {
      throw new Error(`Failed to get file stats: ${error.message}`);
    }
  }

  /**
   * List generated blog posts
   */
  async listBlogPosts(directory = null) {
    const dir = directory || this.defaultOutputDir;

    try {
      if (!(await fs.pathExists(dir))) {
        return [];
      }

      const files = await fs.readdir(dir);
      const blogPosts = files
        .filter((file) => file.endsWith(".txt"))
        .sort((a, b) => b.localeCompare(a)); // Most recent first

      const postsWithStats = await Promise.all(
        blogPosts.map(async (file) => {
          const filepath = path.join(dir, file);
          const stats = await this.getFileStats(filepath);
          return {
            filename: file,
            filepath,
            ...stats,
          };
        })
      );

      return postsWithStats;
    } catch (error) {
      console.log(chalk.red(`❌ Failed to list blog posts: ${error.message}`));
      return [];
    }
  }

  /**
   * Clean up old files (keep last N files)
   */
  async cleanupOldPosts(keepCount = 10, directory = null) {
    const posts = await this.listBlogPosts(directory);

    if (posts.length <= keepCount) {
      return { deleted: 0, kept: posts.length };
    }

    const toDelete = posts.slice(keepCount);
    let deletedCount = 0;

    for (const post of toDelete) {
      try {
        await fs.unlink(post.filepath);
        deletedCount++;
      } catch (error) {
        console.log(
          chalk.yellow(`⚠️ Failed to delete ${post.filename}: ${error.message}`)
        );
      }
    }

    return { deleted: deletedCount, kept: posts.length - deletedCount };
  }
}

module.exports = FileManager;
