import React, { useState, useEffect } from 'react';
import { RadioButton, Text } from "@shopify/polaris";

const RadioGroupComponent = ({ field, inputValues, handleconfigChange, mango, error, setHideshow }) => {
  const [selectedValue, setSelectedValue] = useState('');
  const [showError, setShowError] = useState('');
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Ensure inputValues and inputValues.general are defined before accessing them
    const initialValue = inputValues?.[mango?.plugin_id]?.[field.name] || '';
    const pluginInputValues = inputValues?.[mango?.plugin_id] || {};
    const fieldInputValues = pluginInputValues[field.name];
    setSelectedValue(initialValue);
    error?.map((e)=>{
      if(field?.name==e?.name){
          console.log('"This field is required."',field.name);
        setShowError("This field is required.");
      }
    })

    const valuesString = field.show_in_value;
let valueToCheck = pluginInputValues[field.show_in];

for (const key in inputValues) {
  if (inputValues[key]?.[field.show_in]) {
    valueToCheck = inputValues[key][field.show_in];
  }
}

if (valuesString) {
  const valuesArray = valuesString.split(",");
  const valueToCheckArray = valueToCheck ? valueToCheck.split(",") : [];

  // Check if any value in valueToCheckArray exists in valuesArray
  const showField = valueToCheckArray.some((value) =>
    valuesArray.includes(value.trim())
  );

  setShow(showField);
  setHideshow((prevState) => ({
    ...prevState,
    [field.name]: showField,
  }));
}
  }, [inputValues, field.name, error]);

  const handleChange = (value) => {
    setSelectedValue(value);
    handleconfigChange(value, field.name, mango?.plugin_id);
  };

  return (
    <>

      <Text variant="headingMd" as="h6">
        {field.label}
      </Text>
      <Text >
        {field.description}
      </Text>
      <div style={{display: "flex", gap: "0px", flexDirection:'column', marginBottom: '18px'}}>
        {field?.options?.map((option) => (
          <RadioButton
            key={option.value}
            label={option.label}
            checked={selectedValue === option.value}
            id={field.id}
            name={field.name}
            value={option.value}
            required={field.required}
            onChange={() => handleChange(option.value)}
            requiredIndicator={field.required}

          />
        ))}
        <span style={{ color: "red" }}>{showError}</span>
      </div>
    </>
  );
};

export default RadioGroupComponent;