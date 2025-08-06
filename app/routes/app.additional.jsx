import {
  Box,
  Card,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  Form,
  FormLayout,
  TextField,
  Button,
  LegacyCard,
  Layout,
} from "@shopify/polaris";
import { useEffect, useState, useCallback } from "react";
import { useSubmit, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import NotificationBar from "../components/NotificationBar";

export async function loader({ request }) {
  const admin = await authenticate.admin(request);
  const shop = admin.session.shop;
  const searchClass = await db.googleApi.findFirst({
    where: { shop },
  });
  return json({ searchClass });
}



export async function action({ request }) {
  const admin = await authenticate.admin(request);
  const shop = admin.session.shop;
  const body = await request.formData();
  console.log("bodybodybodybodybodybodybodybodybody:::::", body);
  const apikey = body.get("apikey");
  const ipkey = body.get("ipkey");

  console.log("apikeyapikeyapikey",apikey,"ipkeyipkeyipkey",ipkey);

  const existingSearchClass = await db.googleApi.findFirst({
    where: { shop },
  });

  if (!existingSearchClass) {
    await db.googleApi.create({
      data: {
        shop,
        apikey: apikey,
        ipkey: ipkey,
      },
    });
  } else {
    await db.googleApi.updateMany({
      where: { shop },
      data: {
        apikey: apikey,
        ipkey :ipkey,
      },
    });
  }
  return "success";
}



export default function AdditionalPage() {
  const submit = useSubmit();
  const invoices = useLoaderData();

  const prevData = invoices?.searchClass?.apikey;
  const prevD = invoices?.searchClass?.ipkey;
  const [notificationMessage, setNotificationMessage] = useState("");

  
  const [data, setdata] = useState(prevData || "");
  const [ipdata, setipdata] = useState(prevD || "");
  
  const handleSubmit = useCallback(() => {
    console.log("ipdata", ipdata);
    submit({ apikey: data,ipkey:ipdata }, { method: "post" });
    setNotificationMessage("Form submitted successfully");
          setTimeout(() => {
            setNotificationMessage("")
          }, 5000);
  }, [ipdata,data, submit]);

  const handleDataChange = useCallback((value) => setdata(value), []);
  const handleIpDataChange = useCallback((value) => setipdata(value), []);
  const successStyle = {
    background: "#b4fed2",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "1rem",
    width: "100%",
    marginTop: "1rem",
    color: "#0c5132"
  };
  return (
    <Page>
      <Layout>
        <Layout.Section>
          <LegacyCard title="Enter Google Api Key" sectioned>
          {notificationMessage !== "" && (
            <NotificationBar title={notificationMessage} style={successStyle} />
          )}
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                <TextField
                  value={data}
                  onChange={handleDataChange}
                  label="Enter the key for Distance"
                  type="text"
                  autoComplete="off"
                  name="apikey"
                />
                 <TextField
                  value={ipdata}
                  onChange={handleIpDataChange}
                  label="Enter the Key for fetching IP"
                  type="text"
                  autoComplete="off"
                  name="html"
                /> 
                <Button textAlign="center" submit>
                  Save
                </Button>
              </FormLayout>
            </Form>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

