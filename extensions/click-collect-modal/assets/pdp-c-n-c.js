var hostname = 'flirt-adult-store.myshopify.com';
function setCookie(name,value,days){let expires="";if(days){let date=new Date();date.setTime(date.getTime()+(days*86400000));expires="; expires="+date.toUTCString()}document.cookie=`${name}=${value}${expires}; path=/`;}
function getCookie(name){let cookies=document.cookie.split(";").map(cookie=>cookie.trim().split("="));for(let i=0;i<cookies.length;i++){if(cookies[i][0]===name){return decodeURIComponent(cookies[i][1]);}}return null;}
async function fetchData(url) { try { let response = await fetch(url); if (!response.ok) throw new Error(`Failed to fetch data from ${url}`); return await response.json(); } catch (error) { console.error("Error: ", error); throw error;  }}
async function getLocations(selectedLocation = "") { try {  
        const pickuplcurl = `https://click-n-collect-flirt-adult-f70cdb5d038f.herokuapp.com/api/pickupLocation?shop=${hostname}`;
        const testres = await fetchData(pickuplcurl); 
        const locations = testres?.data?.locations?.nodes;  const destinationsArr = []; if (locations) { for (const location of locations) { if (location.address.zip && location?.localPickupSettingsV2 != null) {  destinationsArr.push(`${location.address.address1} ${location.address.city} ${location.address.zip} ${location.address.province} ${location.address.country}`);}}}
            if (destinationsArr.length > 0) { const customerLocation = getCookie("customerlocation"); document.querySelector(".location").value = customerLocation;
              const mapUrl = `https://click-n-collect-flirt-adult-f70cdb5d038f.herokuapp.com/api/distance?customerlocation=${customerLocation}&shop=${hostname}`;
              const res = await fetchData(mapUrl);
              if (res) { const sortedLocations = []; var count = 0; 
                  for (const location of locations) { if (location.address.zip && location?.localPickupSettingsV2 != null) {  const zipcode= location.address.zip; 
                      for (let index = 0; index < destinationsArr.length; index++) { const distanceElement = res?.rows[0]?.elements[index]; const destinationAddress = destinationsArr[index];
                          if(destinationAddress.includes(zipcode) ){
                          if (distanceElement?.status == "OK"  && distanceElement?.distance?.value < res?.kilometer ) { const distanceText = distanceElement?.distance.text; const parsedDistance = parseInt(distanceText.replace(/,/g, "").replace(" km", ""));
                              sortedLocations.push({ id: location.id, distance: parsedDistance, distanceText, origin: res.origin_addresses, ...location });   
                      }else if (distanceElement?.status == "OK"   && distanceElement?.distance?.value > 1){ count = count +1; } } }  }} sortedLocations.sort((a, b) => a.distance - b.distance); renderLocations(sortedLocations, selectedLocation, count); } }
          document.querySelector(".popup-box .address-popup").style.display = "block"; let popupModal = document.querySelector(".popup-modal");    if (popupModal) { popupModal.style.display = "block"; popupModal.classList.add("showmodal"); }
          if (getCookie("storelocationName")){ /*console.log('locationName ',getCookie("storelocationName")) */}
          else{  /* console.log('locationName ',getCookie("storelocationName")) */ }
      } catch (error) { console.error("Error locations:", error); }
  } 
async function getInventoryLocations(callback) {
  let productId = document.querySelector('.inventory-details').dataset.productid;
  try { let response = await fetch(`https://click-n-collect-flirt-adult-f70cdb5d038f.herokuapp.com/api/cart?product_id=${productId}&shop=${hostname}`); 
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    let data = await response.json(); callback(null, data.data);
  } catch (error) {console.error("Error fetching inventory locations:", error); callback(error, null);}
}
async function handleInventoryLocationsResponse(data) { console.log('data ',data)
   var quantityres = data?.quantity; let storeLocationName = getCookie("storelocationName");  let productVariantId = document.querySelector(".product-form .product-variant-id").value;
  for (let i = 0; i < data.product.variants.nodes.length; i++) { let variant = data.product.variants.nodes[i]; let variantIdParts = variant.id.split("/");  let variantId = variantIdParts[variantIdParts.length - 1];
    if (variantId === productVariantId) { let isInStock = false;  if (variant.inventoryItem && variant.inventoryItem.inventoryLevels) { for (let j = 0; j < variant.inventoryItem.inventoryLevels.edges.length; j++) {  let inventoryLevel = variant.inventoryItem.inventoryLevels.edges[j].node;
          if (inventoryLevel.location.name === storeLocationName) { let quantity = inventoryLevel.quantities[0].quantity; isInStock = quantity > quantityres; }
        } } let inventoryStatusElement = document.querySelector(".inventory_status"); let stockElement = document.querySelector(".inventory_status .stock"); if (isInStock) { inventoryStatusElement.classList.add("in-stock"); inventoryStatusElement.classList.remove("out-stock"); stockElement.textContent = "In-stock"; } else { inventoryStatusElement.classList.add("out-stock"); inventoryStatusElement.classList.remove("in-stock"); stockElement.textContent = "Out of Stock"; }  document.querySelector(".inventory-details .broadway .dropdown b").textContent = storeLocationName; }
  }   for (let i = 0; i < data.product.collections.nodes.length; i++) { if (data.product.collections.nodes[i].handle === "automated-collection") { } } for (let i = 0; i < data.product.tags.length; i++) { if (data.product.tags[i] === "Accessory") {  } }
const inventoryDetails = document.querySelector('.loader'); if(inventoryDetails){ inventoryDetails.classList.remove('loader'); }  
}
async function refreshInventoryLocations() { try {  
  getInventoryLocations((error, data) => { if (data) {  handleInventoryLocationsResponse(data); 
  } else { console.error("Error:", error); } }); } catch (error) { console.error("Error refreshing inventory locations:", error); }}
document.addEventListener("click", event => { if (!event.target.closest(".inventory-details")) { refreshInventoryLocations(); }}); const crossElement = document.querySelector(".popup-close-cross");
function showModal(){let storeLocationName=getCookie("storelocationName"); getLocations(storeLocationName); refreshInventoryLocations()}
if (crossElement) {  crossElement.addEventListener("click", event => {  event.preventDefault(); let popupModal = document.querySelector(".popup-modal");    if (popupModal) { popupModal.style.display = "none"; popupModal.classList.remove("showmodal"); }  }); } else { }
document.addEventListener("change", event => { if (event.target.matches(".popup-modal .address-popup input.locations")) { let locationName = event.target.nextElementSibling.textContent6; setCookie("storelocationName", locationName); setCookie("storelocation", event.target.id);
		const pickupLocationSelect = document.querySelector('.cls-pickuplocations-select'); if (pickupLocationSelect !== null && pickupLocationSelect.value !== "") {	pickupLocationSelect.value = event.target.id; }
 refreshInventoryLocations(); } });
document.addEventListener("click", event => { if (event.target.classList.contains("open-modal-cnc")) {showModal(); }}); window.onload = async function() { refreshInventoryLocations();}