import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

export async function GET() {
  try {
    const dir = join(process.cwd(), "public", "spaceship");
    const files = await readdir(dir, { withFileTypes: true });
    const items = files
      .filter((f) => f.isFile())
      .map((f) => f.name)
      .filter((name) => {
        const dot = name.lastIndexOf(".");
        if (dot < 0) return false;
        return ALLOWED_EXT.has(name.slice(dot).toLowerCase());
      })
      .sort((a, b) => a.localeCompare(b, "vi"))
      .map((name) => ({
        id: name,
        name,
        src: `/spaceship/${name}`,
      }));

    return NextResponse.json({
      items,
      defaultSrc: "/spaceship.png",
    });
  } catch {
    return NextResponse.json({
      items: [],
      defaultSrc: "/spaceship.png",
    });
  }
}
