import { readFileSync } from "fs";

export async function GET(req: Request, res: Response) {
  try {
    const data = JSON.parse(readFileSync("public/3dplot.json", "utf8"));
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "Error fetching data" }, { status: 500 });
  }
}
