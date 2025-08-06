text
# Bloggen CLI - AI-Powered IT Job Market Blog Generator

🤖 **AI-powered CLI tool for generating SEO-optimized IT job market blog posts with comprehensive analysis and optimization features.**

![Bloggen CLI Banner](https://via.placeholder.com/800x200/2563eb/ffffff?text=Bloggen+CLI+-+AI+Blog+Generator)

## ✨ Features

- **🚀 AI Content Generation** - Uses Google Gemini Flash models with automatic fallback
- **📊 SEO Optimization** - Comprehensive analysis with A+ to F grading system
- **🔄 Content Rewriting** - Intelligent rewriting based on SEO analysis
- **📁 File Management** - Organized output with metadata and timestamps
- **🎯 IT Job Market Focus** - Specialized for tech career and job market content
- **🔗 Backlink Integration** - Natural integration of your website links
- **📈 Performance Analytics** - Word count, keyword density, readability scoring

## 🚀 Quick Start

### Installation

Clone the repository
git clone <repository-url>
cd bloggen-cli

Install dependencies
npm install

Set up environment variables
cp .env.example .env

Edit .env with your API key and website URL
Make CLI executable (optional)
chmod +x bin/bloggen.js

Link globally (optional)
npm link

text

### Environment Setup

Create a `.env` file in the project root:

GEMINI_API_KEY=your_actual_gemini_api_key_here
WEBSITE_URL=https://yoursite.com
DEFAULT_OUTPUT_DIR=./blog-posts

text

### Basic Usage

Generate a blog post
node bin/bloggen.js "Remote Python developer jobs 2025"

Or if linked globally
bloggen "Remote Python developer jobs 2025"

text

## 📋 Commands

### Content Generation
Basic generation
bloggen "JavaScript developer career paths"

Custom prompt
bloggen --prompt "Write about DevOps salary trends in major tech hubs"

Specify output file
bloggen "Tech interview tips" --output "interview-guide.txt"

text

### SEO Analysis
Analyze existing content
bloggen analyze filename.txt --keyword "Python developer"

Analyze with different keyword
bloggen analyze post.txt --keyword "remote developer"

text

### Content Optimization
Rewrite for better SEO (targets 85% score)
bloggen rewrite filename.txt

Set specific target and keyword
bloggen rewrite filename.txt --keyword "DevOps engineer" --target-score 90

Custom output filename
bloggen rewrite filename.txt --output "improved-post.txt"

text

### File Management
List all generated posts
bloggen list

Clean up old posts (keep last 10)
bloggen cleanup

Keep specific number of posts
bloggen cleanup --keep 5

text

### Information
Show configuration and status
bloggen info

Show help
bloggen --help

text

## 📊 SEO Features

### Comprehensive Analysis
- **Word Count Optimization** - Targets 1200-1800 words
- **Keyword Density Analysis** - Maintains 1-3% optimal density
- **Heading Structure** - Proper H1/H2/H3 hierarchy
- **Readability Scoring** - Flesch reading ease metrics
- **Internal Link Analysis** - Natural backlink integration

### SEO Grading System
- **A+** (90-100%) - Exceptional optimization
- **A** (80-89%) - Excellent SEO quality
- **B** (70-79%) - Good optimization
- **C** (60-69%) - Fair, needs improvement
- **D** (50-59%) - Poor optimization
- **F** (<50%) - Requires major improvements

### Meta Tag Generation
- **Title Optimization** - SEO-friendly titles with keywords
- **Meta Descriptions** - Compelling 140-160 character descriptions
- **Keywords** - Relevant IT job market keywords
- **Schema Markup** - JSON-LD for rich search results
- **Social Media Tags** - Open Graph and Twitter Card optimization

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes |
| `WEBSITE_URL` | Your website URL for backlinking | Yes |
| `DEFAULT_OUTPUT_DIR` | Default directory for generated files | No |

### Getting Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

## 📁 Output Structure

Generated files include:
=== BLOG POST METADATA ===
Title: SEO-optimized title
Meta Description: Compelling description
Keywords: Relevant keywords
Generated: Timestamp
Model Used: gemini-2.5-flash
Word Count: 1500
SEO Score: A (85%)

=== SEO OPTIMIZED CONTENT ===
[Your blog content in markdown format]

=== TECHNICAL DETAILS ===

Generator: Bloggen CLI v1.0.0

Target: IT Job Market Blog

Format: SEO-optimized Markdown

Ready for: WordPress, Ghost, Static Sites

text

## 🎯 Use Cases

- **Content Marketing** - Generate regular IT job market insights
- **SEO Blogging** - Create search-optimized technical content
- **Career Websites** - Automated job market analysis posts
- **Tech Recruiting** - Industry trend and salary analysis
- **Developer Blogs** - Programming career guidance content

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](repository-issues-url)
- **Documentation**: [Full Documentation](documentation-url)
- **Email**: your-email@example.com

## 🏆 Acknowledgments

- **Google Gemini AI** - For powerful content generation
- **Commander.js** - For CLI framework
- **Chalk** - For terminal styling
- **Ora** - For loading spinners

---

**Made with ❤️ for the IT community**