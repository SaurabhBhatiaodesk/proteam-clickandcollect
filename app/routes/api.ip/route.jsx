import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  const { searchParams } = new URL(request.url);
  let shop = searchParams.get("shop");
  const apiKey1 = await db.googleApi.findFirst({
    where: { shop },
  });
   // const accessToken = '7a1891347cf4af'; 
    const accessToken = apiKey1?.ipkey;
    const response = await fetch(`https://ipinfo.io/json?token=${accessToken}`);
    const data = await response.json();
    return await cors(request, json({ "data": data}));  
}  