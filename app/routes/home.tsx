import type { Route } from "./+types/home";
import MovieSearchApp from "~/components/movies-search";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "MoviesBot" },
    { name: "description", content: "Tell me what you're in the mood for…" },
  ];
}

export default function Home() {
  return <MovieSearchApp />
}
