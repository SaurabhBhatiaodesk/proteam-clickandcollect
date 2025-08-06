import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
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

  return new Response();
};
