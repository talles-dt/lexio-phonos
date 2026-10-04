export function retiredApi() {
  return Response.json(
    {
      error:
        "This endpoint is retired. Recordings and practice history now stay in your browser. No data was read or changed.",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
