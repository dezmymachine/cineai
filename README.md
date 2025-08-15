# CineAI - AI-Powered Movie & TV Recommendations

A modern, ChatGPT-like interface for discovering movies and TV shows using natural language queries. Built with Next.js, TypeScript, and powered by TMDB and Google Gemini APIs.

![CineAI Demo](https://res.cloudinary.com/dnemeq7mr/image/upload/v1755217490/zfumxnshbwvqybube3jz.png)

## ✨ Features

- **Natural Language Search**: Describe what you want to watch in plain English
- **ChatGPT-like Interface**: Fixed bottom search bar with scrollable content above
- **Beautiful Movie Cards**: Poster images with rating and media type badges
- **Interactive Details**: Click cards to view detailed information in popovers
- **Direct Streaming Links**: Watch buttons link to moviealtflix.netlify.app
- **Mobile-First Design**: Fully responsive with clean, reduced text sizes
- **AI-Powered**: Uses Google Gemini to understand search intent
- **Real-time Results**: Fast search with TMDB integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- TMDB API account
- Google AI Studio account (for Gemini API)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <your-repo-url>
   cd cineai
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   \`\`\`env
   VITE_TMDB_TOKEN=your_tmdb_bearer_token_here
   VITE_TMDB_API_KEY=your_tmdb_api_key_here
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 API Setup

### TMDB (The Movie Database)

1. Create an account at [TMDB](https://www.themoviedb.org/)
2. Go to Settings → API
3. Request an API key
4. Copy both the API Key and Bearer Token
5. Add them to your `.env.local` file

### Google Gemini AI

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or use existing
3. Generate an API key
4. Add it to your `.env.local` file

## 📁 Project Structure

\`\`\`
├── app/
│   ├── globals.css          # Global styles with Tailwind CSS
│   ├── layout.tsx           # Root layout with fonts
│   └── page.tsx             # Main movie search interface
├── components/
│   └── ui/                  # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       └── dialog.tsx
├── lib/
│   └── utils.ts             # Utility functions
└── public/                  # Static assets
\`\`\`

## 🎯 Usage Examples

### Natural Language Queries

The app understands various types of search queries:

- **Genre-based**: "Recent sci-fi movies"
- **Mood-based**: "Something funny to watch tonight"
- **Era-specific**: "90s comedy series"
- **Detailed**: "Action movies with cars and explosions"
- **Family-friendly**: "Animated movies for kids"

### Search Flow

1. **Enter Query**: Type what you want to watch in natural language
2. **AI Processing**: Gemini AI extracts genres, keywords, and preferences
3. **TMDB Search**: App queries TMDB with extracted parameters
4. **Results Display**: Movies/shows displayed in responsive grid
5. **Details View**: Click any card to see full details
6. **Watch**: Click "Watch Now" to stream on moviealtflix.netlify.app

## 🛠️ Development

### Key Components

- **MovieSearchApp**: Main component handling search logic
- **Movie Cards**: Responsive grid with hover effects
- **Dialog Popovers**: Detailed movie information
- **Search Bar**: Fixed bottom input with loading states

### API Integration

The app uses two main APIs:

1. **TMDB API**: Movie/TV data, genres, keywords
2. **Gemini API**: Natural language processing

### Styling

- **Framework**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Design**: Mobile-first responsive
- **Theme**: Light/dark mode support

### TypeScript Interfaces

\`\`\`typescript
interface Movie {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  release_date?: string
  first_air_date?: string
  overview: string
  vote_average: number
  media_type?: string
}
\`\`\`

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   \`\`\`

2. **Deploy to Vercel**
   - Connect your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy automatically

### Environment Variables in Production

Make sure to add these in your deployment platform:

- `VITE_TMDB_API_TOKEN="your_tmdb_api_token"`
- `VITE_TMDB_API_KEY="your_tmdb_api_key"` 
- `VITE_GEMINI_API_KEY="your_gemini_api_key"`

## 🎨 Customization

### Styling

Modify `app/globals.css` to customize:
- Color scheme
- Typography
- Component styles
- Responsive breakpoints

### Search Logic

Update the Gemini prompt in `extractQueryWithSchema()` to:
- Add new search parameters
- Modify genre mapping
- Enhance keyword extraction

### Movie Cards

Customize card appearance in the main component:
- Badge styles
- Hover effects
- Image sizing
- Information display

## 🔧 Troubleshooting

### Common Issues

1. **API Keys Not Working**
   - Verify keys are correct in `.env.local`
   - Check API quotas and limits
   - Ensure keys have proper permissions

2. **No Search Results**
   - Check TMDB API connectivity
   - Verify Gemini API responses
   - Test with simpler queries

3. **Styling Issues**
   - Clear browser cache
   - Check Tailwind CSS compilation
   - Verify component imports

### Debug Mode

Add console logs to track API calls:

\`\`\`typescript
console.log("[v0] Search query:", userText)
console.log("[v0] Gemini response:", queryParams)
console.log("[v0] TMDB results:", movies)
\`\`\`

## 📱 Mobile Optimization

The app is optimized for mobile with:

- **Touch-friendly**: Large tap targets
- **Responsive Grid**: Adapts to screen size
- **Fixed Search**: Always accessible bottom bar
- **Smooth Scrolling**: Optimized content area
- **Fast Loading**: Optimized images and API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) for movie data
- [Google Gemini](https://ai.google.dev/) for AI processing
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [moviealtflix.netlify.app](https://moviealtflix.netlify.app/) for streaming links

---

**Built with ❤️ using React Router 7 (framework_mode) and AI**
