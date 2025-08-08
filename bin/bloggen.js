#!/usr/bin/env node

// bin/bloggen.js
const { program } = require("commander");
const chalk = require("chalk");
const ora = require("ora");
const path = require("path");
const ContentGenerator = require("../src/content-generator");
const FileManager = require("../src/file-manager");
const SEOOptimizer = require("../src/seo-optimizer");
const GeminiWorkflowParser = require("../src/gemini-workflow-parser");

// Display banner
function showBanner() {
  console.log(chalk.cyan(""));
  console.log(
    chalk.cyan("██████╗ ██╗      ██████╗  ██████╗  ██████╗ ███████╗███╗   ██╗")
  );
  console.log(
    chalk.cyan("██╔══██╗██║     ██╔═══██╗██╔════╝ ██╔════╝ ██╔════╝████╗  ██║")
  );
  console.log(
    chalk.cyan("██████╔╝██║     ██║   ██║██║  ███╗██║  ███╗█████╗  ██╔██╗ ██║")
  );
  console.log(
    chalk.cyan("██╔══██╗██║     ██║   ██║██║   ██║██║   ██║██╔══╝  ██║╚██╗██║")
  );
  console.log(
    chalk.cyan("██████╔╝███████╗╚██████╔╝╚██████╔╝╚██████╔╝███████╗██║ ╚████║")
  );
  console.log(
    chalk.cyan("╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═══╝")
  );
  console.log(chalk.cyan(""));
  console.log(chalk.gray("🤖 AI-Powered IT Job Market Blog Generator"));
  console.log(chalk.gray("📝 SEO-optimized content with integrated backlinks"));
  console.log("");
}


// Load environment variables
require('dotenv').config();


// Get API key from environment
function getAPIKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (apiKey) {
    console.log(chalk.blue('🔑 Using API key from environment'));
    return apiKey;
  }
  
  console.log(chalk.red('❌ No API key found in environment'));
  console.log(chalk.yellow('Please set GEMINI_API_KEY in your .env file'));
  console.log(chalk.blue('Example: GEMINI_API_KEY=your_actual_key'));
  process.exit(1);
}

// Get configuration from environment
function getConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY,
    websiteUrl: process.env.WEBSITE_URL || 'https://yoursite.com',
    outputDir: process.env.DEFAULT_OUTPUT_DIR || './blog-posts'
  };
}


function generateImprovementPrompt(originalContent, analysis, keyword, targetScore) {
  const issues = analysis.suggestions;
  let improvementInstructions = [];
  
  // Build specific improvement instructions based on issues
  issues.forEach(issue => {
    switch (issue.type) {
      case 'content':
        if (issue.message.includes('too short')) {
          improvementInstructions.push('- Expand the content with more detailed sections, examples, and actionable advice');
          improvementInstructions.push('- Add more comprehensive coverage of the topic with deeper insights');
        }
        break;
      case 'keywords':
        if (issue.message.includes('low')) {
          improvementInstructions.push(`- Naturally integrate more variations of "${keyword}" throughout the content`);
          improvementInstructions.push('- Include related keywords and synonyms in headings and paragraphs');
        } else {
          improvementInstructions.push(`- Reduce keyword stuffing and make "${keyword}" usage more natural`);
        }
        break;
      case 'structure':
        improvementInstructions.push('- Improve heading hierarchy with proper H1, H2, H3 structure');
        improvementInstructions.push('- Add more subheadings to break up content into digestible sections');
        break;
      case 'readability':
        improvementInstructions.push('- Use shorter sentences and simpler language');
        improvementInstructions.push('- Add more bullet points, lists, and structured formatting');
        break;
    }
  });
  
  const currentWordCount = analysis.wordCount;
  const targetWordCount = Math.max(1400, currentWordCount + 200);
  
  return `Please rewrite and significantly improve the following blog post to achieve better SEO optimization. 

ORIGINAL CONTENT TO IMPROVE:
${originalContent}

SPECIFIC IMPROVEMENT REQUIREMENTS:
${improvementInstructions.join('\n')}

TARGET SEO GOALS:
- Primary keyword: "${keyword}" with 1.5-2.5% density (natural integration)
- Target word count: ${targetWordCount}+ words
- SEO score target: ${targetScore}%+
- Better heading structure with clear H1, H2, H3 hierarchy
- Improved readability with shorter paragraphs and clearer language
- More actionable insights and practical advice
- Enhanced user engagement and value

CONTENT REQUIREMENTS:
- Keep the IT job market focus and professional tone
- Expand with more detailed examples and case studies
- Add more structured lists and bullet points for readability
- Include more actionable career advice and specific tips
- Integrate backlinks to ${process.env.WEBSITE_URL} naturally (1-2 times)
- Use current market data and trends (2025 context)
- Make the content more comprehensive and authoritative

STRUCTURE REQUIREMENTS:
- Clear H1 title with keyword integration
- Multiple H2 sections for main topics
- H3 subsections for detailed coverage
- Bullet points and lists for key information
- Strong introduction and conclusion
- Logical flow between sections

Generate a completely rewritten, expanded, and SEO-optimized version that addresses all the identified issues while maintaining high quality and value for IT professionals.`;
}

// Validate topic for IT job market relevance
function validateTopic(topic) {
  const itKeywords = [
    "developer",
    "programming",
    "software",
    "tech",
    "IT",
    "engineer",
    "coding",
    "job",
    "career",
    "salary",
    "remote",
    "skills",
    "hiring",
    "interview",
    "market",
    "trends",
    "javascript",
    "python",
    "java",
    "react",
    "node",
    "devops",
    "data",
    "cloud",
    "cybersecurity",
  ];

  const topicLower = topic.toLowerCase();
  const hasITKeyword = itKeywords.some((keyword) =>
    topicLower.includes(keyword)
  );

  if (!hasITKeyword) {
    console.log(chalk.yellow("⚠️  Topic may not be IT job market related"));
    console.log(
      chalk.gray(
        "For best results, include IT/tech terms like: developer, programming, tech jobs, etc."
      )
    );
    console.log("");
  }
}

// Generate filename from topic
function generateFilename(topic) {
  const date = new Date().toISOString().split("T")[0];
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 50);

  return `${date}-${slug}.txt`;
}

// Format output content
function formatOutput(result) {
  const { content, metadata } = result;
  const seoData = extractSEOData(content);

  return `=== BLOG POST METADATA ===
Title: ${seoData.title}
Meta Description: ${seoData.metaDescription}
Keywords: ${seoData.keywords}
Generated: ${new Date().toLocaleString()}
Model Used: ${metadata.modelUsed}
Word Count: ${metadata.wordCount}
Backlinks: ${metadata.backlinksIncluded}
Topic: ${metadata.topic}

=== SEO CONTENT ===
${content}

=== GENERATION INFO ===
- Generated by Bloggen CLI
- Optimized for IT job market
- SEO-ready with integrated backlinks
- Date: ${metadata.generatedAt}
- Slug: ${metadata.slug}`;
}

// Extract SEO data from content
function extractSEOData(content) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "IT Job Market Insights";

  // Generate meta description from first paragraph
  const paragraphs = content
    .split("\n\n")
    .filter(
      (p) =>
        p.trim() &&
        !p.startsWith("#") &&
        !p.startsWith("*") &&
        !p.startsWith("-")
    );

  let metaDescription =
    "Expert insights on the IT job market with actionable career advice for tech professionals.";
  if (paragraphs.length > 0) {
    let desc = paragraphs[0].replace(/\*\*|__|##|#/g, "").trim();
    if (desc.length > 160) {
      desc = desc.substring(0, 157) + "...";
    }
    metaDescription = desc;
  }

  // Extract keywords
  const commonKeywords = [
    "IT jobs",
    "tech careers",
    "developer",
    "programming",
    "software engineer",
  ];
  const keywords = commonKeywords.join(", ");

  return { title, metaDescription, keywords };
}

// Main generate command
async function generateBlog(topic, options) {
  try {
    showBanner();

    // Initialize File Manager
    const fileManager = new FileManager();
    // Validate inputs
    if (!topic && !options.prompt) {
      console.log(
        chalk.red("❌ Please provide a topic or use --prompt option")
      );
      console.log(
        chalk.blue('Example: bloggen "Remote Python developer jobs 2025"')
      );
      process.exit(1);
    }

    const actualTopic = topic || "IT Job Market Analysis";
    validateTopic(actualTopic);

    // Get API key
    const apiKey = getAPIKey();
    const generator = new ContentGenerator(apiKey);

    // Show generation info
    console.log(chalk.green("🚀 Starting blog generation..."));
    console.log(chalk.gray(`📋 Topic: ${actualTopic}`));
    if (options.prompt) {
      console.log(
        chalk.gray(`🎯 Custom prompt: ${options.prompt.substring(0, 100)}...`)
      );
    }
    console.log("");

    // Generate content with spinner
    const spinner = ora("Generating blog content...").start();

    const result = await generator.generateContent(actualTopic, {
      customPrompt: options.prompt,
    });

    spinner.succeed("Content generated successfully!");
    const seoSpinner = ora("Optimizing content for SEO...").start();

    const seoOptimizer = new SEOOptimizer(process.env.WEBSITE_URL);
    const seoAnalysis = seoOptimizer.optimizeContent(
      result.content,
      actualTopic,
      result.metadata
    );

    seoSpinner.succeed(
      `SEO optimization complete! Score: ${seoAnalysis.seoScore.grade} (${seoAnalysis.seoScore.percentage}%)`
    );

    // Enhanced result with SEO data
    const enhancedResult = {
      ...result,
      seo: seoAnalysis,
    };

    // Save using File Manager with SEO data
    const fileInfo = await fileManager.saveBlogPost(enhancedResult, {
      filename: options.output,
      outputDir: options.dir,
    });

    // Enhanced success feedback with SEO metrics and JSON format
    console.log(chalk.green("\n✅ Blog post generated and optimized!"));
    console.log(chalk.blue(`📄 File: ${fileInfo.filepath}`));
    console.log(chalk.blue(`📂 Format: JSON (API-ready)`));
    console.log(chalk.blue(`📊 Word count: ${result.metadata.wordCount}`));
    console.log(
      chalk.blue(
        `🔍 SEO Score: ${seoAnalysis.seoScore.grade} (${seoAnalysis.seoScore.percentage}%)`
      )
    );
    console.log(
      chalk.blue(`🏷️  Category: ${JSON.parse(enhancedResult.content).category}`)
    );
    console.log(
      chalk.blue(`🔑 Keywords: ${JSON.parse(enhancedResult.content).keywords}`)
    );
    console.log(chalk.blue(`🤖 Model: ${result.metadata.modelUsed}`));
    // Show JSON preview
    const jsonData = JSON.parse(enhancedResult.content);
    console.log(chalk.gray("\n📖 JSON Structure Preview:"));
    console.log(chalk.gray(`Title: ${jsonData.title.substring(0, 60)}...`));
    console.log(chalk.gray(`Category: ${jsonData.category}`));
    console.log(chalk.gray(`Tags: ${jsonData.tags.slice(0, 3).join(", ")}`));
    console.log(chalk.gray(`Date: ${jsonData.date}`));

    // Show SEO suggestions
    if (seoAnalysis.suggestions.length > 0) {
      console.log(chalk.yellow("\n💡 SEO Suggestions:"));
      seoAnalysis.suggestions.forEach((suggestion, index) => {
        const priority =
          suggestion.priority === "high"
            ? chalk.red("HIGH")
            : suggestion.priority === "medium"
            ? chalk.yellow("MED")
            : chalk.blue("LOW");
        console.log(`   ${index + 1}. [${priority}] ${suggestion.message}`);
      });
    }
  } catch (error) {
    console.log(chalk.red("\n❌ Generation failed"));
    console.log(chalk.red(`Error: ${error.message}`));

    if (error.message.includes("Invalid API key")) {
      console.log(
        chalk.blue(
          "\n💡 Get your free Gemini API key at: https://makersuite.google.com/app/apikey"
        )
      );
      console.log(chalk.blue('Then set it: export GEMINI_API_KEY="your-key"'));
    }

    process.exit(1);
  }
}

// CLI setup
program
  .name("bloggen")
  .description(
    "AI-powered CLI for generating SEO-optimized IT job market blog posts"
  )
  .version("1.0.0");

// Main generate command
// program
//   .argument("[topic]", "Blog topic (IT job market focused)")
//   .option("-p, --prompt <text>", "Custom prompt for content generation")
//   .option("-o, --output <file>", "Output filename (default: auto-generated)")
//   .action(generateBlog);

// Info command
program
  .command("info")
  .description("Show API configuration and model status")
  .action(() => {
    showBanner();

    const config = getConfig();

    console.log("📊 Configuration Status:");
    console.log(`API Key: ${config.apiKey ? "✅ Set" : "❌ Not set"}`);
    console.log(`Website URL: ${config.websiteUrl}`);
    console.log(`Output Directory: ${config.outputDir}`);
    console.log("");

    if (!config.apiKey) {
      console.log(chalk.yellow("⚠️  Missing API key in .env file"));
      console.log(
        chalk.blue("Create a .env file with: GEMINI_API_KEY=your_key")
      );
      console.log("");
    }

    console.log("🤖 Available Flash Models:");
    console.log("- gemini-2.5-flash (Primary)");
    console.log("- gemini-2.5-flash-lite");
    console.log("- gemini-2.0-flash");
    console.log("- gemini-2.0-flash-lite");
    console.log("- gemini-1.5-flash");
    console.log("- gemini-1.5-flash-8b (Fallback)");
    console.log("");
  });

// Help override with examples
program.on("--help", () => {
  console.log("");
  console.log("Examples:");
  console.log(
    '  $ bloggen "JavaScript developer trends 2025"                    # Simple topic'
  );
  console.log(
    '  $ bloggen workflow "Create a comprehensive Python career guide" # Intelligent workflow'
  );
  console.log(
    '  $ bloggen workflow "Write a beginner tutorial on React hooks"   # Specific audience & type'
  );
  console.log(
    '  $ bloggen workflow "Generate a comparison between Vue and React" # Comparison content'
  );
  console.log(
    '  $ bloggen workflow "..." --preview                             # Preview workflow parsing'
  );
  console.log(
    '  $ bloggen analyze filename.json --keyword "Python"             # Analyze existing content'
  );
  console.log("");
  console.log("Workflow Instructions Support:");
  console.log(
    "  • Content types: blog post, guide, tutorial, analysis, comparison"
  );
  console.log("  • Audiences: beginners, professionals, general, experts");
  console.log("  • Styles: professional, casual, technical, friendly");
  console.log("  • Requirements: examples, data, trends, step-by-step");
  console.log("");
});

// workflow command for automation
program
  .argument("[instruction]", "Blog topic (IT job market focused)")
  .description("Generate content from natural language instructions")
  .option("-o, --output <filename>", "Custom output filename")
  .option("--preview", "Show parsed workflow without generating content")
  .action(async (instruction, options) => {
    try {
      showBanner();

      const apiKey = getAPIKey();

      // Parse instruction with Gemini
      const parser = new GeminiWorkflowParser(apiKey);
      const workflow = await parser.parseInstruction(instruction);

      console.log(chalk.green("✅ Instruction parsed successfully!"));
      console.log(workflow);
  

      // Show preview of parsed workflow
      console.log(chalk.blue("\n📋 Parsed Workflow & Constraints:"));
      console.log(chalk.gray(`Content Type: ${workflow.contentType}`));
      console.log(chalk.gray(`Topic: ${workflow.topic}`));
      console.log(
        chalk.gray(`Audience: ${workflow.audience.level || "general"}`)
      );

      // Enhanced length constraint feedback
      if (workflow.lengthConstraints && workflow.lengthConstraints.wordLimit) {
        const constraint = workflow.lengthConstraints;
        const priorityColor =
          constraint.priority === "critical"
            ? chalk.red
            : constraint.priority === "important"
            ? chalk.yellow
            : chalk.gray;

        console.log(
          priorityColor(
            `📏 Length: ${constraint.constraintType} ${constraint.wordLimit} words (${constraint.priority})`
          )
        );
        console.log(chalk.gray(`   Reasoning: ${constraint.reasoning}`));
      }

      // Show conflicts if detected
      const validation = parser.validateConstraints(workflow);
      if (validation.conflicts.length > 0) {
        console.log(chalk.red("\n⚠️ Constraint Conflicts Detected:"));
        validation.conflicts.forEach((conflict) => {
          console.log(chalk.yellow(`   • ${conflict.message}`));
          console.log(chalk.gray(`     Suggestion: ${conflict.suggestion}`));
        });
      }

      if (validation.warnings.length > 0) {
        console.log(chalk.yellow("\n💡 Constraint Warnings:"));
        validation.warnings.forEach((warning) => {
          console.log(chalk.gray(`   • ${warning.message}`));
        });
      }
      console.log(
        chalk.gray(
          `Style: ${workflow.style.tone}, ${workflow.style.depth} depth`
        )
      );
      console.log(chalk.gray(`Keywords: ${workflow.seoKeywords.join(", ")}`));

      if (workflow.fallbackUsed) {
        console.log(
          chalk.yellow(
            "⚠️ Used fallback parsing - results may be less accurate"
          )
        );
      }

      // If preview mode, show workflow and exit
      if (options.preview) {
        console.log(chalk.blue("\n🔍 Full Workflow Details:"));
        console.log(JSON.stringify(workflow, null, 2));
        return;
      }

      // Generate content based on workflow
      const generator = new ContentGenerator(apiKey);
      const contentSpinner = ora(
        "Generating intelligent content based on parsed workflow..."
      ).start();

      const result = await generator.generateWorkflowContent(workflow);

      contentSpinner.succeed("Content generated successfully!");

      // SEO optimization
      const seoSpinner = ora("Optimizing content for SEO...").start();
      const seoOptimizer = new SEOOptimizer(process.env.WEBSITE_URL);
      const seoAnalysis = seoOptimizer.optimizeContent(
        result.content,
        workflow.topic,
        result.metadata
      );
      seoSpinner.succeed(
        `SEO optimization complete! Score: ${seoAnalysis.seoScore.grade} (${seoAnalysis.seoScore.percentage}%)`
      );

      // Save content
      const fileManager = new FileManager();
      const enhancedResult = {
        ...result,
        seo: seoAnalysis,
        workflow: workflow,
      };

      const fileInfo = await fileManager.saveBlogPost(enhancedResult, {
        filename: options.output,
      });

      // Success feedback
      console.log(chalk.green("\n✅ Intelligent blog post generated!"));
      console.log(chalk.blue(`📄 File: ${fileInfo.filepath}`));
      console.log(
        chalk.blue(
          `🎯 Content Type: ${workflow.contentType} for ${workflow.audience}`
        )
      );
      console.log(chalk.blue(`📊 Word count: ${result.metadata.wordCount}`));
      console.log(
        chalk.blue(
          `🔍 SEO Score: ${seoAnalysis.seoScore.grade} (${seoAnalysis.seoScore.percentage}%)`
        )
      );
      console.log(
        chalk.blue(
          `🎨 Style: ${workflow.style.tone} tone, ${workflow.style.depth} depth`
        )
      );
      console.log(chalk.blue(`🤖 Model: ${result.metadata.modelUsed}`));

      if (seoAnalysis.suggestions.length > 0) {
        console.log(chalk.yellow("\n💡 SEO Suggestions:"));
        seoAnalysis.suggestions.slice(0, 3).forEach((suggestion, index) => {
          console.log(`   ${index + 1}. ${suggestion.message}`);
        });
      }
    } catch (error) {
      console.log(chalk.red(`❌ Workflow generation failed: ${error.message}`));
      process.exit(1);
    }
  });

// List generated posts
program
  .command('list')
  .description('List all generated blog posts')
  .option('-d, --dir <directory>', 'Directory to list from')
  .action(async (options) => {
    const fileManager = new FileManager();
    const posts = await fileManager.listBlogPosts(options.dir);
    
    if (posts.length === 0) {
      console.log(chalk.yellow('No blog posts found.'));
      return;
    }

    console.log(chalk.green(`\n📚 Found ${posts.length} blog posts:\n`));
    
    posts.forEach((post, index) => {
      console.log(chalk.blue(`${index + 1}. ${post.filename}`));
      console.log(chalk.gray(`   📊 ${post.wordCount} words | 💾 ${Math.round(post.size / 1024)}KB`));
      console.log(chalk.gray(`   📅 Created: ${post.created.toLocaleDateString()}\n`));
    });
  });

// Cleanup old posts
program
  .command('cleanup')
  .description('Clean up old blog posts (keep last 10)')
  .option('-k, --keep <number>', 'Number of posts to keep', '10')
  .option('-d, --dir <directory>', 'Directory to clean')
  .action(async (options) => {
    const fileManager = new FileManager();
    const result = await fileManager.cleanupOldPosts(parseInt(options.keep), options.dir);
    
    console.log(chalk.green(`✅ Cleanup complete!`));
    console.log(chalk.blue(`🗑️  Deleted: ${result.deleted} files`));
    console.log(chalk.blue(`📚 Kept: ${result.kept} files`));
  });

  // analyze command
  program
    .command("analyze <file>")
    .description("Analyze SEO quality of existing blog post")
    .option("-k, --keyword <keyword>", "Primary keyword to analyze")
    .action(async (file, options) => {
      try {
        const fs = require("fs-extra");
        const content = await fs.readFile(file, "utf8");

        const keyword = options.keyword || "IT jobs";
        const seoOptimizer = new SEOOptimizer(process.env.WEBSITE_URL);
        const analysis = seoOptimizer.optimizeContent(content, keyword);

        console.log(chalk.green(`\n📊 SEO Analysis for: ${file}\n`));

        // Overall score
        console.log(
          chalk.blue(
            `🎯 Overall SEO Score: ${analysis.seoScore.grade} (${analysis.seoScore.percentage}%)`
          )
        );
        console.log(
          chalk.gray(
            `   Score: ${analysis.seoScore.score}/${analysis.seoScore.maxScore} points\n`
          )
        );

        // Detailed metrics
        console.log(chalk.blue("📈 Content Metrics:"));
        console.log(`   📝 Word Count: ${analysis.analysis.wordCount}`);
        console.log(
          `   🔑 Keyword Density: ${analysis.analysis.keywordAnalysis.primary.density.toFixed(
            1
          )}%`
        );
        console.log(
          `   📖 Readability: ${analysis.analysis.readability.grade} (${analysis.analysis.readability.readabilityScore}/100)`
        );
        console.log(
          `   🔗 Internal Links: ${analysis.analysis.internalLinks.count}`
        );
        console.log(
          `   📋 Headings: H1(${analysis.analysis.headingStructure.h1}) H2(${analysis.analysis.headingStructure.h2}) H3(${analysis.analysis.headingStructure.h3})\n`
        );

        // Suggestions
        if (analysis.suggestions.length > 0) {
          console.log(chalk.yellow("💡 Optimization Suggestions:"));
          analysis.suggestions.forEach((suggestion, index) => {
            const priority =
              suggestion.priority === "high"
                ? chalk.red("HIGH")
                : suggestion.priority === "medium"
                ? chalk.yellow("MED")
                : chalk.blue("LOW");
            console.log(`   ${index + 1}. [${priority}] ${suggestion.message}`);
          });
        } else {
          console.log(
            chalk.green(
              "✅ No optimization suggestions - content is well optimized!"
            )
          );
        }
      } catch (error) {
        console.log(chalk.red(`❌ Analysis failed: ${error.message}`));
      }
    });

    program
  .command('rewrite <file>')
  .description('Analyze and rewrite blog post for better SEO optimization')
  .option('-k, --keyword <keyword>', 'Primary keyword to optimize for')
  .option('-t, --target-score <score>', 'Target SEO score (default: 85)', '85')
  .option('-o, --output <filename>', 'Output filename for rewritten content')
  .action(async (file, options) => {
    try {
      showBanner();
      
      // Read existing content
      const fs = require('fs-extra');
      const FileManager = require('../src/file-manager');
      const SEOOptimizer = require('../src/seo-optimizer');
      
      console.log(chalk.blue(`📄 Analyzing: ${file}`));
      
      if (!await fs.pathExists(file)) {
        console.log(chalk.red(`❌ File not found: ${file}`));
        process.exit(1);
      }
      
      const originalContent = await fs.readFile(file, 'utf8');
      
      // Extract content section (remove metadata)
      const contentMatch = originalContent.match(/=== SEO OPTIMIZED CONTENT ===\n([\s\S]*?)\n=== TECHNICAL DETAILS ===/);
      const cleanContent = contentMatch ? contentMatch[1].trim() : originalContent;
      
      // Extract original topic
      const topicMatch = originalContent.match(/Topic: (.+)/);
      const originalTopic = topicMatch ? topicMatch[1] : options.keyword || 'IT job market';
      
      const keyword = options.keyword || originalTopic;
      const targetScore = parseInt(options.targetScore);
      
      // Analyze current SEO
      const seoOptimizer = new SEOOptimizer(process.env.WEBSITE_URL);
      const currentAnalysis = seoOptimizer.optimizeContent(cleanContent, keyword);
      
      console.log(chalk.yellow(`\n📊 Current SEO Score: ${currentAnalysis.seoScore.grade} (${currentAnalysis.seoScore.percentage}%)`));
      
      if (currentAnalysis.seoScore.percentage >= targetScore) {
        console.log(chalk.green(`✅ Content already meets target score of ${targetScore}%`));
        return;
      }
      
      console.log(chalk.blue(`🎯 Target Score: ${targetScore}%`));
      console.log(chalk.yellow(`📈 Improvement needed: ${targetScore - currentAnalysis.seoScore.percentage} points\n`));
      
      // Show current issues
      if (currentAnalysis.suggestions.length > 0) {
        console.log(chalk.red('🔍 Issues to fix:'));
        currentAnalysis.suggestions.forEach((suggestion, index) => {
          const priority = suggestion.priority === 'high' ? chalk.red('HIGH') : 
                          suggestion.priority === 'medium' ? chalk.yellow('MED') : chalk.blue('LOW');
          console.log(`   ${index + 1}. [${priority}] ${suggestion.message}`);
        });
        console.log('');
      }
      
      // Generate improvement prompt
      const improvementPrompt = generateImprovementPrompt(cleanContent, currentAnalysis, keyword, targetScore);
      
      // Get API key and regenerate content
      const apiKey = getAPIKey();
      const generator = new ContentGenerator(apiKey);
      
      const rewriteSpinner = ora('Rewriting content for better SEO optimization...').start();
      
      const improvedResult = await generator.generateContent(originalTopic, {
        customPrompt: improvementPrompt
      });
      
      rewriteSpinner.succeed('Content rewritten successfully!');
      
      // Analyze improved content
      const seoSpinner = ora('Analyzing improved content...').start();
      const newAnalysis = seoOptimizer.optimizeContent(improvedResult.content, keyword, improvedResult.metadata);
      seoSpinner.succeed(`New SEO Score: ${newAnalysis.seoScore.grade} (${newAnalysis.seoScore.percentage}%)`);
      
      // Save improved content
      const fileManager = new FileManager();
      const enhancedResult = {
        ...improvedResult,
        seo: newAnalysis
      };
      
      const outputFilename = options.output || file.replace('.txt', '-improved.txt');
      const fileInfo = await fileManager.saveBlogPost(enhancedResult, {
        filename: outputFilename
      });
      
      // Show improvement results
      console.log(chalk.green('\n✅ Blog post rewritten and optimized!'));
      console.log(chalk.blue(`📄 New file: ${fileInfo.filename}`));
      const improvement = newAnalysis.seoScore.percentage - currentAnalysis.seoScore.percentage;
console.log(chalk.blue(`📊 SEO improvement: ${currentAnalysis.seoScore.percentage}% → ${newAnalysis.seoScore.percentage}% (${improvement > 0 ? '+' + improvement : improvement} points)`));
      console.log(chalk.blue(`🎯 Grade improvement: ${currentAnalysis.seoScore.grade} → ${newAnalysis.seoScore.grade}`));
      console.log(chalk.blue(`📝 Word count: ${improvedResult.metadata.wordCount}`));
      console.log(chalk.blue(`🔑 Keyword density: ${newAnalysis.analysis.keywordAnalysis.primary.density.toFixed(1)}%`));
      console.log(chalk.blue(`📖 Readability: ${newAnalysis.analysis.readability.grade}`));
      
      // Show remaining suggestions if any
      if (newAnalysis.suggestions.length > 0) {
        console.log(chalk.yellow('\n💡 Remaining optimization opportunities:'));
        newAnalysis.suggestions.forEach((suggestion, index) => {
          const priority = suggestion.priority === 'high' ? chalk.red('HIGH') : 
                          suggestion.priority === 'medium' ? chalk.yellow('MED') : chalk.blue('LOW');
          console.log(`   ${index + 1}. [${priority}] ${suggestion.message}`);
        });
      } else {
        console.log(chalk.green('\n🎉 No remaining SEO issues - content is fully optimized!'));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Rewrite failed: ${error.message}`));
      process.exit(1);
    }
  });




// Parse arguments
program.parse();
