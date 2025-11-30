# Offline Knowledge Interface

A completely offline knowledge interpretation system designed for libraries and
community access. This system encodes knowledge across multiple domains in
visual seed images and provides a ChatGPT-style interface for natural question
answering - all without requiring internet connectivity or external APIs.

## Why This Matters

Libraries and community centers need reliable access to information systems.
This project creates a self-contained knowledge interface that:

- **Works completely offline** - No internet required after installation
- **Runs on local hardware** - No cloud dependencies or API costs
- **Protects privacy** - All interactions stay on your machine
- **Serves communities** - Designed for public library deployment

## Quick Start

```bash
# Install Deno (one-time setup)
# Visit https://deno.land for installation instructions

# Start the knowledge interface server
deno task start

# Visit http://localhost:8000 in your browser
```

## Knowledge Domains

The system encodes information across 9 fundamental domains:

| Domain                        | Keywords                                              |
| ----------------------------- | ----------------------------------------------------- |
| **Science & Nature**          | physics, chemistry, biology, astronomy, nature        |
| **Mathematics & Logic**       | math, algebra, geometry, calculus, logic              |
| **Arts & Literature**         | literature, writing, poetry, art, creative expression |
| **Philosophy & Ethics**       | philosophy, ethics, wisdom, meaning, truth            |
| **History & Culture**         | history, civilization, culture, heritage, tradition   |
| **Psychology & Behavior**     | psychology, mind, behavior, emotion, cognition        |
| **Health & Wellness**         | health, medicine, wellness, fitness, nutrition        |
| **Skills & How-To**           | skills, practical guides, tutorials, techniques       |
| **Understanding & Synthesis** | explanation, connections, insights, integration       |

## How It Works

1. **Visual Encoding**: Knowledge domains are encoded in seed images using
   color, spatial positioning, and patterns
2. **Keyword Projection**: User questions are analyzed and mapped to relevant
   knowledge domains
3. **Concept Sampling**: The system samples from the most relevant image regions
4. **Response Generation**: Natural language responses draw from activated
   knowledge domains
5. **Memory Hypergraph**: Context builds across conversations for coherent
   multi-turn dialogs

## Using the Interface

### Web UI

Visit `http://localhost:8000` after starting the server to:

1. **Ask Questions**: Type natural language questions in any domain
2. **View Knowledge Domains**: See which domains the system is drawing from
3. **Explore Connections**: Watch how questions activate multiple knowledge
   areas
4. **Technical Details**: Toggle detailed view to see the interpretation process

Example questions to try:

- "Explain quantum physics" (Science)
- "What is the meaning of life?" (Philosophy)
- "Tell me about ancient Rome" (History)
- "How do I stay healthy?" (Health & Wellness)
- "Connect art and science" (Synthesis)

### API Endpoints

The server provides REST endpoints for programmatic access:

- `GET /api/seed` - Get knowledge domain summaries
- `POST /api/prompt` - Submit a question and get response
- `GET /api/history` - Retrieve conversation history

## Available Commands

- `deno task start` - Launch the Knowledge Interface web server
- `deno task web` - Launch with file watching for development
- `deno task cli` - Run command-line demo
- `deno task test` - Run tests
- `deno task lint` - Run linter
- `deno task fmt` - Format code

## Customization

### Adjusting Knowledge Domains

Edit `AI_CONCEPT/seed-latent.ts` to modify the `UNIVERSAL_KNOWLEDGE_CONCEPTS`:

- Add new domains by defining concept objects with keywords, descriptions, and
  colors
- Adjust domain weights to emphasize certain knowledge areas
- Modify keyword lists to improve domain matching

### Fine-Tuning Responses

In `AI_CONCEPT/prompt-interface.ts`:

- Customize response generation for different question types
- Adjust domain attribution messages
- Modify the conversational tone and style

### Generating New Seed Images

```bash
deno run --allow-read --allow-write scripts/generate-knowledge-seed.ts
```

This creates visual encodings of the knowledge domains. Customize the generation
script to:

- Change color schemes for better visual distinction
- Adjust spatial layouts for domain relationships
- Add patterns or textures for sub-categories

### Projection Settings

In `AI_CONCEPT/image-projection.ts`:

- `sampleCount` - Number of knowledge points to sample per query
- `conceptSampleSize` - How many domains to consider
- `embeddingDimension` - Vector space dimensionality
- Keyword extraction and stop word filtering

## Library Deployment Guide

This system is designed for public library deployment:

### Hardware Requirements

- **Minimum**: 2GB RAM, dual-core processor
- **Recommended**: 4GB RAM, quad-core processor
- **Storage**: 100MB for system + knowledge images

### Setup for Public Access

1. Install Deno and this system on a dedicated library computer
2. Set browser to auto-open `http://localhost:8000` on startup
3. Configure browser in kiosk mode for public terminals
4. Add to library catalog as "Offline Knowledge Assistant"

### Maintenance

- System runs entirely locally - no internet required after setup
- No user data is collected or stored externally
- Updates can be deployed by replacing the knowledge images
- New domains can be added without changing the core system

### Community Benefits

- **Equal Access**: Works identically whether internet is available or not
- **Privacy**: All interactions stay on local machine
- **Cost Effective**: No API fees or subscription costs
- **Educational**: Demonstrates visual knowledge encoding concepts
- **Customizable**: Libraries can tailor domains to community needs

## Technical Architecture

- **Runtime**: Deno with TypeScript
- **Server**: Standard HTTP server (port 8000)
- **Storage**: PNG images for knowledge encoding
- **State**: In-memory hypergraph (resets on restart)
- **UI**: Vanilla JavaScript, no framework dependencies
- **Offline**: Completely self-contained, no external dependencies

## Project Structure

```
TS-playground/
├── AI_CONCEPT/                 # Knowledge interface core
│   ├── assets/                 # Seed images encoding knowledge
│   ├── image-projection.ts     # Maps questions to knowledge domains
│   ├── memory-hypergraph.ts    # Context and conversation memory
│   ├── prompt-interface.ts     # Natural language response generation
│   └── seed-latent.ts          # Domain definitions and image loading
├── scripts/                    # Utilities
│   └── generate-knowledge-seed.ts  # Generate seed images
├── web/                        # Web interface
│   └── index.html              # ChatGPT-style UI
├── server.ts                   # HTTP server
└── deno.json                   # Configuration and tasks
```

## Development

### VS Code Setup

1. Install the
   [Deno VS Code extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)
2. Open this project in VS Code
3. The workspace is pre-configured for:
   - TypeScript support with type checking
   - Automatic formatting on save
   - Linting on save
   - Code actions on save

### Adding New Knowledge Domains

1. Define the concept in `AI_CONCEPT/seed-latent.ts`:

```typescript
"your-domain": {
  id: "your-domain",
  label: "Your Domain Name",
  description: "What this domain covers",
  keywords: ["key", "words", "for", "matching"],
  color: [R, G, B],  // RGB color values
  region: { xRange: [0, 1], yRange: [0, 1] },
  loopPhase: 0,
  weight: 1.0,
}
```

2. Generate new seed images with updated domains
3. Test with relevant queries

## License

This project is designed for public good and community access. Feel free to use,
modify, and deploy in your community.

## Contributing

This is an experimental system exploring visual knowledge encoding.
Contributions that improve:

- Knowledge domain coverage
- Response quality and naturalness
- Library deployment workflows
- Community accessibility

...are especially welcome.
