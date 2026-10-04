import { drills, categoryLabels } from "@/lib/catalog";
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  const difficulty = params.get("difficulty");
  if (
    (type && !Object.hasOwn(categoryLabels, type)) ||
    (difficulty && !/^[1-4]$/.test(difficulty))
  )
    return Response.json({ error: "Invalid filter" }, { status: 400 });
  return Response.json(
    drills.filter(
      (drill) =>
        (!type || drill.drillType === type) &&
        (!difficulty || drill.difficulty === Number(difficulty)),
    ),
  );
}
