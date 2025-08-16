
import type React from "react"
import { useState, useEffect } from "react"
import axios, { type AxiosResponse } from "axios"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent } from "~/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { Search, Play, Star, Calendar, Film, Tv } from "lucide-react"

// TypeScript interfaces
interface Genre {
  id: number
  name: string
}

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
  adult?: boolean
}

interface TMDBGenresResponse {
  genres: Genre[]
}

interface TMDBKeywordSearchResponse {
  results: Array<{
    id: number
    name: string
  }>
}

interface TMDBDiscoverResponse {
  results: Movie[]
  total_results: number
}

interface QueryParams {
  type: "tv" | "movie"
  genres: string[]
  keywords: string[]
  year?: number
}

interface TMDBData {
  genres: Genre[]
  keywords: Record<string, number>
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

export default function MovieSearchApp() {
  const [userText, setUserText] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [movies, setMovies] = useState<Movie[]>([])
  const [error, setError] = useState<string>("")
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Environment variables
  const TMDB_TOKEN = import.meta.env.VITE_TMDB_API_TOKEN
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
  const GEMINI_MODEL = "gemini-2.5-flash-preview-05-20"
  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY

  // State for caching TMDB data
  const [tmdbData, setTmdbData] = useState<TMDBData>({
    genres: [],
    keywords: {},
  })

  // Create axios instance with default config
  const tmdbApi = axios.create({
    baseURL: "https://api.themoviedb.org/3",
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      "Content-Type": "application/json",
    },
  })

  const geminiApi = axios.create({
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    headers: {
      "Content-Type": "application/json",
    },
  })

  const fetchTMDBGenres = async (): Promise<void> => {
    if (!TMDB_TOKEN) {
      setError("TMDB API token is not configured.")
      return
    }

    try {
      const response: AxiosResponse<TMDBGenresResponse> = await tmdbApi.get(`/genre/movie/list?api_key=${TMDB_API_KEY}`)
      setTmdbData((prev) => ({ ...prev, genres: response.data.genres }))
      // console.log("Fetched TMDB genres:", response.data.genres)
    } catch (err) {
      console.error("Error fetching TMDB genres:", err)
      setError("Could not load genre data.")
    }
  }

  const fetchTMDBKeywordId = async (keyword: string): Promise<number | null> => {
    if (tmdbData.keywords[keyword]) {
      return tmdbData.keywords[keyword]
    }

    try {
      const response: AxiosResponse<TMDBKeywordSearchResponse> = await tmdbApi.get(
        `/search/keyword?api_key=${TMDB_API_KEY}`,
        {
          params: { query: keyword },
        },
      )

      if (response.data.results.length > 0) {
        const keywordId = response.data.results[0].id
        setTmdbData((prev) => ({
          ...prev,
          keywords: { ...prev.keywords, [keyword]: keywordId },
        }))
        return keywordId
      }
    } catch (err) {
      console.error(`Error fetching ID for keyword "${keyword}":`, err)
    }
    return null
  }

  const extractQueryWithSchema = async (userText: string): Promise<QueryParams | null> => {
    if (!GEMINI_API_KEY) {
      setError("Gemini API key is not configured.")
      return null
    }

    const validGenres = tmdbData.genres.map(g => g.name).join(", ")

    const prompt = `
      You are a movie and TV show search assistant. Based on the user's sentence,
      identify the type, genres, keywords, and year.
      Only use genres from this exact list: ${validGenres}.
      If no genre matches the list, use an empty array for genres.
      If the user doesn't specify tv or movie, default to "movie".
      Input: "I'm in the mood for a recent action-packed movie with lots of fighting"
      -> {"type":"movie","genres":["Action"],"keywords":["fighting"],"year":2024}
      Input: "Suggest a family-friendly animated series from the 90s"
      -> {"type":"tv","genres":["Animation","Family"],"keywords":["friendly"],"year":1990}
      Input: "Show me some horror films"
      -> {"type":"movie","genres":["Horror"],"keywords":[]}
      Input: "${userText}"
    `

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            type: { type: "STRING", enum: ["tv", "movie"] },
            genres: { type: "ARRAY", items: { type: "STRING" } },
            keywords: { type: "ARRAY", items: { type: "STRING" } },
            year: { type: "NUMBER" },
          },
          required: ["type", "genres", "keywords"],
        },
      },
    }

    try {
      const response: AxiosResponse<GeminiResponse> = await geminiApi.post(
        `/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        payload,
      )

      const jsonText = response.data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!jsonText) {
        throw new Error("Gemini API response was empty or malformed.")
      }
      return JSON.parse(jsonText) as QueryParams
    } catch (err) {
      console.error("Error calling Gemini API:", err)
      setError("Failed to process your request.")
      return null
    }
  }

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!userText.trim()) return

    if (!TMDB_TOKEN || !GEMINI_API_KEY) {
      setError("API keys are not configured.")
      return
    }

    setLoading(true)
    setMovies([])
    setError("")
    setSearchHistory((prev) => [userText, ...prev.slice(0, 4)])

    try {
      const queryParams = await extractQueryWithSchema(userText)
      if (!queryParams) {
        setLoading(false)
        return
      }

      const { type, genres, keywords } = queryParams

      const genreIds = genres
        .map((g) => {
          const genre = tmdbData.genres.find((tmdbG) => tmdbG.name.toLowerCase() === g.toLowerCase())
          return genre ? genre.id : null
        })
        .filter((id): id is number => id !== null)
        .join(",")

      const keywordPromises = keywords.map((kw) => fetchTMDBKeywordId(kw))
      const keywordResults = await Promise.all(keywordPromises)
      const keywordIds = keywordResults.filter((id): id is number => id !== null).join(",")

      const params: Record<string, string> = {
        sort_by: "popularity.desc",
        ...(genreIds && { with_genres: genreIds }),
        ...(keywordIds && { with_keywords: keywordIds }),
      }

      if (type === "movie") {
        params.include_adult = "false"
      }

      const response: AxiosResponse<TMDBDiscoverResponse> = await tmdbApi.get(
        `/discover/${type}?api_key=${TMDB_API_KEY}`,
        {
          params,
        },
      )

      let results = response.data.results
      if (type === "movie") {
        results = results.filter((movie) => !movie.adult)
      }

      const moviesWithType = results.slice(0, 50).map((movie) => ({
        ...movie,
        media_type: type,
      }))

      setMovies(moviesWithType)
      if (moviesWithType.length === 0) {
        setError("No results found. Try a different search.")
      }
    } catch (err) {
      console.error("Search failed:", err)
      setError("Search failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getPlayUrl = (movie: Movie) => {
    const baseUrl = "https://moviealtflix.netlify.app"
    const mediaType = movie.media_type || (movie.title ? "movie" : "tv")
    return `${baseUrl}/${mediaType}/${movie.id}`
  }

  const handleGenreClick = (genreName: string) => {
    setUserText((prev) => {
      if (!prev) return genreName
      if (prev.toLowerCase().includes(genreName.toLowerCase())) return prev
      return `${prev}, ${genreName}`
    })
  }

  useEffect(() => {
    fetchTMDBGenres()
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">CineAI</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">AI-powered movie & TV recommendations</p>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-20 sm:pb-24">
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
          {/* Welcome State */}
          {!loading && movies.length === 0 && !error && (
            <div className="text-center py-12 sm:py-16">
              <div className="text-4xl sm:text-6xl mb-4">🎬</div>
              <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2">What would you like to watch?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Describe what you're in the mood for and I'll find the perfect match
              </p>

              {/* Example searches */}
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto mb-6">
                {["Recent sci-fi movies", "90s comedy series", "Action movies with cars"].map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                    onClick={() => setUserText(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>

              {/* Genre selection buttons */}
              {tmdbData.genres.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2 text-foreground">Choose a genre to get started</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {tmdbData.genres.map((genre) => (
                      <Button
                        key={genre.id}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleGenreClick(genre.name)}
                      >
                        {genre.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm text-muted-foreground">Searching for recommendations...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg text-center text-sm mb-4">
              {error}
            </div>
          )}

          {/* Results Grid */}
          {!loading && movies.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Search className="w-4 h-4" />
                <span>Found {movies.length} recommendations</span>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {movies.map((movie) => (
                  <Dialog key={movie.id}>
                    <DialogTrigger asChild>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow group p-0">
                        <CardContent className="p-0">
                          <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                            <img
                              src={
                                movie.poster_path
                                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                                  : "https://placehold.co/300x450/1f2937/d1d5db?text=No+Image"
                              }
                              alt={movie.title || movie.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />

                            {/* Rating Badge */}
                            <div className="absolute top-2 right-2">
                              <Badge
                                variant="secondary"
                                className="text-xs px-1.5 py-0.5 bg-black/70 text-white border-0"
                              >
                                <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                {movie.vote_average.toFixed(1)}
                              </Badge>
                            </div>

                            {/* Media Type Badge */}
                            <div className="absolute top-2 left-2">
                              <Badge
                                variant="secondary"
                                className="text-xs px-1.5 py-0.5 bg-black/70 text-white border-0"
                              >
                                {movie.media_type === "tv" ? (
                                  <>
                                    <Tv className="w-3 h-3 mr-1" />
                                    TV
                                  </>
                                ) : (
                                  <>
                                    <Film className="w-3 h-3 mr-1" />
                                    Movie
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>

                          <div className="p-2 sm:p-3">
                            <h3 className="font-medium text-xs sm:text-sm line-clamp-2 text-foreground">
                              {movie.title || movie.name}
                            </h3>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>

                    <DialogContent className="max-w-md mx-auto">
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg line-clamp-2">
                          {movie.title || movie.name}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {movie.vote_average.toFixed(1)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {movie.release_date || movie.first_air_date || "N/A"}
                          </div>
                          <div className="flex items-center gap-1">
                            {movie.media_type === "tv" ? (
                              <>
                                <Tv className="w-4 h-4" />
                                TV Show
                              </>
                            ) : (
                              <>
                                <Film className="w-4 h-4" />
                                Movie
                              </>
                            )}
                          </div>
                        </div>

                        {movie.overview && (
                          <p className="text-sm text-muted-foreground line-clamp-4">{movie.overview}</p>
                        )}

                        <Button className="w-full" size="sm" onClick={() => window.open(getPlayUrl(movie), "_blank")}>
                          <Play className="w-4 h-4 mr-2" />
                          Watch Now
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Search Bar */}
      <div className="fixed bottom-0 left-0 w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="Describe what you want to watch..."
                className="text-base" // Increased font size to prevent iOS zoom on focus
                disabled={loading}
              />
            </div>
            <Button type="submit" size="sm" disabled={loading || !userText.trim()} className="px-3">
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
