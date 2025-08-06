import React, { useState, useEffect } from 'react';
import { TextField, Button, Text } from "@shopify/polaris";
import { PlusIcon, MinusIcon } from '@shopify/polaris-icons';

const TextFieldComponent = ({ field, inputValues, handleconfigChange, mango, error, setHideshow,required,
  setRequired }) => {
  const [fields, setFields] = useState([{ value: '' }]); // For multiple fields
  const [singleField, setSingleField] = useState(''); // For single field
  const [showError, setShowError] = useState('');
  const [show, setShow] = useState(true);

  useEffect(() => {
    console.log("inputValues", inputValues);

    // Handle initial values based on whether the field is cloneable or not
    const pluginInputValues = inputValues?.[mango?.plugin_id] || {};
    const fieldValue = inputValues?.[mango?.plugin_id]?.[field.name] || field?.value || '';
    const initialValues = Array.isArray(fieldValue)
      ? fieldValue
      : (typeof fieldValue === 'string' ? fieldValue.split(',') : [fieldValue]);

    // Check if the field is cloneable (multiple values) or not
    if (field.is_cloneable) {
      // Initialize fields for multiple values
      setFields(
        initialValues.map(value => ({
          value: typeof value === 'string' ? value.trim() : ''
        }))
      );

    } else {
      // Initialize single field value
      setSingleField(initialValues[0] || ''); // Use the first value if multiple values are returned
    }

    const fieldError = error?.find(e => field?.name === e?.name);
    setShowError(fieldError ? "This field is required." : '');

    if (!field.show_in_value) {
      return; // Exit early if `field.show_in_value` is null or undefined
    }

    const valuesString = field.show_in_value; // Safe to use now
    const keysToCheckString = field.show_in || ""; // Ensure this is a string

    let valueToCheck = null;

    // Split `field.show_in` into multiple keys safely
    const keysToCheck = keysToCheckString.split(",").map((key) => key.trim());

    // Loop through keys and find the first matching value
    for (const key of keysToCheck) {
      if (pluginInputValues[key]) {
        valueToCheck = pluginInputValues[key];
        break; // Stop checking once a matching key is found
      }

      for (const inputKey in inputValues) {
        if (inputValues[inputKey]?.[key]) {
          valueToCheck = inputValues[inputKey][key];
          break; // Stop checking once a matching key is found
        }
      }
    }

    // Process `valuesString` and `valueToCheck` if available
    if (valueToCheck) {
      // Split values for both single and comma-separated cases
      const valuesArray = valuesString.split(",").map((value) => value.trim());
      const valueToCheckArray = valueToCheck.includes(",")
        ? valueToCheck.split(",").map((value) => value)
        : [valueToCheck]; // Handle single value as an array

      // Check if any value in `valueToCheckArray` exists in `valuesArray`
      const showField = valueToCheckArray.some((value) =>
        valuesArray.includes(value)
      );

      setShow(showField);
           // Update `requireds` if the field is shown
  if (showField) {
    const alreadyExists = required.some((item) => item.name === field.name);
    if (!alreadyExists) {
      //const updatedRequireds = [...required, { plugin: item.plugin, name: field.name }];
      //setRequired(updatedRequireds);
    }
  } else {
    // Remove from `requireds` if not shown
    const updatedRequireds = required.filter(
      (item) => item.name !== field.name
    );
    setRequired(updatedRequireds);
  }
      setHideshow((prevState) => ({
        ...prevState,
        [field.name]: showField,
      }));
    } else {
      // Handle cases where valueToCheck is not available
      setShow(false);
      setHideshow((prevState) => ({
        ...prevState,
        [field.name]: false,
      }));
    }

  }, [inputValues, field.name, field.value, mango?.plugin_id, error, field.show_in, field.show_in_value]);

  const handleChange = (value, index) => {
    if (field.is_cloneable) {
      const newFields = [...fields];
      newFields[index].value = value;
      setFields(newFields);
      handleconfigChange(newFields.map(f => f.value), field.name, mango?.plugin_id);
    } else {
      setSingleField(value);
      handleconfigChange(value, field.name, mango?.plugin_id);
    }
  };

  const addField = () => {
    setFields([...fields, { value: '' }]);
  };

  const removeField = (index) => {
    if (fields.length > 1) {
      const newFields = fields.filter((_, i) => i !== index);
      setFields(newFields);
      handleconfigChange(newFields.map(f => f.value), field.name, mango?.plugin_id);
    }
  };

  return (
    <>
    <Text variant="headingMd" as="h6">
        {field.label}
      </Text>
      <Text>{field.description}</Text>
      <div style={{display: "flex", gap: "12px", marginBottom: '18px'}}>
      {show && (
        <div style={{ margin: "4px" }}>
          {field.is_cloneable ? (
            // Multiple fields handling
            fields.map((fieldData, index) => (
              <div key={`${field.name}_${index}`} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                <TextField
                  label={field.label}
                  labelHidden="true"
                  value={fieldData.value}
                  onChange={(value) => handleChange(value, index)}
                  name={`${field.name}_${index}`}
                  type={field.input_type}
                  required
                //  helpText={field.description}
                  requiredIndicator={field.required}
                  error={showError ?? showError}
                />
                <span style={{ margin: "-3px 0px 0px 0px", padding: "5px",display:'flex' }}>
                  {fields.length > 1 && (
                    <Button icon={MinusIcon} onClick={() => removeField(index)} plain />
                  )}
                  {index === fields.length - 1 && field.is_cloneable && (
                    <span style={{ marginLeft: "5px" }}>
                      <Button icon={PlusIcon} onClick={addField} plain />
                    </span>
                  )}
                </span>
              </div>
            ))
          ) : (
            // Single field handling
            <TextField
              label={field.label}
              labelHidden="true"
              value={singleField}
              onChange={handleChange}
              name={field.name}
              type={field.input_type}
              required
            //  helpText={field.description}
              requiredIndicator={field.required}
              error={showError ?? showError}
            />
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default TextFieldComponent;