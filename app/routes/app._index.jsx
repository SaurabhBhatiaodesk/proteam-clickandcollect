import React, { useState, useCallback, useEffect } from "react";
import { Spinner, LegacyCard, Icon, Card, Layout, Page, Text, Button, ButtonGroup, TextField, Select, RadioButton, FormLayout, ActionList, Badge,InlineStack } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { ChevronRightIcon,CheckIcon } from "@shopify/polaris-icons";
import NotificationBar from "../components/NotificationBar";
import RadioGroupComponent from "../components/radioGroupComponent";
import TextFieldComponent from "../components/textFieldComponent";
import SelectComponent from "../components/selectComponent";
import MAPPING from "../components/MAPPING";

// Handles form submission
export const action = async ({ request }) => {
  const formData = await request.formData();
  console.log("ffoorrmmddatataq", formData);

  for (const [key, value] of formData.entries()) {
    console.log(`Key: ${key}, Value: ${value}`);
  }

  formData.forEach((value, key) => {
    console.log(`Key: ${key}, Value: ${value}`);
  });

  const name = formData.get("visitorsName");
  return json({ message: `Hello, ${name}` });
};

// Fetches data for the form
export const loader = async ({ request }) => {
  try {
    const admin = await authenticate.admin(request);
    const shop = admin.session.shop;

    // Fetch session information for the shop
    const auth = await db.session.findFirst({
      where: { shop },
    });

    if (!auth) {
      throw new Error("Session information not found for the shop.");
    }

    // Fetch user connection information
    let store = await db.userConnection.findFirst({
      where: { shop },
    });

    if (!store) {
      await getAuthToken(admin.session);
       store = await db.userConnection.findFirst({
        where: { shop },
      });
      //throw new Error("User connection information not found for the shop.");
    }

    console.log("Store Data:", store);

    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + store.token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    // Fetch credential form
    const response = await fetch(
      "https://main.dev.saasintegrator.online/api/v1/credential-form",
      requestOptions
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch credential form. Status: ${response.status}`);
    }

    let data = await response.json();

    // Modify data based on auth information
    data.plugin_form.forEach((item, index) => {
      if (item?.fields?.base_url) {
        data.plugin_form[index].fields.base_url.value = "https://" + auth.shop;
        data.plugin_form[index].fields.base_url.type = "text";
      }
      if (item?.fields?.token) {
        data.plugin_form[index].fields.token.value = auth.accessToken;
        data.plugin_form[index].fields.token.type = "text";
      }
    });

    // Fetch menu form
    const formResponse = await fetch(
      "https://main.dev.saasintegrator.online/api/v1/menus",
      requestOptions
    );

    if (!formResponse.ok) {
      throw new Error(`Failed to fetch menus. Status: ${formResponse.status}`);
    }

    const form_data = await formResponse.json();
    console.log("Form Data:", form_data);

    // Fetch user connection data
    const connectionResponse = await fetch(
      `https://main.dev.saasintegrator.online/api/v1/user-connection?email=${store.email}`,
      requestOptions
    );

    if (!connectionResponse.ok) {
      throw new Error(`Failed to fetch user connection. Status: ${connectionResponse.status}`);
    }

    const user = await connectionResponse.json();
    const user_data = user.connection.find(u => u.uid === store.uid);

    if (!user_data) {
      throw new Error("User data not found for the specified UID.");
    }

    console.log("User Data:", user_data);

    // Return the fetched and processed data
    return {
      form: form_data,
      data: data,
      auth: auth,
      store: store,
      user_data: user_data
    };

  } catch (error) {
    console.error("Error in loader function:", error);
    throw new Error("An error occurred while loading the data.");
  }
};
async function getAuthToken(session) {
  console.log("getAuthToken ------------------->");

  try {
    console.log(session, 'session');
    const myHeaders2 = new Headers();
    myHeaders2.append("X-Shopify-Access-Token", session.accessToken);

    const requestOptions2 = {
      method: "GET",
      headers: myHeaders2,
      redirect: "follow"
    };

    const response = await fetch('https://' + session.shop + "/admin/api/2024-04/shop.json", requestOptions2);
    const result = await response.json();
    console.log(result, 'result');

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const requestOpt = {
      method: "GET",
      redirect: "follow"
    };

    const pluginResponse = await fetch("https://main.dev.saasintegrator.online/api/v1/platforms", requestOpt);
    console.log(pluginResponse, "::plugin");

    const plugin_data = await pluginResponse.json();
    console.log(plugin_data, "::plugin_data");

    const filter_data = plugin_data.platforms.filter(pd =>
      pd.name === "o360-retail-express" || pd.name === "o360-shopify"
    );
    console.log(filter_data, "::filter_data");

    const plugin_ids = filter_data.map(fd => fd.id);

    const raw = JSON.stringify({
      ...session,
      "state": session?.state.trim() !== "" ? session?.state : null,
      'email': result.shop?.email,
      "plugin_ids": plugin_ids
    });
    console.log('testing ', raw);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    const email = result.shop?.email;

    const userConnectionResponse = await fetch("https://main.dev.saasintegrator.online/api/v1/user-connection", requestOptions);
    const userConnectionResult = await userConnectionResponse.json();

    console.log('testing result', userConnectionResult);

    const data = {
      shop: session.shop,
      ...userConnectionResult.data.connection,
      token: userConnectionResult?.data?.token,
      email: email
    };
    console.log('testings ', data);

    const userUpdateResult = await createOrUpdateUserConnection(data);
    console.log("User connection created or updated:", userUpdateResult);

  } catch (error) {
    console.log('error', error);
  }
}


async function createOrUpdateUserConnection(data) {
// console.log('createOrUpdateUserConnection ',data)
const existingUserConnection = await db.userConnection.findFirst({
  where: {
      shop: data.shop,
  },
});

if (existingUserConnection) {
  if(data?.token){
  const updatedUserConnection = await db.userConnection.update({
      where: {
          shop: data.shop,
      },
      data: {
          // connection_id: data.id,
          // uid: data.uid,
          // user_id: data.user_id,
          // plan_id: data.plan_id,
          // custom_name: data.custom_name,
          // custom_note: data.custom_note,
          // sync_type: data.sync_type,
          // configured: data.configured,
          // is_sync_enabled: data.is_sync_enabled,
          // is_plugins_connected: data.is_plugins_connected,
          // config: data.config,
          // created_at: data.created_at,
          // updated_at: data.updated_at,
          // status: data.status,
          // active_subscription_id: data.active_subscription_id,
          token: data?.token
      },
  });
  return updatedUserConnection;
  }
  else{
    return existingUserConnection;
  }
} else {
    const newUserConnection = await db.userConnection.create({
        data: {
            connection_id: data.id,
            shop: data.shop,
            uid: data.uid,
            user_id: data.user_id,
            plan_id: data.plan_id,
            custom_name: data.custom_name,
            custom_note: data.custom_note,
            sync_type: data.sync_type,
            configured: data.configured,
            is_sync_enabled: data.is_sync_enabled,
            is_plugins_connected: data.is_plugins_connected,
            config: data.config,
            created_at: data.created_at,
            updated_at: data.updated_at,
            status: data.status,
            active_subscription_id: data.active_subscription_id,
            token: data?.token,
            email: data.email,
        },
    });
    return newUserConnection;
}
}


export default function configPage() {
  const [isFirstButtonActive, setIsFirstButtonActive] = useState(true);
  const [inputValues, setInputValues] = useState({});
  const [radioValues, setRadioValues] = useState({});
  const [preference, setPreference] = useState();
  const [configform, setConfig] = useState();
  const [mapping, setMapping] = useState();
  const [credentialFormStatus, setCredentialFormStatus] = useState(null);
  const [prefEnableDisable, setPrefEnableDisable] = useState(null);
  const [preCheckedEnableDisable, setPreCheckedEnableDisable] = useState();
  const [preCheckedED, setPreCheckedED] = useState();
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationMessageError, setNotificationMessageError] = useState("");
  const [notificationMessageInfo, setNotificationMessageInfo] = useState("");
  const [preferenceActiveTab, setPreferenceActiveTab] = useState("");
  const [selectedValue, setSelectedValue] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [dataLimit, setDataLimit] = useState({ start: 1, end: 2 });
  const [navbar, setNavbar] = useState(null);
  const [formData, setFormData] = useState({});
  const [configPreFill, setConfigPreFill] = useState({});
  const data = useLoaderData();
  const [product, setProduct] = useState(data.data);
  const [form,setForm] = useState(data?.form);
  const store = data?.store;
  const user_data = data?.user_data;
  const [items,setItems] = useState([]);
  const [loader, setLoader] = useState("");
  const [configLoader, setConfigLoader] = useState("");
  const [mapLoader, setMapLoader] = useState("");
  const [required, setRequired] = useState();
  const [showerror, setError] = useState();
  const [cerror, setCerror] = useState([]);
  const [loading, setLoading] = useState({});
  const [hideshow, setHideshow] = useState({});
  const [checkModule,setCheckModule] = useState([]);
  const [selectedItemName, setSelectedItemName] = useState("");

  console.log("dataaaaaaaa ::", data);

console.log("selectedItemNameselectedItemName",selectedItemName)

  useEffect(() => {
    if (product && product.plugin_form) {
      const preFilledData = {};
      product.plugin_form.forEach((plugin) => {
        Object.entries(plugin.fields).forEach(([fieldKey, field]) => {
          if (field.value && !formData[fieldKey]) {
            preFilledData[fieldKey] = field.value;
          }
        });
      });
      setFormData((prevState) => ({
        ...prevState,
        ...preFilledData,
      }));
    }
  }, [product]);

  // useEffect to prefill data
  useEffect(() => {
    if (configform) {
      const initialValues = {};

      configform.config_form.forEach((item) => {
        const { plugin_id, saved_values } = item;
        console.log("forEach item :::::", item);
        console.log("forEach saved_values :::::", saved_values);

        if (saved_values) {
          console.log("forEach plugin_id :::::", plugin_id);
          Object.entries(saved_values).forEach(([name, value]) => {
            if (!initialValues[plugin_id]) {
              initialValues[plugin_id] = {};
            }
            initialValues[plugin_id][name] = value || '';
          });
        }
      });

      console.log("prefilled initialValues", initialValues);
      setInputValues(initialValues);
    }
  }, [configform]);

  // useEffect(() => {
  //   return null
  // }, [inputValues]);


  const handleFirstButtonClick = useCallback(() => {
    console.log("handleFirstButtonClick ", data);
    setProduct(data.data);
    setNavbar(false);
    setCheckModule([]);
    if (isFirstButtonActive) return;
    
    setIsFirstButtonActive(true);
  }, [isFirstButtonActive]);

  const handleSecondButtonClick = useCallback(() => {
    setNavbar(true);
    setProduct(null);
    setCheckModule([]);
    setNotificationMessage("");
    setSelectedItemName("Stores");
    handleItemClick("store");
    
    // setConfig(null);
    if (!isFirstButtonActive) return;
    setIsFirstButtonActive(false);
  }, [isFirstButtonActive]);
  useEffect(() => {
    let newmenu= [];
    console.log('newmenunewmenu',newmenu)
  form.map((item) => {
    console.log('item.nameitem.name',item.name)
    var jj = {
      content: item.name,
      tone: item.module==preferenceActiveTab?"primary":"secondary",
      suffix: item.is_configured?(<span style={{position: "absolute",right: "10px"}}><Icon source={CheckIcon} tone="textSuccess" /></span>):null,
      prefix: <Icon source={ChevronRightIcon} />,
      onAction: () => {
        handleItemClick(item.module);
        setSelectedItemName(item.name); // Store the selected item's name
      },
    };
    newmenu.push(jj);
  });
  setItems(newmenu);
  console.log("sidebar menus",items);
},[form,preferenceActiveTab]);
  const handleSelectChange = (value) => {
    setSelectedValue(value);
  };
  async function getMenu(token)
  {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    const formResponse = await fetch(
      "https://main.dev.saasintegrator.online/api/v1/menus",
      requestOptions
    );

    if (!formResponse.ok) {
      throw new Error(`Failed to fetch menus. Status: ${formResponse.status}`);
    }

    const form_data = await formResponse.json();
    //console.log("Form Data:", form_data);
    return form_data;
  }
  async function getModuleStatusData(token,itemContent)
  {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    const formResponse = await fetch(
      `https://main.dev.saasintegrator.online/api/v1/${itemContent}/module-status`,
      requestOptions
    );

    if (!formResponse.ok) {
      throw new Error(`Failed to fetch menus. Status: ${formResponse.status}`);
    }

    const form_data = await formResponse.json();
    //console.log("Form Data:", form_data);
    return form_data;
  }
  async function handleItemClick(itemContent) {

    //setNotificationMessage("");
    setDataLimit({ start: 0, end: 2 });
    setLoader('prefyes');
    setConfigLoader('configyes');
    setMapLoader('mapyes');
    console.log('item clicked',itemContent);


    setConfig();
    setMapping();
    setPreferenceActiveTab(itemContent);

    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + data.store.token);
    const getModuleStatus=await getModuleStatusData(data.store.token,itemContent);
    var menu=await getMenu(data.store.token);
    var insert=[];
    switch(itemContent)
    {
      case "seller":
        var insert=[];

        menu.map((item)=>{
          switch(item.module)
          {
            case "store":
              if(!item.is_configured)
              {
                insert.push('Store');
              }
              break;
              case "currency":
              if(!item.is_configured)
              {
                insert.push('Currency');
              }
              break;
              case "tax":
              if(!item.is_configured)
              {
                insert.push('Tax');
              }
              break;
              case "payment_method":
              if(!item.is_configured)
              {
                insert.push(`Payment Method`);
              }
              break;
          }
        })
        setCheckModule(insert);
        break;
        case "product":
          var insert=[];
        menu.map((item)=>{
          switch(item.module)
          {
            case "store":
              if(!item.is_configured)
              {
                insert.push('Store');
              }
              break;
              case "currency":
              if(!item.is_configured)
              {
                insert.push('Currency');
              }
              break;
              case "tax":
              if(!item.is_configured)
              {
                insert.push('Tax');
              }
              break;
              case "payment_method":
              if(!item.is_configured)
              {
                insert.push(`Payment Method`);
              }
              break;
              case "attribute":
              if(!item.is_configured)
              {
                insert.push(`Attribute`);
              }
              break;
          }
        })
        setCheckModule(insert);
        break;
        case "inventory":
          var insert=[];
        menu.map((item)=>{
          switch(item.module)
          {
            case "store":
              if(!item.is_configured)
              {
                insert.push('Store');
              }
              break;
              case "currency":
              if(!item.is_configured)
              {
                insert.push('Currency');
              }
              break;
              case "tax":
              if(!item.is_configured)
              {
                insert.push('Tax');
              }
              break;
              case "payment_method":
              if(!item.is_configured)
              {
                insert.push(`Payment Method`);
              }
              break;
              case "product":
              if(!item.is_configured)
              {
                insert.push(`Product`);
              }
              break;
          }
        })
        setCheckModule(insert);
        break;
        case "customer":
          var insert=[];
        menu.map((item)=>{
          switch(item.module)
          {
            case "store":
              if(!item.is_configured)
              {
                insert.push('Store');
              }
              break;
              case "currency":
              if(!item.is_configured)
              {
                insert.push('Currency');
              }
              break;
              case "tax":
              if(!item.is_configured)
              {
                insert.push('Tax');
              }
              break;
              case "payment_method":
              if(!item.is_configured)
              {
                insert.push(`Payment Method`);
              }
              break;
          }
        })
        setCheckModule(insert);
        break;
        case "loyalty_point":
          var insert=[];
        menu.map((item)=>{
          switch(item.module)
          {
            case "customer":
              if(!item.is_configured)
              {
                insert.push('Customer');
              }
              break;
              case "order":
              if(!item.is_configured)
              {
                insert.push('Order');
              }
              break;
          }
        })
        setCheckModule(insert);
        break;
        case "order":
          var insert=[];
        menu.map((item)=>{
          switch(item.module)
          {
            case "store":
              if(!item.is_configured)
              {
                insert.push('Store');
              }
              break;
              case "currency":
              if(!item.is_configured)
              {
                insert.push('Currency');
              }
              break;
              case "tax":
              if(!item.is_configured)
              {
                insert.push('Tax');
              }
              break;
              case "payment_method":
              if(!item.is_configured)
              {
                insert.push(`Payment Method`);
              }
              break;
              case "product":
              if(!item.is_configured)
              {
                insert.push(`Product`);
              }
              break;
              case "customer":
              if(!item.is_configured)
              {
                insert.push(`Customer`);
              }
              break;
          }
        })
        setCheckModule(insert);
        break;
        case "click_and_collect":
          var insert=[];
        menu.map((item)=>{
          switch(item.module)
          {
            case "product":
              if(!item.is_configured)
              {
                insert.push('Product');
              }
              break;
              case "order":
              if(!item.is_configured)
              {
                insert.push('Order');
              }
              break;
          }
        })
        setCheckModule(insert);
        break;
        case "purchase_order":
          var insert=[];
        menu.map((item)=>{
          switch(item.module)
          {
            case "product":
              if(!item.is_configured)
              {
                insert.push('Product');
              }
              break;
          }
        })
        setCheckModule(insert);
        break;
        case "tier_price":
          var insert=[];
        menu.map((item)=>{
          switch(item.module)
          {
            case "store":
              if(!item.is_configured)
              {
                insert.push('Store');
              }
              break;
              case "currency":
              if(!item.is_configured)
              {
                insert.push('Currency');
              }
              break;
              case "tax":
              if(!item.is_configured)
              {
                insert.push('Tax');
              }
              break;
              case "payment_method":
              if(!item.is_configured)
              {
                insert.push(`Payment Method`);
              }
              break;
              case "product":
              if(!item.is_configured)
              {
                insert.push(`Product`);
              }
              break;
          }
        })
        setCheckModule(insert);
        break;
        default:
          console.log("its in default state")
          setCheckModule([]);
          break;
    }
    if(checkModule.length==0 || insert.length==0){
      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };
      console.log(`Item clicked: ${itemContent}`);
      try {
        /**************************************  Preference  ****************************************************** */
        const response = await fetch(
          `https://main.dev.saasintegrator.online/api/v1/${itemContent}/preference`,
          requestOptions,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        let preference = await response.json();
        console.log("preference ", preference);
        setPreference(preference);
        setLoader('prefno');
        setSelectedModule(preference?.form[1].value || "");
        if(preference.meta.is_enabled) {
          setDataLimit({ start: 0, end: 2 });
        }
        else{
          setDataLimit({ start: 0, end: 1 });
        }
        setNotificationMessage("");
        if(preference?.meta?.is_enabled){

        /****************************************** config-form  ************************************************** */
        const response2 = await fetch(
          `https://main.dev.saasintegrator.online/api/v1/${itemContent}/config-form`,
          requestOptions,
        );
        if (!response2.ok) {
          setConfigLoader('configno');
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const requireds = [];
        let PluginID = '';
        let configform = await response2.json();
        configform?.config_form?.map((config) => {
          console.log(config, "CCCCCCCCCCCCCCCCCCCOOOOOOOONNNNNFIFFFFFGGF")
          PluginID = config.plugin_id;
          console.log("PluginIDPluginID", PluginID)
          config?.fields?.map((cf) => {
            if (cf.required) {

              const value = []
              value.push({ "plugin": PluginID, "name": cf.name })
              console.log("valueeeeeeeeee", value);
              requireds.push(value);
            }
            setHideshow((prevState) => ({
              ...prevState,
              [cf.name]: true, // Dynamically update state based on input name
            }));
          })
        })
        setRequired(requireds);
        console.log("required:::::", requireds);
        console.log("config ", configform);
        setConfig(configform);
        setConfigLoader('configno');
        /**************************************** Mapping **************************************************** */
        console.log("Mapping ********************************",getModuleStatus);
        console.log("OUT ");
        if(getModuleStatus.can_show_simple_mapping){
          console.log("IN ");
        const response3 = await fetch(
          `https://main.dev.saasintegrator.online/api/v1/${itemContent}/mapping`,
          requestOptions,
        );
        if (!response3.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        let mapping = await response3.json();
        console.log("mapping ", mapping);
        setMapping(mapping);
      }
        setMapLoader('mapno');

      }
      } catch (error) {
        setMapLoader('mapno');
        console.error("Error fetching config-form:", error);
        throw error;
      }

    }
    // You can add any other logic you need here
  }

  useEffect(() => {
    const initialSelectedValue = preference?.form[0].value
    setPreCheckedEnableDisable(initialSelectedValue);
    setPreCheckedED(initialSelectedValue);
    console.log("initialSelectedValue :::", initialSelectedValue);
    setPrefEnableDisable(initialSelectedValue);
   setSelectedValue(preference?.form[1].value || "");
   setSelectedModule(preference?.form[1].value || "");
   if(data?.data?.plugin_form[0]?.credentials_is_valid && data?.data?.plugin_form[1]?.credentials_is_valid)
   {
      setCredentialFormStatus(true);
    }
  }, [preference]);


  const handleChange = useCallback((value, name) => {
    console.log("handleChange values", value, "::", name);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleconfigChange = useCallback((value, field, plugin_id) => {
    console.log("handleconfigChange Value :", value);
    console.log(plugin_id, "fieldfield", field);
    let val = value;
    if(Array.isArray(value))
    {
      if(value.length>1)
      {
        val = value;
      }
      else
      {
        val = value[0];
      }
    }
    setInputValues((prev) => {
      // If the plugin_id is 'general', update the 'general' section

      return {
        ...prev,
        [plugin_id]: {
          ...prev[plugin_id],
          [field]: val,
        },
      };
    });

    // You can use 'value' and 'field' here as needed for further operations
  }, []);


  const handleSubmit = (event) => {
    console.log("formData in handlesubmit", formData);
    event.preventDefault();
    setLoading({ "config_loading": true });

    if (true) {
        console.log("entered in iffff");
        checkData(formData, data);
    }
};
console.log("CerrorCerrorCerror:::", cerror);

const checkData = async (formData, apiData) => {
    console.log("enteredddd");
    let credError = false;
    let push = [];
    console.log("PUSH: ", push);
    console.log("credError: ", credError);

    let transformedData = apiData?.data?.plugin_form?.map(plugin => {
        let credential_values = {};
        for (let key in plugin.fields) {
            if (key != "stocky_token") {
                // Trim the value
                const trimmedValue = (formData[key] || "").trim();
                if (!trimmedValue) {
                  // General empty field check
                  credError = true;
                  push.push({ name: key, error: "This field is required." });
                  setLoading({ "config_loading": false });
              }
                // Check if the field type is URL and validate it
                if (plugin.fields[key].type === "url" && !isValidUrl(trimmedValue)) {
                    credError = true;
                    push.push({ name: key, error: "The Retail Express Domain URL must be a valid URL." });
                    setLoading({ "config_loading": false });
                } 

                credential_values[key] = trimmedValue;
            }
        }

        return {
            "plugin_id": plugin.plugin_id,
            "credential_values": credential_values
        };
    });

    console.log("PUSH: ", push);
    setCerror(push);

    transformedData.push({
        "plugin_id": "general",
        "credential_values": {
            "custom_name": apiData?.store?.shop
        }
    });
    console.log("transformedData", transformedData);

    if (!credError) {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + apiData?.store?.token);
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify(transformedData);
        console.log("rawwwwwwwwwwwwww", raw);

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };
        let responseData = {};

        await fetch("https://main.dev.saasintegrator.online/api/v1/credential-form", requestOptions)
            .then((response) => response.json())
            .then(async (result) => {
                responseData = result?.data;
                console.log("result ::", result);
                console.log("responseData ::", responseData);

                for (let key in responseData) {
                    if (responseData.hasOwnProperty(key)) {
                        if (responseData[key].credentials_is_valid !== true) {
                            setCredentialFormStatus(false);
                            break;
                        } else {
                            setCredentialFormStatus(true);
                        }
                    }
                }

                setLoading({ "config_loading": false });
                setNotificationMessage(result?.message);
                setTimeout(() => {
                    setNotificationMessage("");
                }, 5000);
                console.log("credentialFormStatus ::", credentialFormStatus);
            })
            .catch((error) => {
                console.error(error);
                setLoading({ "config_loading": false });
            });
    }
};

// URL validation function
const isValidUrl = (url) => {
    const urlPattern = new RegExp(
        "^(https?:\\/\\/)" + // Protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" + // Domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR IP (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // Port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // Query string
        "(\\#[-a-z\\d_]*)?$",
        "i"
    ); // Fragment locator
    return !!urlPattern.test(url);
};


  const handleConfigSubmit = async() => {
    setLoading({"config":true});
    console.log("i", inputValues, "These values should be required", required);

    // Function to check if 'is_bidirectional_sync' matches
    // Function to check for common objects dynamically
    const getCommonObjects = (inputValues, required) => {
      let commonObjects = [];

      required.forEach(item => {
        let requiredItem = item[0]; // Access the first element in each sub-array
        if (requiredItem) {
          let { plugin, name } = requiredItem;
          let inputCategory = inputValues[plugin];

          if (inputCategory && inputCategory[name] !== undefined && inputCategory[name] == "") {
            commonObjects.push(requiredItem);
          } else if (!inputCategory) {
            commonObjects.push(requiredItem);
            console.log(`${plugin} is absent in inputValues`);
          } else if (inputCategory[name] === undefined) {
            commonObjects.push(requiredItem);
            console.log(`${name} is absent in ${plugin} of inputValues`);
          }
        }
      });


      return commonObjects;
    };

    const commonObjects = getCommonObjects(inputValues, required);
    console.log('Common Objects:', commonObjects);

    setError(commonObjects)


    if (commonObjects.length == 0) {
      // const matchedValues = required.
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + data?.store?.token);

      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify(inputValues);

      console.log("inputValuessssssss", inputValues)

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      await fetch(`https://main.dev.saasintegrator.online/api/v1/${preferenceActiveTab}/config`, requestOptions)
        .then((response) => response.json())
        .then(async(result) => {
          console.log("config result:::::::", result)
          setLoading({"config":false});
          setNotificationMessage(result?.message);
          setTimeout(() => {
            setNotificationMessage("")
          }, 5000);
          var menu=await getMenu(data.store.token);
        setForm(menu);
        })
        .catch((error) =>{ console.error(error); setLoading({"config":false});});

    }
    else
    {
      setLoading({"config":false});
    }
  };

  const handlePrefEnableDisable = (value, label) => {
    setPreCheckedED(value);
    if (value === 1 && label === "Enable") {
      setDataLimit(prevLimit => ({
        start: prevLimit.start,
        end: prevLimit.end + 1
      }));
      console.log("if value ::", value);
      console.log("if label ::", label);
      setPreCheckedED(1);
    } else if (value === 0 && label === "Disable") {
      setDataLimit(prevLimit => ({
        start: prevLimit.start,
        end: prevLimit.end - 1
      }));
      console.log("else if value ::", value);
      console.log("else if label ::", label);
      setPreCheckedED(0);
    }
    console.log("data limit ::", dataLimit);
  };


  const handlePreference = async () => {
    setLoading({"preference":true});
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + data?.store?.token);
    myHeaders.append("Content-Type", "application/json");
    console.log("preCheckedEDpreCheckedEDpreCheckedEDpreCheckedED ::", preCheckedED);
    if(selectedValue!="" || preCheckedED==0){
    const raw = JSON.stringify({
      "enable": preCheckedED == 0 ? false : true,
      "main_plugin": selectedValue
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    await fetch(`https://main.dev.saasintegrator.online/api/v1/${preferenceActiveTab}/save-preference`, requestOptions)
      .then((response) => response.json())
      .then(async(result) => {
        setPreCheckedEnableDisable(preCheckedED);
        setPrefEnableDisable(preCheckedED);
        console.log("result?.status_code ",result?.status_code,"save-preference result: ", result);
        setLoading({"preference":false});
        switch(result?.status_code){
          case 500:
            setNotificationMessageError(result.message);
          break;
          case 422:
            setNotificationMessageError(result.message);
          break;
          case 200:
            setNotificationMessage(result?.message);
          break;
          default:
            setNotificationMessage(result?.message);
            break;
        }
        handleItemClick(preferenceActiveTab);
        setTimeout(() => {
          setNotificationMessage("")
        }, 5000);
        var menu=await getMenu(data.store.token);
      setForm(menu);
      })
      .catch((error) =>{ console.error(error); setLoading({"preference":false});});

    }
    else{
      setNotificationMessageInfo("Please select source of truth(Main Plugin)");
      setLoading({"preference":false});
      setTimeout(() => {
        setNotificationMessageInfo("")
      }, 5000);
    }
  }

  const successStyle = {
    background: "#b4fed2",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "1rem",
    width: "100%",
    marginTop: "1rem",
    color: "#0c5132"
  };

  const errorStyle = {
    background: "#fed3d1",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "1rem",
    width: "100%",
    marginTop: "1rem",
    color: "#8e1f0b"
  };

  const flexStyle = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
  }


  return (
    <div style={{ display: "flex", gap: "2rem", marginLeft: "1.9rem" }}>
      {console.log("menu under react return ",items)}
      {navbar && (
        <>
          {/* <ActionList actionRole="menuitem" items={items} /> */}
          <div style={{ width: "15%"  ,float:'left' , }}>
  {items.map((item, index) => (
    <Button
      key={index}
      onClick={item.onAction}
      icon={item.prefix}
      fullWidth
      alignment="left"
      iconAlignment="left"
      textAlign = "left"
      variant={item.tone}
    >
      <div style={{ float:'left', width: "100%" }}>
        <span>{item.content}</span>
        {item.suffix}
      </div>
    </Button>
  ))}
</div>

        </>
      )}
      <form onSubmit={handleSubmit}>
        <Page>
          {/* <ui-title-bar title="Click & Collect">
            <button variant="primary" type="submit">
              Save
            </button>
          </ui-title-bar> */}




          <Layout>

               {credentialFormStatus && (
                <div style={{ width: "100%" }}>
                <LegacyCard
              title={selectedItemName && !isFirstButtonActive ? ` ${selectedItemName}` : ""} // Dynamic title
                sectioned >
                  <ButtonGroup variant="segmented">
                    <Button
                      pressed={isFirstButtonActive}
                      onClick={handleFirstButtonClick}
                    >
                      General
                    </Button>
                    <Button
                      pressed={!isFirstButtonActive}
                      onClick={handleSecondButtonClick}
                    >
                      Module Configuration
                    </Button>
                  </ButtonGroup>
                </LegacyCard>
                </div>
              )} 

            {notificationMessage !== "" && (
            <NotificationBar title={notificationMessage} style={successStyle} />
          )}
          {notificationMessageError !== "" && (
            <NotificationBar title={notificationMessageError} style={errorStyle} />
          )}
          {notificationMessageInfo !== "" && (
            <NotificationBar title={notificationMessageInfo} style={errorStyle} />
          )}

            <div style={{ width: "100%",marginTop:"10px",minWidth:"32pc" }}>
              {checkModule && checkModule.length > 0 ? (
                <>
                <div style={{ background: "#fff3cd",padding: "20px",border: "1px solid #ffecb5",borderRadius: "10px"}}>
                <div style={{fontWeight: "bold",marginBottom: "15px",fontSize: "15px"}}>This module cannot be configured.</div>

                <div style={{fontSize: "15px"}}>  Please check the following modules are configured first</div>
                </div>
                  <ul>
                  {checkModule.map((cm)=>{
                   return( <li style={{fontSize: "15px",marginBottom: "5px",color: "#565656",fontWeight: "400"}}>{cm}</li>);
                  })}
                    </ul>
                  </>
                  ):(<>
              {preference &&
                preference != undefined &&
                navbar ? (
                <>
                {loader=="prefyes"?(<LegacyCard title="Preferences" sectioned >
                <Card title="configform"><div style={{textAlign:"center"}}><Spinner accessibilityLabel="Spinner example" size="large" /></div></Card></LegacyCard>):(
                  <LegacyCard title="Preferences" sectioned primaryFooterAction={!loading.preference?{ content: 'Save Preferences', onAction: () => handlePreference() }:{content:<Spinner accessibilityLabel="Spinner example" size="small" />}}>
                    <Card title="configform">

                      <FormLayout>
                        <div
                          style={flexStyle}
                        >
                          {console.log("preferences :::", preference)}
                          {preference?.form.slice(dataLimit.start, dataLimit.end)?.map((field) => (
                            <div style={{ width: "48%" }}>
                              {(() => {
                                switch (field.input_type) {
                                  case "url":
                                    return (
                                      <TextField
                                        label={field.label}
                                        value={
                                          inputValues[field.name] || field.value
                                        }
                                        onChange={(value) =>
                                          handleChange(value, field.name)
                                        }
                                        name={field.name}
                                        type="url"
                                        required={field.required}
                                        helpText={field.description}
                                      />
                                    );
                                  case "text":
                                  case "password":
                                    return (
                                      <TextField
                                        label={field.label}
                                        value={
                                          inputValues[field.name] || field.value
                                        }
                                        onChange={(value) =>
                                          handleChange(value, field.name)
                                        }
                                        name={field.name}
                                        type={field.type}
                                        required={field.required}
                                        helpText={field.description}
                                      />
                                    );
                                  case "select":

                                    return (
                                      <>
                                        <Text variant="headingMd" as="h6">
                                          {field.label}
                                        </Text>
                                        {field?.options.length > 0 && (
                                          <Select
                                            name={field.name}
                                            label={field.label}
                                            labelHidden="true"
                                            options={[{ value: '', label: 'Select source of Truth' }, ...field.options]}
                                            onChange={handleSelectChange}
                                            value={selectedValue}
                                           // placeholder="Select source of Truth"
                                          />
                                        )}
                                      </>
                                    );

                                  case "radio":
                                    return (
                                      <>

                                        <Text variant="headingMd" as="h6">
                                          {field.description}
                                        </Text>
                                        <div style={{display: "flex", gap: "12px"}}>
                                        {field?.options?.map((option, index) => (
                                          <>
                                            {console.log(option.value, "option.valueoption.value")}

                                            <RadioButton
                                              key={index}
                                              label={option.label}
                                              id={field.id}
                                              name={field.name}
                                              value={option.value}
                                              // checked={option?.is_default_hide === true}
                                              checked={
                                                preCheckedED ==
                                                option.value
                                              }
                                              onChange={() =>
                                                handlePrefEnableDisable(
                                                  option.value,
                                                  option.label,
                                                )
                                              }
                                            />
                                              <div>
        <p style ={{marginTop:'4px'}}>
          {selectedItemName ? `(${selectedItemName})` : "(Stores)"}
        </p>
      </div>

                                          </>
                                        ))}
                                        </div>
                                      </>
                                    );

                                  default:
                                    return null;
                                }
                              })()}
                            </div>
                          ))}
                        </div>
                      </FormLayout>
                    </Card>
                  </LegacyCard>
               )}

                 {preCheckedED!=0 && prefEnableDisable != 0 && configLoader=="configyes" ?(<LegacyCard title="Config" sectioned >
                  <Card title="configform"><div style={{textAlign:"center"}}><Spinner accessibilityLabel="Spinner example" size="large" /></div></Card></LegacyCard>):(
                  <>
                  {preCheckedED!=0 && prefEnableDisable != 0 &&
                    configform?.config_form
                    ?.filter(mango => mango?.fields.length > 0)
                    .map((mango, index, filteredArray) => {
                      const isLast = index === filteredArray.length - 1;

                      return (
                        <>

                          {mango?.fields.length > 0 && (
                            <LegacyCard title={mango?.label} sectioned
                            primaryFooterAction={isLast?!loading.config?{ content: 'Save Configuration', onAction: () => handleConfigSubmit() }:{ content:<Spinner accessibilityLabel="Spinner example" size="small" />}:null}>
                              <Card title="configform">
                                <FormLayout>
                                  <div
                                    style={flexStyle}
                                  >
                                    {mango?.fields?.map((field) => (
                                      // <Card type={field.input_type} field={field} />

                                      <div style={hideshow?.[field.name]?{ width: "48%" }:{display:"none"}}>
                                        {(() => {
                                          {console.log(field.input_type,"field.input_typefield.input_typefield.input_type");}
                                          switch (field.input_type) {
                                            case "url":
                                            case "text":
                                            case "password":
                                              return (

                                                <TextFieldComponent
                                                  key={field.name}
                                                  field={field}
                                                  inputValues={inputValues}
                                                  handleconfigChange={handleconfigChange}
                                                  mango={{ plugin_id: mango?.plugin_id }}
                                                  error={showerror}
                                                  setHideshow={setHideshow}
                                                  helpText={field.description}
                                                  required={required}
                                                  setRequired={setRequired}
                                                />
                                              );
                                            case "select":
                                              return (
                                                <>
                                                  <SelectComponent
                                                    key={field.name}
                                                    field={field}
                                                    inputValues={inputValues}
                                                    handleconfigChange={handleconfigChange}
                                                    mango={mango}
                                                    error={showerror}
                                                    setHideshow={setHideshow}
                                                    helpText={field.description}
                                                    required={required}
                                                    setRequired={setRequired}
                                                    
                                                  />
                                                </>
                                              );
                                            case "radio":
                                              return (
                                                <RadioGroupComponent
                                                  key={field.name}
                                                  field={field}
                                                  inputValues={inputValues}
                                                  handleconfigChange={handleconfigChange}
                                                  mango={{ plugin_id: mango?.plugin_id }}
                                                  error={showerror}
                                                  setHideshow={setHideshow}
                                                  helpText={field.description}
                                                  required={required}
                                                  setRequired={setRequired}
                                                />
                                              );
                                            default:
                                              return null;
                                          }
                                        })()}
                                      </div>
                                    ))}
                                  </div>
                                </FormLayout>
                              </Card>
                            </LegacyCard>
                          )}
                        </>
                      );
                    })}
                    </>
                  )}
                  {preCheckedED!=0 && prefEnableDisable != 0 && (
                    <>
                  {mapLoader=="mapyes"?(<LegacyCard title="Mapping" sectioned >
                    <Card title="configform"><div style={{textAlign:"center"}}><Spinner accessibilityLabel="Spinner example" size="large" /></div></Card></LegacyCard>):(
                    <>
                  <MAPPING mapping={mapping?.items} plugin={selectedModule} preference={preference} token={data?.store?.token || ''} setNotificationMessage={setNotificationMessage}
                  preferenceActiveTab={preferenceActiveTab}  mappings={mapping} getMenu={getMenu} setForm={setForm}/>
                    </>
                  )}
                  </>
                )}
                </>
              ) : (
                <>
                {!navbar && (
                  <>
                  <FormLayout>
                 <LegacyCard title="RETAIL EXPRESS" sectioned  >
                  <div style={{marginBottom: '10px'}} >
                 <Card>
                  <div style={{textAlign: 'center'}} >

                  <Badge
                    tone={credentialFormStatus ? 'success' : 'critical'}
                    toneAndProgressLabelOverride={`Setting is ${credentialFormStatus ? 'CONNECTED' : 'Not CONNECTED'}`}
                  >
                    {credentialFormStatus ? 'CONNECTED' : 'NOT CONNECTED'}
                  </Badge>
                  </div>
        </Card>
        </div>
                  {product?.plugin_form?.map((plugin, index) => {
                    // console.log("plugin?.fields?.token :::", plugin?.fields?.token)
                    return (
                      <div
                        style={{
                          display:
                            plugin.fields?.token != undefined ||
                              plugin?.fields?.token != null
                              ? "none"
                              : "block",
                        }}
                      >
                          <Card key={index} title={plugin.label}>
                            <div
                              style={flexStyle}
                            >
                              {Object.entries(plugin.fields).map(
                                ([fieldKey, field]) => {
                                  // console.log("fieldKey :::", fieldKey)
                                  return (
                                    <div style={{ width: "48%" }}>
                                      {(() => {
                                        switch (field.type) {
                                          case "url":
                                          case "text":
                                          case "hidden":
                                          case "password":
                                            return (
                                              <div style={{marginBottom:"10px"}}>
                                                <Text variant="headingMd" as="h6">
                                                        {field.label}
                                                      </Text>
                                                <Text>{field.description}</Text>
                                                <TextField
                                                 // label={field.label}
                                                  value={formData[fieldKey]}
                                                  onChange={(value) =>
                                                    handleChange(value, fieldKey)
                                                  }
                                                  name={fieldKey}
                                                  type={field.type}
                                                  required={field.required}
                                                 // helpText={field.description}
                                                  requiredIndicator
                                                />
                                                <>
                                                  {cerror.length > 0 && cerror.filter((e) => e.name == fieldKey).map((sh) => {
                                                    return (
                                                      <span style={{ color: 'red' }} >{sh.error}</span>
                                                    )
                                                  })}
                                                </>
                                              </div>
                                            );
                                          default:
                                            return null;
                                        }
                                      })()}
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </Card>
                      </div>
                    );
                  })}
                  </LegacyCard>

                  </FormLayout>

                  {loading.config_loading ? (
                    <button style={{backgroundColor:"#fff",color:"#fff",padding:"4px 8px",borderRadius:"10px",marginTop:"15px"}}  variant="primary">
                    <Spinner accessibilityLabel="Config Form" size="small" />
                  </button>
                  ):(
                  <button style={{backgroundColor:"#000",color:"#fff",padding:"4px 8px",borderRadius:"10px",marginTop:"15px"}}  variant="primary" type="submit">
                    Save
                  </button>
                )}
                </>
              )}
                </>
              )}
              </>
            )}
            </div>
          </Layout>
        </Page>

      </form>
    </div>
  );
}
