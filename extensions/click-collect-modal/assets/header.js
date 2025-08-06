async function fetchData(e) { try { const t = await fetch(e); if (!t.ok) throw new Error("Network response was not ok"); return await t.json() } catch (e) { return console.error("Error fetching data:", e), null } }
function setCookie(name, value, days) { let expires = ""; if (days) { let date = new Date(); date.setTime(date.getTime() + (days * 86400000)); expires = "; expires=" + date.toUTCString() } document.cookie = `${name}=${value}${expires}; path=/`; }
function getCookie(name) { let cookies = document.cookie.split(";").map(cookie => cookie.trim().split("=")); for (let i = 0; i < cookies.length; i++) { if (cookies[i][0] === name) { return decodeURIComponent(cookies[i][1]); } } return null; }
async function getLocationsDropdown(selectedLocation = "") { console.log('test');
  try { const dropdownDiv = document.querySelector('.cls-pickuplocations-div'); document.querySelector('.pickup-locations-dropdown-header').classList.remove('cnc-locationsspace'); dropdownDiv.classList.add('loader');
    const pickuplcurl = `https://click-n-collect-flirt-adult-f70cdb5d038f.herokuapp.com/api/pickupLocation?shop=${hostname}`;
    const testres = await fetchData(pickuplcurl); const locations = testres?.data?.locations?.nodes; const destinationsArr = [];
    if (locations && selectedLocation != null) { for (const location of locations) { if (location?.address?.zip && location?.localPickupSettingsV2 != null) { destinationsArr.push(`${location.address.address1} ${location.address.city} ${location.address.zip} ${location.address.province} ${location.address.country}`); }
      } } dropdownDiv.innerHTML = ''; const dropdwndiv = document.createElement("div"); dropdwndiv.className = 'cnc-dropdwndiv'; const delivertextdiv = document.createElement("div"); delivertextdiv.className = 'cnc-delivertextdiv';
    const dropdownSelect = document.createElement("select"); dropdownSelect.className = "cls-pickuplocations-select"; const optionsList = document.createElement("ul"); optionsList.className = 'options';
    const anchor = document.createElement('a'); anchor.href = 'javascript:void(0)'; anchor.className = 'cnc-modal-open tooltip'; anchor.setAttribute('for', 'dropdown-icon');
    const icon = document.createElement('img'); icon.className = 'location-icon'; icon.setAttribute('src', 'https://cdn.shopify.com/s/files/1/0885/8419/2292/files/new-location.png'); icon.setAttribute('id', 'dropdown-icon'); icon.setAttribute('alt', ''); icon.style.height = '40px';
    const tooltip = document.createElement('span'); tooltip.className = 'tooltiptext cnc-modal-open'; tooltip.textContent = 'Show pickup locations';
    const lable = document.createElement('label'); lable.className = 'cnc-dropdown-lable'; lable.textContent = "You're Shopping"; const newDiv = document.createElement('div'); newDiv.className = 'select-menu active';
    anchor.appendChild(tooltip); anchor.appendChild(icon);  dropdownDiv.appendChild(anchor);
    if (destinationsArr.length > 0 && selectedLocation != null) {
      const selectBtnDiv = document.createElement('div'); selectBtnDiv.className = 'select-btn'; selectBtnDiv.id=selectedLocation;
      const spanElement = document.createElement('span'); spanElement.className = 'sBtn-text'; spanElement.textContent = 'Select your option'; selectBtnDiv.appendChild(spanElement); newDiv.appendChild(selectBtnDiv);
      const customerLocation = getCookie("customerlocation"); const lable2 = document.createElement('label'); lable2.className = 'cnc-dropdown-delver'; lable2.textContent = "Delivering To"; const delivertext = document.createElement('span'); delivertext.className = 'cnc-dropdown-text'; delivertext.textContent = customerLocation;
      const mapUrl = `https://click-n-collect-flirt-adult-f70cdb5d038f.herokuapp.com/api/distance?customerlocation=${customerLocation}&shop=${hostname}`;
      const res = await fetchData(mapUrl); var count = 0;
      if (res) { const sortedLocations = [];
        for (let index = 0; index < locations.length; index++) { const location = locations[index]; if (location?.address?.zip && location?.localPickupSettingsV2 != null) {
            const zipcode = location.address.zip; const fulladdress = location.address.address1 + ' ' + zipcode; for (let index = 0; index < destinationsArr.length; index++) {
              const distanceElement = res?.rows[0]?.elements[index]; const destinationAddress = destinationsArr[index]; if (destinationAddress.includes(zipcode)) { if (distanceElement?.status == "OK" && distanceElement?.status != "ZERO_RESULTS" && distanceElement?.distance?.value < res?.kilometer) { const distanceText = distanceElement?.distance.text; const parsedDistance = parseInt(distanceText.replace(/,/g, "").replace(" km", "")); sortedLocations.push({ id: location.id, distance: parsedDistance, distanceText, origin: res.origin_addresses, ...location }); } else if (distanceElement?.status == "OK" && distanceElement?.status != "ZERO_RESULTS" && distanceElement?.distance?.value > 1) { count = count + 1; } }  } }
        }  sortedLocations.sort((a, b) => a.distance - b.distance);  if (sortedLocations.length > 0 && count > 0) { 
          for (const location of sortedLocations) { 
            const optionItem = document.createElement("li"); optionItem.className = "option";
            const optionText = document.createElement("span"); optionText.id = `${location.name}`; optionText.dataset.name = `${location.name}`; optionText.dataset.value = location.id;
            optionText.innerHTML = `${location.name} - (${location.distanceText})`;
            if(location.name == selectedLocation) { optionItem.classList.add('active');   spanElement.innerHTML= `${location.name} - (${location.distanceText})`; }
            optionItem.appendChild(optionText); optionsList.appendChild(optionItem); 
             const option = document.createElement("option"); option.id = `${location.name}`; option.dataset.name = `${location.name}`; option.value = location.id; option.text = `${location.name} - (${location.distanceText})`; dropdownSelect.appendChild(option);
          } dropdwndiv.appendChild(lable); dropdwndiv.appendChild(dropdownSelect); newDiv.appendChild(optionsList); dropdwndiv.appendChild(newDiv); dropdownDiv.appendChild(dropdwndiv); 
          delivertextdiv.appendChild(lable2); delivertextdiv.appendChild(delivertext); dropdownDiv.appendChild(delivertextdiv); dropdownDiv.style.display = 'block';
          document.querySelector('.pickup-locations-dropdown-header').classList.add('cnc-locationsspace'); selectBtnDiv.addEventListener('click', handleDropdownbuttons);
        }
      }
    } document.querySelectorAll('.pickup-locations-dropdown-header .loader').forEach(function (element) { element.classList.remove('loader'); }); document.querySelector('.pickup-locations-dropdown-header').parentElement.classList.add('cnc-cls-headericons'); } catch (error) { console.error("Error fetching locations:", error); }
}  
function updateDropdownWithSelectedValue(selectedId) {
  const optionMenu = document.querySelector('.cnc-dropdwndiv .select-menu');  const selectBtn = document.querySelector('.cnc-dropdwndiv .select-btn'); 
  const options = optionMenu.querySelectorAll('.cnc-dropdwndiv .option');  options.forEach(function(option) { option.classList.remove('active'); if (option.children[0].dataset.value === selectedId) {selectBtn.id= option.children[0].dataset.value; selectBtn.textContent = option.children[0].textContent; option.classList.add('active'); } }); optionMenu.classList.add('active');
} function handleDropdownbuttons(){ const optionMenu = document.querySelector(".cnc-dropdwndiv .select-menu");  selectBtn = optionMenu.querySelector(".cnc-dropdwndiv .select-btn");  options = document.querySelectorAll(".cnc-dropdwndiv  .option");  sBtn_text = document.querySelector(".cnc-dropdwndiv  .sBtn-text"); 
  optionMenu.classList.toggle("active");
   options.forEach(optionItem2 => { optionItem2.addEventListener('click', (event) => { sBtn_text.innerHTML = event.target.innerHTML; sBtn_text.id = event.target.dataset.value;
   setCookie("storelocationName", event.target.id); setCookie("storelocation", event.target.dataset.value);
   options.forEach(item => item.classList.remove("active")); event.target.parentElement.classList.add("active");
   optionMenu.classList.add('active'); 
   });  });  }
function showdropdown() { try { const selectedLocation = getCookie("storelocationName"); const customerLocation = getCookie("customerlocation"); document.querySelector(".location").value = customerLocation; getLocationsDropdown(selectedLocation); } catch (e) { getLocationsDropdown(null); } }
if (!window.location.pathname.includes('password')) { showdropdown(); }
document.addEventListener("click", event => { if (event.target.classList.contains("cnc-modal-open") || event.target.id.includes("dropdown-icon")) { const popupModal = document.querySelector(".popup-modal"); if (popupModal) { showModal(); } else { document.querySelector('button.cart-btn.button').click(); } } });
document.querySelector(".popup-close-cross").addEventListener("click", event => { event.preventDefault(); const popupModal = document.querySelector(".popup-modal"); popupModal.style.display = "none"; popupModal.classList.remove("showmodal"); });
document.querySelector("button.setlocationbtn.popup-btn").addEventListener("click", event => { showdropdown(); event.preventDefault(); const popupModal = document.querySelector(".popup-modal"); popupModal.style.display = "none"; popupModal.classList.remove("showmodal"); });    