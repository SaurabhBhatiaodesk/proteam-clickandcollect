// @ts-check

// Use JSDoc annotations for type safety.
/**
 * @typedef {import("../generated/api").InputQuery} InputQuery
 * @typedef {import("../generated/api").FunctionResult} FunctionResult
 * @typedef {import("../generated/api").Operation} Operation
 */

// The @shopify/shopify_function package will use the default export as your function entrypoint.
export default /**
 * @param {InputQuery} input
 * @returns {FunctionResult}
 */
(input) => {
  // Check if the cart has an attribute with the key "locationSend" and get its value
  const locationAttribute = input.cart.locationShow && input.cart.locationShow.value;

  console.log(JSON.stringify(locationAttribute), null, 2, "xxxxxxxxxxxxxxxxxx");


  // Array to store operations
  let operations = [];

  // If the attribute exists, find matching locations
  if (locationAttribute) {
    const matchingLocations = input.locations.filter(
      (location) => location.name === locationAttribute
    );

    // Add matching locations to the operations array
    if (matchingLocations.length > 0) {
      matchingLocations.forEach((location) => {
        operations.push({
          add: {
            title: location.name,
            cost: 0.0, // or any cost logic you want to apply
            pickupLocation: {
              locationHandle: location.handle,
              pickupInstruction: "Ready for pickup now!", // or any pickup instruction logic
            },
          },
        });
      });
    }
  }

  // Log the operations for debugging
  console.log(JSON.stringify(operations), null , 2 , "checked operations data");

  // Return the operations (empty if no matches found)
  return { operations };
};
