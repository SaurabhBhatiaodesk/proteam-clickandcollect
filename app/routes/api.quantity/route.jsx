import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  // const { shop } = await authenticate.webhook(
  //   request
  // );
  // console.log(shop,"shop");
  const { searchParams } = new URL(request.url);
  let shop = searchParams.get("shop");
  // console.log(shop, "shop");

//   const token = await db.session.findFirst({
//     where: { shop },
//   });

  const store = await db.userConnection.findFirst({
    where: { shop },
  });
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer " + store.token);
  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(
      "https://main.dev.saasintegrator.online/api/v1/click_and_collect/config-form",
      requestOptions,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data = await response.json();
    let quantity = 0;
    let kilometer = 50;
    data.config_form.map((item, index) => {
      if (item?.saved_values?.shopify_minimum_pickup_stock_quantity_check=='yes' && item?.saved_values?.shopify_minimum_pickup_stock_quantity_value!='') {
        quantity = item.saved_values?.shopify_minimum_pickup_stock_quantity_value;
      }
      if(item?.saved_values?.shopify_radius_kilometer_for_location_search!='')
      {
        kilometer=item.saved_values?.shopify_radius_kilometer_for_location_search;
      }
    });
    return await cors(request, json({ quantity: quantity,kilometer:kilometer }));
    }
    catch(error) {
        return await cors(request, json({ quantity: 0,kilometer:50 }));
    }
  

  
}  