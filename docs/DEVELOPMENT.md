# Bloggen CLI - Development Documentation

## 🏗️ Architecture Overview

Bloggen CLI is built with a modular architecture designed for scalability and maintainability. The tool consists of four main components working together to provide comprehensive blog generation and optimization capabilities.

## 📐 System Architecture

┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│ CLI Interface │ │ Content Generator│ │ SEO Optimizer │
│ (bin/bloggen.js)│────┤(src/content-gen.js)├────┤ (src/seo-opt.js)│
└─────────────────┘ └──────────────────┘ └─────────────────┘
│ │ │
└────────────────────────┼────────────────────────┘
│
┌─────────────────┐
│ File Manager │
│(src/file-mgr.js)│
└─────────────────┘

text

## 🧩 Component Details

### 1. CLI Interface (`bin/bloggen.js`)
**Purpose**: Main entry point for user interaction and command processing

**Key Features**:
- Command parsing using Commander.js
- User input validation and error handling
- Progress indicators with Ora spinners
- Colored terminal output with Chalk
- Environment variable management

**Commands Implemented**:
- `generate` - Create new blog posts
- `analyze` - SEO analysis of existing content
- `rewrite` - Improve content based on SEO analysis
- `list` - Show all generated posts
- `cleanup` - Manage old files
- `info` - Configuration status

### 2. Content Generator (`src/content-generator.js`)
**Purpose**: AI-powered content generation with Gemini API integration

**Key Features**:
- **Multi-Model Fallback System**: 
  - Primary: `gemini-2.5-flash`
  - Secondary: `gemini-2.5-flash-lite`
  - Tertiary: `gemini-2.0-flash`
  - Quaternary: `gemini-2.0-flash-lite`
  - Backup: `gemini-1.5-flash`
  - Final: `gemini-1.5-flash-8b`

- **Specialized Prompt Engineering**:
  - IT job market focused prompts
  - SEO optimization instructions
  - Current date context integration
  - Natural backlink integration

- **Error Handling**:
  - API quota management
  - Rate limiting handling
  - Model availability checks
  - Network error recovery

### 3. SEO Optimizer (`src/seo-optimizer.js`)
**Purpose**: Comprehensive SEO analysis and content optimization

**Analysis Components**:

#### Keyword Analysis
- **Primary keyword density** (target: 1-3%)
- **Related keyword detection** from IT terminology
- **Long-tail keyword opportunities**
- **Keyword variation generation**

#### Content Structure Analysis
- **Heading hierarchy** (H1/H2/H3 structure)
- **Paragraph distribution** and length
- **List usage** for readability
- **Content organization** scoring

#### Readability Metrics
- **Average words per sentence**
- **Complex word percentage** (7+ characters)
- **Flesch reading ease** approximation
- **Grade level assessment**

#### SEO Scoring Algorithm
totalScore = (
wordCountScore * 0.25 + // 25%
keywordOptimization * 0.25 + // 25%
headingStructure * 0.25 + // 25%
readabilityScore * 0.25 // 25%
)

text

#### Meta Tag Generation
- **Title optimization** with keyword integration
- **Meta description** creation (140-160 chars)
- **Keyword extraction** from content
- **Schema markup** for rich snippets
- **Social media tags** (Open Graph, Twitter Cards)

### 4. File Manager (`src/file-manager.js`)
**Purpose**: File operations, organization, and output formatting

**Key Features**:
- **Structured output formatting** with metadata
- **Timestamp-based file naming**
- **Directory management** and organization
- **File statistics** and analysis
- **Cleanup utilities** for maintenance

**Output Structure**:
blog-posts/
├── 2025-01-08-14-30-45-topic-slug.txt
├── 2025-01-08-14-32-12-another-topic.txt
└── improved-versions/
└── 2025-01-08-14-30-45-topic-slug-improved.txt

text

## 🔄 Development Workflow

### 1. Content Generation Flow
graph TD
A[User Input] --> B[Input Validation]
B --> C[API Key Check]
C --> D[Prompt Building]
D --> E[Model Selection]
E --> F{API Call}
F -->|Success| G[Content Processing]
F -->|Failure| H[Try Next Model]
H --> F
G --> I[SEO Analysis]
I --> J[File Creation]
J --> K[User Feedback]

text

### 2. SEO Analysis Flow
graph TD
A[Content Input] --> B[Word Count Analysis]
B --> C[Keyword Analysis]
C --> D[Structure Analysis]
D --> E[Readability Check]
E --> F[Score Calculation]
F --> G[Suggestions Generation]
G --> H[Report Output]

text

### 3. Rewrite Optimization Flow
graph TD
A[Existing Content] --> B[Current SEO Analysis]
B --> C[Issue Identification]
C --> D[Improvement Prompt Generation]
D --> E[AI Rewriting]
E --> F[New SEO Analysis]
F --> G[Comparison Report]
G --> H[Enhanced File Output]

text

## 🛠️ Technical Implementation

### Dependencies
{
"dependencies": {
"commander": "^11.0.0", // CLI framework
"@google/generative-ai": "^0.2.0", // Gemini AI SDK
"chalk": "^4.1.2", // Terminal styling
"ora": "^5.4.1", // Loading spinners
"fs-extra": "^11.1.0", // Enhanced file operations
"dotenv": "^16.3.0" // Environment variables
}
}

text

### Environment Configuration
// .env structure
GEMINI_API_KEY=your_gemini_api_key_here
WEBSITE_URL=https://yoursite.com
DEFAULT_OUTPUT_DIR=./blog-posts

text

### Error Handling Strategy

#### API Error Management
// Multi-level error handling
try {
result = await model.generateContent(prompt);
} catch (error) {
if (error.includes('QUOTA_EXCEEDED')) {
// Try next model
} else if (error.includes('RATE_LIMIT')) {
// Wait and retry
} else {
// Fallback to next model
}
}

text

#### File System Error Handling
// Safe file operations
try {
await fs.writeFile(filepath, content);
} catch (error) {
await fs.ensureDir(path.dirname(filepath));
await fs.writeFile(filepath, content);
}

text

## 🧪 Testing Strategy

### Manual Testing Commands
Test basic generation
node bin/bloggen.js "Test topic"

Test SEO analysis
node bin/bloggen.js analyze test-file.txt --keyword "test"

Test rewrite functionality
node bin/bloggen.js rewrite test-file.txt --target-score 90

Test file management
node bin/bloggen.js list
node bin/bloggen.js cleanup --keep 3

text

### Error Scenario Testing
1. **Invalid API key** - Test error handling
2. **Network connectivity** - Test retry mechanisms
3. **File permission issues** - Test directory creation
4. **Invalid file paths** - Test validation
5. **Model unavailability** - Test fallback system

## 🔧 Customization Guide

### Adding New Commands
// In bin/bloggen.js
program
.command('newcommand <param>')
.description('Description of new command')
.option('-o, --option <value>', 'Option description')
.action(async (param, options) => {
// Command implementation
});

text

### Adding New AI Models
// In src/content-generator.js
this.flashModels = [
'gemini-2.5-flash',
'your-new-model', // Add here
'gemini-2.0-flash'
// ... existing models
];

text

### Customizing SEO Scoring
// In src/seo-optimizer.js
calculateSEOScore(analysis) {
// Modify weights and calculations
const wordCountWeight = 0.30; // Increase word count importance
const keywordWeight = 0.25; // Adjust keyword importance
const structureWeight = 0.25; // Modify structure weight
const readabilityWeight = 0.20; // Adjust readability weight
}

text

## 📈 Performance Optimization

### API Optimization
- **Model fallback system** reduces failures
- **Request batching** for multiple operations
- **Caching** for repeated analyses
- **Rate limiting** compliance

### File System Optimization
- **Async file operations** for better performance
- **Streaming** for large files
- **Batch operations** for cleanup
- **Directory organization** for faster access

## 🚀 Deployment Considerations

### Production Setup
Environment configuration
NODE_ENV=production
GEMINI_API_KEY=production_key
WEBSITE_URL=https://production-site.com

File permissions
chmod +x bin/bloggen.js

Global installation
npm link

text

### Security Best Practices
1. **Environment variables** for sensitive data
2. **Input validation** for all user inputs
3. **File path sanitization** to prevent directory traversal
4. **API key rotation** for production use

## 🔄 Future Development Roadmap

### Phase 1: Core Enhancements
- [ ] WordPress API integration for direct publishing
- [ ] Batch processing for multiple topics
- [ ] Template system for different content types
- [ ] Advanced analytics dashboard

### Phase 2: Platform Expansion
- [ ] Web interface development
- [ ] API service for programmatic access
- [ ] Mobile app companion
- [ ] Team collaboration features

### Phase 3: Advanced Features
- [ ] Machine learning for content optimization
- [ ] Multi-language support
- [ ] Custom AI model training
- [ ] Enterprise features and SSO

## 💡 Contributing Guidelines

### Code Style
- Use **ESLint** for code linting
- Follow **async/await** pattern
- Implement **comprehensive error handling**
- Add **JSDoc comments** for functions
- Use **meaningful variable names**

### Testing Requirements
- Test all new commands manually
- Verify error scenarios
- Check file operations
- Validate API integrations
- Document test cases

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request with detailed description

## 📚 Additional Resources

- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Commander.js Documentation](https://github.com/tj/commander.js)
- [Node.js File System API](https://nodejs.org/api/fs.html)
- [SEO Best Practices Guide](https://developers.google.com/search/docs)

---

**This documentation serves as a complete guide for understanding, maintaining, and extending the Bloggen CLI tool.**