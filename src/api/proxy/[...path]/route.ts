import { NextResponse } from "next/server";

const UPSTREAM = process.env.UPSTREAM_API_BASE ?? "https://api.savoa.kz/api";

async function handler(req: Request, ctx: { params: { path: string[] } }) {
  const { path } = ctx.params;
  const url = `${UPSTREAM}/${path.join("/")}`;

  // Копируем заголовки (убираем host)
  const headers = new Headers(req.headers);
  headers.delete("host");

  // Важно: не пытайся читать body у GET/HEAD
  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const upstreamRes = await fetch(url, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  // Пробрасываем статус + тело
  const resHeaders = new Headers(upstreamRes.headers);
  // На всякий случай уберём hop-by-hop заголовки (редко, но бывает)
  resHeaders.delete("transfer-encoding");
  resHeaders.delete("content-encoding"); // иногда мешает, если upstream сжимает

  const data = await upstreamRes.arrayBuffer();

  return new NextResponse(data, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;