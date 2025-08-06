import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const productId = url.searchParams.get("product_id");

    const token = await db.session.findFirst({
      where: { shop },
    });

    if (!token) {
      throw new Error("Shop token not found");
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("X-Shopify-Access-Token", token.accessToken);

    const graphql = JSON.stringify({
      query : `query MyQuery { product(id: "gid://shopify/Product/${productId}") { tags title tracksInventory collections(first: 10) { nodes { id title handle } } variants(first: 10) { nodes { inventoryItem { inventoryLevels(first: 10) { edges { node { location { activatable name } id quantities(names: "available") { name id quantity } } } } } id } } } }`
      ,
      variables: {}
    });

    console.log('query', graphql);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: graphql,
      redirect: "follow"
    };

    let response = await fetch(`https://${shop}/admin/api/2024-04/graphql.json`, requestOptions);

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status ${response.status}`);
    }

    let graphQLData = await response.json();
      console.log(graphQLData);
    if (!graphQLData.data) {
      throw new Error("Invalid GraphQL response structure");
    }

    const store = await db.userConnection.findFirst({
      where: { shop },
    });

    if (!store) {
      throw new Error("Store connection not found");
    }

    const myHeadersqty = new Headers();
    myHeadersqty.append("Authorization", "Bearer " + store.token);

    const requestOptionsqty = {
      method: "GET",
      headers: myHeadersqty,
      redirect: "follow",
    };

    try {
      const responseQty = await fetch(
        "https://main.dev.saasintegrator.online/api/v1/click_and_collect/config-form",
        requestOptionsqty,
      );

      if (!responseQty.ok) {
        throw new Error(`Quantity request failed with status ${responseQty.status}`);
      }

      let dataQty = await responseQty.json();

      if (!Array.isArray(dataQty.config_form)) {
        throw new Error("Invalid quantity response structure");
      }

      let quantity = 0;
      let kilometer = 50;

      dataQty.config_form.forEach(item => {
        if (item?.saved_values?.shopify_minimum_pickup_stock_quantity_check === 'yes' &&
            item?.saved_values?.shopify_minimum_pickup_stock_quantity_value !== '') {
          quantity = item.saved_values.shopify_minimum_pickup_stock_quantity_value;
        }
        if (item?.saved_values?.shopify_radius_kilometer_for_location_search !== '') {
          kilometer = item.saved_values.shopify_radius_kilometer_for_location_search;
        }
      });

      console.log("Final Kilometer Value:", kilometer);

      const newData = { ...graphQLData.data, quantity, kilometer };
      console.log("New Data:", newData);

      return cors(request, json({ data: newData }));

    } catch (error) {
      console.error("Error fetching quantity data:", error);
      return cors(request, json({ error: "Quantity fetch failed", data: { ...graphQLData.data, quantity: 0, kilometer: 50 } }));
    }

  } catch (error) {
    console.error("Error fetching inventory locations:", error);
    return cors(request, json({ error: "500" }));
  }
}
