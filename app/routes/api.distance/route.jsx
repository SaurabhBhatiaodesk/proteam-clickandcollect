import { json } from "@remix-run/node";
import db from "../../db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  try {
    const { searchParams } = new URL(request.url);
    let shop = searchParams.get("shop");
    let customerlocation = searchParams.get("customerlocation");

    const apiKey1 = await db.googleApi.findFirst({
      where: { shop },
    });
    const auth_session = await db.session.findFirst({
      where: { shop },
    });

    if (!auth_session || !apiKey1) {
      throw new Error("Missing authentication or API key");
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("X-Shopify-Access-Token", auth_session?.accessToken);

    console.log('apiKey:', apiKey1?.apikey);

    const graphql = JSON.stringify({
      query: "query MyQuery { locations(first: 30) { nodes { activatable hasActiveInventory isActive localPickupSettingsV2 { instructions pickupTime } name id address { zip provinceCode province phone longitude latitude formatted countryCode country city address2 address1 } } } }",
      variables: {}
    });

    console.log('GraphQL Query:', graphql);

    const requestOptionslocations = {
      method: "POST",
      headers: myHeaders,
      body: graphql,
      redirect: "follow"
    };

    let locationsResult = await fetch(`https://${shop}/admin/api/2024-04/graphql.json`, requestOptionslocations);

    console.log("locationsResult===>",locationsResult)
    if (!locationsResult.ok) {
      throw new Error(`Locations request failed with status ${locationsResult.status}`);
    }

    let testres = await locationsResult.json();
    console.log("testres===>",testres?.data?.locations?.nodes);
    const destinationsArr = [];

    if (testres?.data?.locations?.nodes?.length > 0) {
      const locations = testres?.data?.locations?.nodes;
      locations.forEach(location => {
        if (location.address?.zip && location?.localPickupSettingsV2 != null) {
          destinationsArr.push(`${location.address?.address1} ${location.address?.city} ${location.address?.zip} ${location.address?.province} ${location.address?.country}`);
        }
      });
    }

    console.log('destinationsArr:', destinationsArr);

    if (destinationsArr.length === 0) {
      throw new Error("No valid destinations found");
    }
    const haveResult = await db.googleData.findFirst({
      where: { 
        shop,
        customerlocation,
        destinationsArr:destinationsArr.join("|"),
        apikey:apiKey1.apikey
       },
    });
    let data;
    if(!haveResult || haveResult.length === 0) {
      const mapUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${customerlocation}&destinations=${destinationsArr.join("|")}&key=${apiKey1.apikey}`;
      console.log('Google Maps API URL:', mapUrl);

      const response = await fetch(mapUrl, { method: "GET", redirect: "follow" });

      if (!response.ok) {
        throw new Error(`Google Maps API request failed with status ${response.status}`);
      }

       data = await response.json();
      console.log('Google Maps API Response:', data);
      console.log({"shop":shop, "customerlocation":customerlocation,"destinationsArr": destinationsArr.join("|"),"apikey": apiKey1.apikey,"resultsArr": JSON.stringify(data)});
     let result= await db.googleData.create({data: {"shop":shop, "customerlocation":customerlocation,"destinationsArr": destinationsArr.join("|"),"apikey": apiKey1.apikey,"resultsArr": JSON.stringify(data)}});
    console.log('Created record:', result);
    }
    else{
      data = JSON.parse(haveResult?.resultsArr);
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


    const config = await fetch(
      "https://main.dev.saasintegrator.online/api/v1/click_and_collect/config-form",
      requestOptionsqty
    );

    if (!config.ok) {
      throw new Error(`Config request failed with status ${config.status}`);
    }

    let kilo = await config.json();
    let quantity = 0;
    let kilometer = 50*1000;

    kilo.config_form.forEach(item => {
      console.log('Processing config item:', item);

      if (item?.saved_values?.shopify_minimum_pickup_stock_quantity_check === 'yes' &&
          item?.saved_values?.shopify_minimum_pickup_stock_quantity_value !== '') {
        quantity = item.saved_values.shopify_minimum_pickup_stock_quantity_value;
      }

      if (item?.saved_values?.shopify_radius_kilometer_for_location_search !== 'undefined' && item?.saved_values?.shopify_radius_kilometer_for_location_search >0) {
        kilometer = item.saved_values.shopify_radius_kilometer_for_location_search*1000;
      }
    });

    const newdata = { ...data, quantity, kilometer };
    console.log("Final Data:", newdata);

    return await cors(request, json(newdata));

  } catch (error) {
    console.error("Error in loader function:", error);
    return json({ error: error.message }, { status: 500 });
  }
}
