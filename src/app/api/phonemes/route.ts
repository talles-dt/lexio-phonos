import { phonemes } from "@/lib/catalog";
export function GET() {
  return Response.json(phonemes);
}
