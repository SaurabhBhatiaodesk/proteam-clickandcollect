import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  const { searchParams } = new URL(request.url);
  let shop = searchParams.get("shop");

  const auth_session = await db.session.findFirst({
    where: { shop },
  });
  console.log('auth_session', auth_session);
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Shopify-Access-Token", auth_session?.accessToken);




  const graphql = JSON.stringify({
    query: "query MyQuery {locations(first: 30) {nodes {activatable hasActiveInventory isActive localPickupSettingsV2 { instructions pickupTime } name id address {zip provinceCode province phone longitude latitude formatted countryCode country city address2 address1 } } } }",
    variables: {}
  })
  console.log('query', graphql);
  const requestOptionslocations = {
    method: "POST",
    headers: myHeaders,
    body: graphql,
    redirect: "follow"
  };
  console.log('requestOptionslocations', requestOptionslocations);
  let locationsResult= await fetch(`https://${shop}/admin/api/2024-04/graphql.json`, requestOptionslocations)
  let data=await locationsResult.json();
  console.log("data===>",data);
  return await cors(request, json(data));
}