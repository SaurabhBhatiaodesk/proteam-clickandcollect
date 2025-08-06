import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop, session, admin } = await authenticate.webhook(request);

  if (!admin) {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    throw new Response();
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        const store = await db.userConnection.findFirst({
          where: { shop },
        });
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + store.token);
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
          "email": store.email,
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow"
        };

        await fetch("https://main.dev.saasintegrator.online/api/v1/inactive-connection/"+store.connection_id, requestOptions)
          .then((response) => response.text())
          .then((result) => console.log(result))
          .catch((error) => console.error(error));
        await db.userConnection.deleteMany({ where: { shop } });
        await db.session.deleteMany({ where: { shop } });
      }

      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
