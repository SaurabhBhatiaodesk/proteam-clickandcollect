async function cartUpdate(updates, flag = false) {
	try {
		let response = await fetch("/cart/update.js", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				updates: updates
			})
		});
		if (response.ok) {
			let cartResponse = await fetch("/cart.json");
			let cartData = await cartResponse.json();
			if(cartData.item_count == 0){
				location.reload();
			}
			if (flag == true) {
				let errorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
				for (let i = 0; i < errorMessages.length; i++) {
					let errorMessage = errorMessages[i];
					errorMessage.closest(".cart-grid").remove();
				}
				document.querySelector(".remove-allitem").style.display = "none";
			}
			let checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
			checkoutButton.disabled = false;
			checkoutButton.classList.remove("disabled");
		
			fetchInventoryForCartItems(cartData);
			let totalPrice = parseFloat((cartData.original_total_price / 100).toFixed(2)).toLocaleString("en-UA", {
				style: "currency",
				currency: cartData.currency
			});

			document.querySelector(".cart-right .sub-total .totals__subtotal-value").innerHTML = totalPrice;
			localStorage.setItem("testings", JSON.stringify([]));
		}
	} catch (error) {
		console.error("Error:", error);
	}
}
async function getCartLocations(selectedLocationName = "") {

	// console.log('1111111 ')
	try {
		var count = 0;
		const pickuplcurl = `https://clickncollect-12d7088d53ee.herokuapp.com/api/pickupLocation?shop=${hostname}`;
        const testres = await fetchData(pickuplcurl); 

		let arrr = localStorage.getItem("testings");
		if(!arrr){
		arrr = JSON.parse(arrr);
		// // // console.log('arrrr : ',arrr, ' testres : ',typeof(testres))
		}
		const sortedLocations = []; 
		// // console.log('testres ',testres);
		if (testres?.data?.locations?.nodes?.length > 0) {
			const locations = testres?.data?.locations?.nodes;
			const destinationsArr = []; if (locations) {
				for (const location of locations) {
					if (location.address.zip && location?.localPickupSettingsV2 != null) {
						destinationsArr.push(`${location.address.address1} ${location.address.city} ${location.address.zip} ${location.address.province} ${location.address.country}`);
					}
				}
			}
			// console.log('destinationsArr ',destinationsArr);
			let locationsElement = document.querySelector(".address-popup11 .locationss");
			let locationsElement2 = document.querySelector(".address-popup11");
			if(locationsElement){ locationsElement.innerHTML = ""; }
			locationsElement2.classList.add('loader');
			let km='yes';
			if (destinationsArr.length > 0) {
				// // console.log('10')
				let customerLocation = getCookie("customerlocation");
				document.querySelector(".location").value = customerLocation;
				let distanceApiUrl = `https://clickncollect-12d7088d53ee.herokuapp.com/api/distance?customerlocation=${customerLocation}&shop=${hostname}`;
				let res = await fetchData(distanceApiUrl);		
				// // console.log('res ',res);
				let locationData = [];	
				for (const location of locations) {
					// // console.log('11')
					if (location.address.zip && location?.localPickupSettingsV2 != null) {
						// // console.log('12')
						const zipcode = location.address.zip; const fulladdress = location.address.address1 + ' ' + zipcode;
						for (let index = 0; index < destinationsArr.length; index++) {
							// // console.log('13')
							const distanceElement = res?.rows[0]?.elements[index]; const destinationAddress = destinationsArr[index];
							if (destinationAddress.includes(zipcode)) {
								// // console.log('14')
								if (distanceElement?.status == "OK"  && distanceElement?.distance?.value < res?.kilometer) {
									// // console.log('15')
									const distanceText = distanceElement?.distance.text;
									const parsedDistance = parseInt(distanceText.replace(/,/g, "").replace(" km", ""));
									sortedLocations.push({
										id: location.id,
										distance: parsedDistance,
										distanceText,
										origin: res.origin_addresses,
										...location
									});
									locationData.push(location.name);
									count = count +1;
								}else if (distanceElement?.status == "OK"  && distanceElement?.distance?.value > 1){
									km='no';
								}
							}
						}
					}
				}
		
				sortedLocations.sort((a, b) => a.distance - b.distance);
				let locationsss = locationData.join(', ');
				setCookie('sortedLocations', locationsss);
				// // console.log('sortedLocations ',sortedLocations)
			
				for (let i = 0; i < sortedLocations.length; i++) {
					let location = sortedLocations[i];
					let loc = location?.name;
				
					let radioBtnDiv = document.createElement("div");
					radioBtnDiv.classList.add("col-os", "radio-btn");
					if (arrr?.[loc]) {
						radioBtnDiv.classList.add("green");
					}
				
					let radioInput = document.createElement("input");
					radioInput.type = "radio";
					radioInput.id = location.id;
					radioInput.name = "location";
					radioInput.value = location.name;
					radioInput.classList.add("locations");

					if (selectedLocationName === location.name) {
						radioInput.checked = true;
					}    
				
					let label = document.createElement("label");
					label.htmlFor = location.id;
				
					let spanRadioText = document.createElement("span");
					spanRadioText.classList.add("radio-text-os");
				
					let spanRadioTitle = document.createElement("span");
					spanRadioTitle.classList.add("radio-title-os");
					spanRadioTitle.textContent = location.name;
				
					let spanRadioDistance = document.createElement("span");
					spanRadioDistance.classList.add("radio-distance-os");
					spanRadioDistance.textContent = location.distanceText;
				
					spanRadioText.appendChild(spanRadioTitle);
					spanRadioText.appendChild(spanRadioDistance);
					label.appendChild(spanRadioText);
					radioBtnDiv.appendChild(radioInput);
					radioBtnDiv.appendChild(label);
					if(radioBtnDiv){ locationsElement.appendChild(radioBtnDiv); }
				}
			}	if(count == 0 && km=='no'){
				// console.log('20 -------------------- ')
				if(locationsElement){ locationsElement.innerHTML = ""; }
				let noStoresElement = document.createElement("div");
				noStoresElement.classList.add('loader');
				noStoresElement.classList.add("popup-inner-col11");
				noStoresElement.innerHTML = '<div class="add11">Stores are not available within a 50 km range</div>';
				locationsElement.appendChild(noStoresElement);
			}else if(count == 0 && km=='yes' && sortedLocations.length == 0) {
				// console.log('21 ---------------- ')
				if(locationsElement){ locationsElement.innerHTML = ""; }
				let noStoresElement = document.createElement("div");
				noStoresElement.classList.add('loader');
				noStoresElement.classList.add("popup-inner-col11");
				noStoresElement.innerHTML = '<div class="add11">Stores not available for entered location</div>';
				locationsElement.appendChild(noStoresElement);
			}
			// console.log('sortedLocations ',sortedLocations, ' count ',count, destinationsArr, ' ---  destinationsArr' )

			document.querySelector(".address-popup11").style.display = "block";
			document.querySelectorAll('.cart-popup .loader').forEach(function(element) {
				element.classList.remove('loader');
			});
			
		}
	} catch (error) {
		console.error("Error getting cart locations:", error);
	}
}
async function get_inv_locations( product) {     
	try {       
		// // // console.log('product',product);   
		let response = await fetch(`https://clickncollect-12d7088d53ee.herokuapp.com/api/cart?product_id=${product.product_id}&shop=${hostname}`);
		if (response.ok) {
			let data = await response.json();
			handle_inv_locations(null, data.data, product);   
		} else {
			let error = new Error("Request failed");
			handle_inv_locations(error, null, product);
		}
	} catch (error) {
		handle_inv_locations(error, null, product);
	}
}
function filterlocations(data, product, quantity) {
	// // // console.log('data  ---- ',data);
	let variantId = product.variant_id;
	let getSortedLocations = getCookie('sortedLocations');
	let sortedLocations = [];
	let sorted = {};

	if (getSortedLocations) {
		sortedLocations = getSortedLocations.split(', ');
	}

	for (let i = 0; i < sortedLocations.length; i++) {
		const storeLocationName = sortedLocations[i];
		if (typeof(storeLocationName) === "string") {
			sorted[storeLocationName] = false;
		  } 
	}
	var isInStock = true;
	// data = data.data;
	// // console.log('data filterlocations ',data)
	for (let j = 0; j < data?.product?.variants?.nodes?.length; j++) {
		let variant = data.product.variants.nodes[j];
		let variantIdParts = variant?.id.split("/");     
		// // // console.log('---- variantIdParts ',variantIdParts,' variant :', variant, '  variantId : ', variantId);
		let currentVariantId = variantIdParts[variantIdParts.length - 1];
		if (currentVariantId == variantId) {
			isInStock = false;
			if (variant.inventoryItem && variant.inventoryItem.inventoryLevels) {
				for (let k = 0; k < variant.inventoryItem.inventoryLevels.edges.length; k++) {
					let inventoryLevel = variant.inventoryItem.inventoryLevels.edges[k].node;
					let locationName = inventoryLevel.location.name;
					let storeLocationName = sortedLocations.find(name => name == locationName);
					if (storeLocationName) {
						if(inventoryLevel.quantities[0].quantity > quantity && inventoryLevel.quantities[0].quantity >= product.quantity){
							isInStock = true;
							sorted[storeLocationName] = isInStock;
						}
					}
				}
			}
		}
	}

	// console.log('sorted inn  ',sorted);
		let arrr = JSON.parse(localStorage.getItem("testings") || "[]");
		if(!arrr){
			localStorage.setItem("testings", JSON.stringify(sorted));
		}else{
			for (let i = 0; i < sortedLocations.length; i++) {
				const storeLocationName = sortedLocations[i];
					if (sorted[storeLocationName] == true && arrr[storeLocationName] == false) {
						sorted[storeLocationName] = false; 
					}
			}

		}     

	return sorted;
}


async function handle_inv_locations(error, data, product) {

	if (error) { console.error("Error fetching inventory locations:", error); return; }
	// // console.log('handle data ', data, ' product ----- ',product, 'quantityesss ',data.quantity)
	 let arrr = filterlocations(data, product, data.quantity);
	//  console.log('arrr kkkkkk  : ',arrr);
	document.querySelectorAll('.cart-popup .radio-btn .locations').forEach((element) => {
		let isInStock = false;
		
		Object.keys(arrr).forEach((key) => {
			if (element.value == key && arrr[key] == true) {
			isInStock = true;
		  }
		});

		if (isInStock) {
		  element.parentElement.style.color = 'green';
		  element.closest('.radio-btn').classList.remove('out-stock');
		  element.closest('.radio-btn').classList.add('in-stock');
		} else {
		  element.closest('.radio-btn').classList.remove('in-stock');
		  element.closest('.radio-btn').classList.add('out-stock');
		  element.parentElement.style.color = '';
		}
	  });     
	  	// // // console.log('arrr localStorage.setItem ',arrr);

	  localStorage.setItem("testings", JSON.stringify(arrr));
	
	let variantId = product.variant_id;
	let storeLocationName = getCookie("storelocationName");
	// data= data.data;
	
	// // console.log('data handle_inv_locations',data.product.variants.nodes);
	for (let i = 0; i < data.product.variants.nodes.length; i++) {
		let variant = data.product.variants.nodes[i];
		// // // console.log('variant.id ',variant);
		let variantIdParts = variant?.id.split("/");
		let currentVariantId = variantIdParts[variantIdParts.length - 1];
		// // console.log('currentVariantId ',currentVariantId, ' variantId ', variantId)
		if (currentVariantId == variantId) {
			let isInStock = false;
			// // console.log('1');
			if (variant.inventoryItem && variant.inventoryItem.inventoryLevels) {
				// // console.log('2');
				for (let j = 0; j < variant.inventoryItem.inventoryLevels.edges.length; j++) {
					// // console.log('3');
					let inventoryLevel = variant.inventoryItem.inventoryLevels.edges[j].node;
					let locationName = inventoryLevel.location.name;
					if (storeLocationName === locationName) {
						// // console.log('4');
						isInStock = inventoryLevel.quantities[0].quantity > data.quantity && inventoryLevel.quantities[0].quantity >= product.quantity;
					}
				}
			}
			let cartGrids = document.querySelectorAll(".cart-grid");
			for (let k = 0; k < cartGrids.length; k++) {
				let cartGrid = cartGrids[k];
				if (cartGrid.dataset.id == variantId) {
					// // console.log('5')
					let errorMessage = cartGrid.querySelector(".error-massage");
					if (isInStock) {
						// // console.log('6');
						errorMessage.style.display = "none";
						errorMessage.classList.remove("active");
					} else {
						// // console.log('7');
						cartGrid.querySelector(".error-massage .locationsname").textContent = storeLocationName;
						errorMessage.style.display = "block";
						errorMessage.classList.add("active");
					}
				}
			}
		}
	}
	// // console.log('8');

	let hasActiveErrors = document.querySelectorAll(".cart-grid p.error-massage.active").length > 0;
	let removeAllItemButton = document.querySelector(".remove-allitem");
	let checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
	removeAllItemButton.style.display = hasActiveErrors ? "flex" : "none";
	checkoutButton.disabled = hasActiveErrors;
	checkoutButton.classList.toggle("disabled", hasActiveErrors);
	// // console.log('9');
}
async function fetch_inventory_for_cart_items( cartItems) {
	let cartGrids = document.querySelectorAll(".cart-grid");
	for (let i = 0; i < cartGrids.length; i++) {
		let cartGrid = cartGrids[i];
		let cartGridId = cartGrid.dataset.id;
		let cartItem = cartItems.find(item => item.variant_id == cartGridId);
		if (cartItem) {
			let quantityElement = cartGrid.querySelector(".item-quantities span b");
			let quantityInput = cartGrid.querySelector(".item-quantities .quantity input");
			if (quantityElement) {
				quantityElement.textContent = cartItem.quantity;
				quantityInput.value = cartItem.quantity;
			}    
			cartGrid.classList.add("matched");
			get_inv_locations( cartItem);
		} else {
			cartGrid.style.display = "none";
		}
	}
	let unmatchedCartGrids = document.querySelectorAll(".cart-grid:not(.matched)");
	for (let i = 0; i < unmatchedCartGrids.length; i++) {
		let unmatchedCartGrid = unmatchedCartGrids[i];
		unmatchedCartGrid.style.display = "none";
	}
}

async function init() {
	let storeLocationName = getCookie("customerlocation");
	const pickupLocationSelect = document.querySelector('.cls-pickuplocations-select');
	if (pickupLocationSelect !== null && pickupLocationSelect.value !== "") {
		pickupLocationSelect.value = storeLocationName;
	}

	
	let cartResponse = await fetch("/cart.js");
	if (cartResponse.ok) {
		let cartData = await cartResponse.json();
		fetch_inventory_for_cart_items(cartData.items);
	}

}
init();

function handleInventoryLocations(error, productData, cartData) {
	if (error) {
		console.error("Error fetching inventory locations:", error);
		return;
	}
	let variantId = cartData.variant_id;
	let storeLocationName = getCookie("storelocationName");
	let cartGridElements = document.querySelectorAll(".cart-grid");
	for (var i = 0; i < productData.product.variants.nodes.length; i++) {
		var variant = productData.product.variants.nodes[i];
		let variantIds = variant.id.split("/");
		let id = variantIds[variantIds.length - 1];
		if (id == variantId) {
			let isAvailable = false;
			if (variant.inventoryItem && variant.inventoryItem.inventoryLevels) {
				for (var j = 0; j < variant.inventoryItem.inventoryLevels.edges.length; j++) {
					var inventoryLevel = variant.inventoryItem.inventoryLevels.edges[j].node;
					let locationName = inventoryLevel.location.name;
					if (storeLocationName == locationName) {
						isAvailable = (inventoryLevel.quantities[0].quantity > 2) && (inventoryLevel.quantities[0].quantity >= cartData.quantity);
					} else if (!locationName || locationName == "undefined") {
						isAvailable = true;
					}
				}
			}
			for (var k = 0; k < cartGridElements.length; k++) {
				var cartGrid = cartGridElements[k];
				if (cartGrid.dataset.id == variantId) {
					var errorMessage = cartGrid.querySelector(".error-massage");
					if (isAvailable) {
						errorMessage.style.display = "none";
						errorMessage.classList.remove("active");
					} else {
						var locationNameElement = cartGrid.querySelector(".error-massage .locationsname");
						locationNameElement.textContent = storeLocationName;
						errorMessage.style.display = "block";
						errorMessage.classList.add("active");
					}
				}
			}
		}
	}
	var activeErrorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
	if (activeErrorMessages.length > 0) {
		if (activeErrorMessages.length > 1){ document.querySelector(".remove-allitem").style.display = "flex"; }
		var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
		checkoutButton.disabled = true;
		checkoutButton.classList.add("disabled");
	} else {
		document.querySelector(".remove-allitem").style.display = "none";
		var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
		checkoutButton.disabled = false;
		checkoutButton.classList.remove("disabled");
	}
}
async function fetchInventoryForCartItems(data) {
	var cartItems = data.items;
	var currency = data.currency;
	var cartGridElements = document.querySelectorAll(".cart-grid");
	for (var i = 0; i < cartGridElements.length; i++) {
		var cartGrid = cartGridElements[i];
		var variantId = cartGrid.dataset.id;
		var matched = false;

		for (var j = 0; j < cartItems.length; j++) {
			var cartItem = cartItems[j];
			if (cartItem.variant_id == variantId) {
				matched = true;
			let quantityElement = cartGrid.querySelector(".item-quantities span b");
			let quantityInput = cartGrid.querySelector(".item-quantities .quantity input");
			if (quantityElement) {
				quantityElement.textContent = cartItem.quantity;
				quantityInput.value = cartItem.quantity;
			}    
				let itemprice = parseFloat((cartItem.line_price / 100).toFixed(2)).toLocaleString("en-US", {
					style: "currency",
					currency: currency
				});
				cartGrid.querySelector("span.price.price--end").innerHTML = itemprice;
			}
		}
		var totalPrice = parseFloat((data.original_total_price / 100).toFixed(2)).toLocaleString("en-US", {
			style: "currency",
			currency: currency
		});
		document.querySelector(".cart-right .sub-total .totals__subtotal-value").innerHTML = totalPrice;
		if (matched) {
			cartGrid.classList.add("matched");
			cartGrid.classList.remove("unmatched");
		} else {
			cartGrid.classList.remove("matched");
			cartGrid.classList.add("unmatched");
		}
	}
	for (var i = 0; i < cartGridElements.length; i++) {
		var cartGrid = cartGridElements[i];
		if (cartGrid.classList.contains("unmatched")) {
			cartGrid.remove();
		}
	}
	for (var i = 0; i < cartItems.length; i++) {
		get_inv_locations(cartItems[i]);
	}
}
fetch("/cart.json")
	.then(function (response) {
		return response.json();
	}).then(function (data) {
		var cartItems = data.items;
			fetchInventoryForCartItems(data);
			var currency = data.currency;
			var totalPrice = parseFloat((data.original_total_price / 100).toFixed(2)).toLocaleString("en-US", {
				style: "currency",
				currency: currency
			});
			document.querySelector(".cart-right .sub-total .totals__subtotal-value").innerHTML = totalPrice;
	}).catch(function (error) {
		console.error("Error fetching cart items:", error);
	});
document.addEventListener("change", function (event) {
	if (event.target.matches(".radio-cart.locationss input.locations")) {
		var variantIds = [];
		setCookie("storelocation", event.target.id);
		document.querySelectorAll(".cart-right .cart-border .cart-grid").forEach(function (cartGrid) {
			variantIds.push(cartGrid.dataset.id);
		});
		setCookie("storelocationName", event.target.value);
		const pickupLocationSelect = document.querySelector('.cls-pickuplocations-select');
		if (pickupLocationSelect !== null && pickupLocationSelect.value !== "") {
			pickupLocationSelect.value = event.target.id;
		}

		fetch("/cart.json").then(function (response) {
			return response.json();
		}).then(function (data) {
			var cartItems = data.items;
				fetchInventoryForCartItems(data);
				var activeErrorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
				if (activeErrorMessages.length > 0) {
					if (activeErrorMessages.length > 1){ document.querySelector(".remove-allitem").style.display = "flex"; }
					var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
					checkoutButton.disabled = true;
					checkoutButton.classList.add("disabled");
				} else {
					document.querySelector(".remove-allitem").style.display = "none";
					var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
					checkoutButton.disabled = false;
					checkoutButton.classList.remove("disabled");
				}
				var currency = data.currency;
				var totalPrice = parseFloat((data.original_total_price / 100).toFixed(2)).toLocaleString("en-US", {
					style: "currency",
					currency: currency
				});
				document.querySelector(".cart-right .sub-total .totals__subtotal-value").innerHTML = totalPrice;
		}).catch(function (error) {
			console.error("Error fetching cart items:", error);
		});
	}
});
document.addEventListener("click", function (event) {
	if (event.target.matches(".check-btn-os button")) {
		let locationsElement = document.querySelector(".address-popup11 .locationss");
		let customerLocation = document.querySelector(".location").value;
		var storeLocationName = getCookie("storelocationName");
		var Location = getCookie("customerlocation");
		if(customerLocation != Location  ){
			if(locationsElement){ locationsElement.innerHTML=""; }
			locationsElement.classList.add('loader');
			getCartLocations( storeLocationName);		
			setCookie("customerlocation", customerLocation);
		}
		// let dropdownlocation = getCookie("storelocation");
		// const pickupLocationSelect = document.querySelector('.cls-pickuplocations-select');
		// if (pickupLocationSelect !== null && pickupLocationSelect.value !== "") {
		// 	pickupLocationSelect.value = dropdownlocation;
		// }
	}
	if (event.target.matches("button.cart-btn.button")) {
		localStorage.setItem("testings", JSON.stringify([]));
		document.body.classList.add("bg-hidden");
		document.querySelector(".cart-popup").style.display = "block";
		var storeLocationName = getCookie("storelocationName");
		var customerLocation = getCookie("customerlocation");
		document.querySelector(".location").value = customerLocation;
		document.querySelector(".locationsname").textContent = storeLocationName;
		fetch("/cart.json")
			.then(function (response) {
				return response.json();
			})
			.then(function (data) {
				var cartItems = data.items;
					getCartLocations( storeLocationName);
					fetchInventoryForCartItems(data);
				}).catch(function (error) {
				console.error("Error fetching cart items:", error);
			});
	}
	if (event.target.closest(".cart-remove-button a")) {
		event.preventDefault();
		var cartGrid = event.target.closest(".cart-grid");
		if (cartGrid) {
			var cartUpdateData = {};
			cartUpdateData[cartGrid.getAttribute("data-id")] = 0;
			cartUpdate(cartUpdateData);
			cartGrid.remove();
			var activeErrorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
			if (activeErrorMessages.length > 0) {
				document.querySelector(".remove-allitem").classList.remove("hide");
				if (activeErrorMessages.length > 1) {document.querySelector(".remove-allitem").style.display = "flex"; }
				var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
				checkoutButton.disabled = true;
				checkoutButton.classList.add("disabled");
			} else {
				document.querySelector(".remove-allitem").style.display = "none";
				var checkoutButton = document.querySelector("button.cart-btn.gotocheckout.checkoutbtn");
				checkoutButton.disabled = false;
				checkoutButton.classList.remove("disabled");
				document.querySelector(".remove-allitem").classList.add("hide");
			}
		}
	}
	if (event.target.matches(".cross")) {
		document.querySelector(".cart-popup").style.display = "none";
		document.body.classList.remove("bg-hidden");
		location.reload();
	}
	if (event.target.matches(".gotocheckout")) {
		if (event.target.classList.contains("checkoutbtn")) {
			
			const selectedLocation = getCookie("storelocationName"); const customerLocation = getCookie("customerlocation");
			console.log(customerLocation, ' --  selectedLocation -- ',selectedLocation);
			event.preventDefault();
			fetch("/cart/update.js", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					attributes: {
						'customerLocationName' : selectedLocation,
						"customerLocationPinCode" : customerLocation,
						"_order tag": true
					}
				})
			})
				.then(function (response) {
					if (response.ok) {
						document.location.href = "/cart/checkout";
					}
				})
				.catch(function (error) {
					console.error("Error:", error);
				});
		} else {
			document.location.href = "/cart/checkout";
		}
	}
	if (event.target.matches(".remove-allitem")) {
		event.preventDefault();
		if (confirm("Are you sure you want to proceed?")) {
			var cartUpdateData = {};
			document.querySelectorAll(".cart-grid p.error-massage.active").forEach(function (errorMessage) {
				cartUpdateData[errorMessage.parentElement.dataset.id] = 0;
			});
					cartUpdate(cartUpdateData, true);
					let errorMessages = document.querySelectorAll(".cart-grid p.error-massage.active");
					for (let i = 0; i < errorMessages.length; i++) {
						let errorMessage = errorMessages[i];
						errorMessage.closest(".cart-grid").remove();
					}
					document.querySelector(".remove-allitem").style.display = "none";
					localStorage.setItem("testings", JSON.stringify([]));
				
		}
	}
});

(function () {
	// Select all quantity containers
	const quantityContainers = document.querySelectorAll(".quantity");
  
	quantityContainers.forEach(container => {
	  const minusBtn = container.querySelector(".minus");
	  const plusBtn = container.querySelector(".plus");
	  const inputBox = container.querySelector(".input-box");
  
	  updateButtonStates();
  
	  container.addEventListener("click", handleButtonClick);
	  inputBox.addEventListener("input", handleQuantityChange);
  
	  function updateButtonStates() {
		const value = parseInt(inputBox.value);
		minusBtn.disabled = value <= 1;
		plusBtn.disabled = value >= parseInt(inputBox.max);
	  }
  
	  function handleButtonClick(event) {
		if (event.target.classList.contains("minus")) {
		  decreaseValue();
		} else if (event.target.classList.contains("plus")) {
		  increaseValue();
		}
	  }
  
	  function decreaseValue() {
		let value = parseInt(inputBox.value);
		value = isNaN(value) ? 1 : Math.max(value - 1, 1);
		inputBox.value = value;
		updateButtonStates();
		handleQuantityChange();
	  }
  
	  function increaseValue() {
		let value = parseInt(inputBox.value);
		value = isNaN(value) ? 1 : Math.min(value + 1, parseInt(inputBox.max));
		inputBox.value = value;
		updateButtonStates();
		handleQuantityChange();
	  }
  
	  function handleQuantityChange() {
		let value = parseInt(inputBox.value);
		value = isNaN(value) ? 1 : value;
  
		const cartGrid = container.closest('.cart-grid');
		const dataId = cartGrid ? cartGrid.getAttribute('data-id') : null;
		var cartUpdateData = {};
		cartUpdateData[dataId] = value;
		cartUpdate(cartUpdateData);
		console.log(cartUpdateData," --  Quantity changed:", value);
		console.log("Parent cart-grid data-id:", dataId);
  
	  }
	});
  })();