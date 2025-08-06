# Bloggen CLI - API Reference

## Command Line Interface

### bloggen [topic] [options]
Generate SEO-optimized blog content

**Parameters:**
- `topic` - Blog topic (IT job market focused)

**Options:**
- `-p, --prompt <text>` - Custom prompt for content generation
- `-o, --output <file>` - Output filename (default: auto-generated)

**Examples:**
bloggen "Remote Python developer jobs 2025"
bloggen --prompt "Write about DevOps salary trends"
bloggen "Tech careers" --output "my-post.txt"

text

### bloggen analyze <file> [options]
Analyze SEO quality of existing blog post

**Parameters:**
- `file` - Path to blog post file

**Options:**
- `-k, --keyword <keyword>` - Primary keyword to analyze

**Examples:**
bloggen analyze post.txt --keyword "Python developer"
bloggen analyze blog-post.txt

text

### bloggen rewrite <file> [options]
Rewrite blog post for better SEO optimization

**Parameters:**
- `file` - Path to blog post file to rewrite

**Options:**
- `-k, --keyword <keyword>` - Primary keyword to optimize for
- `-t, --target-score <score>` - Target SEO score (default: 85)
- `-o, --output <filename>` - Output filename for rewritten content

**Examples:**
bloggen rewrite post.txt --keyword "DevOps engineer" --target-score 90
bloggen rewrite old-post.txt --output "improved-post.txt"

text

### bloggen list [options]
List all generated blog posts

**Options:**
- `-d, --dir <directory>` - Directory to list from

**Examples:**
bloggen list
bloggen list --dir "./custom-posts"

text

### bloggen cleanup [options]
Clean up old blog posts

**Options:**
- `-k, --keep <number>` - Number of posts to keep (default: 10)
- `-d, --dir <directory>` - Directory to clean

**Examples:**
bloggen cleanup --keep 5
bloggen cleanup --dir "./old-posts" --keep 3

text

### bloggen info
Show API configuration and model status

**Examples:**
bloggen info

text

## Environment Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `GEMINI_API_KEY` | String | Yes | Your Google Gemini API key |
| `WEBSITE_URL` | String | Yes | Your website URL for backlinking |
| `DEFAULT_OUTPUT_DIR` | String | No | Default directory for generated files |

## Output Format

Generated blog posts include structured metadata and content:

=== BLOG POST METADATA ===
Title: [SEO-optimized title]
Meta Description: [140-160 character description]
Keywords: [Relevant keywords]
Generated: [Timestamp]
Model Used: [AI model name]
Word Count: [Number]
Backlinks Included: [Number]
SEO Score: [Grade (Percentage)]

=== SEO OPTIMIZED CONTENT ===
[Markdown formatted blog content]

=== TECHNICAL DETAILS ===
[Generation information and usage instructions]

text

## SEO Analysis Output

SEO analysis provides comprehensive scoring and suggestions:

{
analysis: {
wordCount: 1500,
keywordAnalysis: {
primary: {
keyword: "Python developer",
count: 12,
density: 2.1,
optimal: true
},
related: [...]
},
headingStructure: {
h1: 1,
h2: 4,
h3: 8,
properStructure: true
},
readability: {
score: 75,
grade: "Good"
}
},
seoScore: {
score: 85,
maxScore: 100,
percentage: 85,
grade: "A"
},
suggestions: [...]
}