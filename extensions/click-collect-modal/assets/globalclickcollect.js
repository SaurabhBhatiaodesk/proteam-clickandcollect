async function fetchData(e) { try { const t = await fetch(e); if (!t.ok) throw new Error("Network response was not ok"); return await t.json() } catch (e) { return console.error("Error fetching data:", e), null } }
function getCookie(e) { const t = document.cookie.split(";").map(e => e.trim().split("=")), o = t.find(t => t[0] === e); return o ? decodeURIComponent(o[1]) : null } function setCookie(e, t, o) { let n = ""; o && (n = new Date, n.setTime(n.getTime() + 24 * o * 60 * 60 * 1e3), n = "; expires=" + n.toUTCString()), document.cookie = `${e}=${t}${n}; path=/` }
async function getLocations(selectedLocation = "") {try { document.querySelector('.cnc-checkload').classList.add('loader');
document.querySelector(".popup-box .address-popup").style.display = "none";document.querySelector(".popup-box button.setlocationbtn.popup-btn").style.display = "none";
        const pickuplcurl = `https://click-n-collect-flirt-adult-f70cdb5d038f.herokuapp.com/api/pickupLocation?shop=${Shopify.shop}`;
        const testres = await fetchData(pickuplcurl);const locations = testres?.data?.locations?.nodes;
        const destinationsArr = []; if (locations) { for (const location of locations) { if (location.address.zip && location?.localPickupSettingsV2 != null) { destinationsArr.push(`${location.address.address1} ${location.address.city} ${location.address.zip} ${location.address.province} ${location.address.country}`); } } }
        if (destinationsArr.length > 0) {
            const customerLocation = getCookie("customerlocation");
            document.querySelector(".location").value = customerLocation;
            let mapUrl = `https://click-n-collect-flirt-adult-f70cdb5d038f.herokuapp.com/api/distance?customerlocation=${customerLocation}&shop=${Shopify.shop}`;
            const res = await fetchData(mapUrl); var count = 0;
            if (res) {const sortedLocations = [];for (let index = 0; index < locations.length; index++) {const location = locations[index]; if (location.address.zip && location?.localPickupSettingsV2 != null) {
                        const zipcode = location.address.zip; const fulladdress = location.address.address1 + ' ' + zipcode;
                        for (let index = 0; index < destinationsArr.length; index++) { const distanceElement = res?.rows[0]?.elements[index]; const destinationAddress = destinationsArr[index];
                            if (destinationAddress.includes(zipcode)) {if (distanceElement?.status == "OK" && distanceElement?.status != "ZERO_RESULTS" && distanceElement?.distance?.value < res?.kilometer) {
                                    const distanceText = distanceElement?.distance.text;const parsedDistance = parseInt(distanceText.replace(/,/g, "").replace(" km", ""));
                                    sortedLocations.push({id: location.id, distance: parsedDistance, distanceText, origin: res.origin_addresses, ...location
                                    });
                                }
                            } else if (distanceElement?.status == "OK" && distanceElement?.status != "ZERO_RESULTS" && distanceElement?.distance?.value > 1) {
                                count = count + 1;
                            }
                        }
                    }
                }sortedLocations.sort((a, b) => a.distance - b.distance);   renderLocations(sortedLocations, selectedLocation, count);
            }}
        document.querySelector(".popup-box .address-popup").style.display = "block";
        if (getCookie("storelocationName")) { console.log('storelocationName not set : ', getCookie("storelocationName")) }
        else { document.querySelector(".popup-box .address-popup").style.display = "block"; }
        document.querySelector('.cnc-checkload').classList.remove('loader');
    } catch (error) { console.error("Error fetching locations:", error); }
}
function renderLocations(locations, selectedLocation, count = 0) {
    const locationsContainer = document.querySelector(".popup-box .address-popup .locationss"); locationsContainer.innerHTML = "";
    if (locations.length > 0) {
        locationsContainer.innerHTML = "";
        locations.forEach(location => {
            if (location.name !== "Snow City Warehouse") {
                const locationElement = document.createElement("div"); locationElement.classList.add("popup-inner-col");
                locationElement.innerHTML = `<div class="add"><span><input type="radio" id="${location.id}" class="locations" data-name="${location.name}" name="locations" value="HTML" ${location.name === selectedLocation ? 'checked="checked"' : ''}><label for="${location.id}">${location.name}</label></span><h4>${location.distanceText}</h4></div><ul class="order-list"><li>${location.address.country}</li> <li>Address: ${location.address.address1}</li><li>Phone: ${location.address.phone}</li> </ul><button type="submit"> <a href="https://www.google.com/maps/dir/${location.origin}/${location.address.address1} ${location.address.city} ${location.address.zip} ${location.address.province} ${location.address.country}" target="_blank"> Get Directions <span class="errow"> >> </span> </a></button>`;
                locationsContainer.appendChild(locationElement);
            }
        });
    } else if (count > 0 && locations.length == 0) { locationsContainer.innerHTML = "";
        const noStoresElement = document.createElement("div"); noStoresElement.classList.add("popup-inner-col"); noStoresElement.innerHTML = '<div class="add">Stores are not available within a 50 km range </div>'; locationsContainer.appendChild(noStoresElement);
    } else {  locationsContainer.innerHTML = ""; const noStoresElement = document.createElement("div"); noStoresElement.classList.add("popup-inner-col"); noStoresElement.innerHTML = '<div class="add">Stores not available for entered location</div>'; locationsContainer.appendChild(noStoresElement); }
} function showModal() {
    if (getCookie("storelocationName") && !window.location.pathname.includes('password')) {
        const selectedLocation = getCookie("storelocationName"); const customerLocation = getCookie("customerlocation"); document.querySelector(".location").value = customerLocation;
        getLocations(selectedLocation);
        const popupModal = document.querySelector(".popup-modal"); if (popupModal) popupModal.style.display = "block";
    }
    else { const popupModal = document.querySelector(".popup-modal"); if (popupModal) popupModal.style.display = "block"; }
}
if (document.querySelector(".popup-modal") && !window.location.pathname.includes('password')) {
    document.addEventListener("DOMContentLoaded", () => {
        const storeLocation = getCookie("storelocation");
        if (!storeLocation && document.querySelector(".popup-modal")) { document.querySelector(".popup-modal").style.display = "block"; }
        document.querySelector(".popup-close-cross").addEventListener("click", event => { event.preventDefault(); const popupModal = document.querySelector(".popup-modal"); popupModal.style.display = "none"; popupModal.classList.remove("showmodal"); });
        document.querySelector(".setlocationbtn").addEventListener("click", event => {
            event.preventDefault(); const popupModal = document.querySelector(".popup-modal");
            popupModal.style.display = "none"; document.querySelector(".setlocationbtn").style.display = "none"; popupModal.classList.remove("showmodal");
        });
        document.body.addEventListener("click", event => { if (!event.target.closest(".popup-modal")) { document.querySelector(".popup-modal").style.display = "none"; } });
        document.addEventListener("click", event => {
            if (event.target.matches("button.check-btn")) {
                const zipcode = document.querySelector(".location").value;
                if (zipcode != "") { setCookie("customerlocation", zipcode); const selectedLocation = getCookie("storelocationName");
                    if (selectedLocation) { getLocations(selectedLocation); } else { getLocations(''); }
                } else { const locationsContainer = document.querySelector(".popup-box .address-popup .locationss"); locationsContainer.innerHTML = "";
                         const noStoresElement = document.createElement("div"); noStoresElement.classList.add("popup-inner-col"); noStoresElement.innerHTML = '<div class="add">Please enter the postal code </div>'; locationsContainer.appendChild(noStoresElement); } }
        });   document.addEventListener("change", event => {
            if (event.target.matches(".popup-modal .address-popup input.locations")) { document.querySelector(".setlocationbtn").style.display = "block"; setCookie("storelocationName", event.target.nextElementSibling.textContent); setCookie("storelocation", event.target.id); }
        });}); if (getCookie("storelocationName")) { } else { showModal(); }}
async function getUserLocation() { const accessToken = '7a1891347cf4af'; try { const response = await fetch(`https://ipinfo.io/json?token=${accessToken}`);
        const data = await response.json(); if (getCookie("customerlocation")) {
            if (document.querySelector('.check-btn input.location').value == "") { document.querySelector('.check-btn input.location').value = data.postal; }
        } else {setCookie("customerlocation", data.postal);
            if (document.querySelector('.check-btn input.location')) { document.querySelector('.check-btn input.location').value = data.postal; }
        } return data;} catch (error) { console.error('Error fetching IP information:', error); }
}   if (!getCookie("customerlocation")) { getUserLocation(); }