import React, { useState, useEffect, useCallback } from "react";
import { Select, Button, ChoiceList, Text } from "@shopify/polaris";
import { PlusIcon, MinusIcon } from "@shopify/polaris-icons";

const SelectComponent = ({
  field,
  inputValues,
  handleconfigChange,
  mango,
  error,
  setHideshow,
  required,
  setRequired
}) => {
  const [fields, setFields] = useState([{ value: "" }]);
  const [showError, setShowError] = useState("");
  const [show, setShow] = useState(true);
  const [choicelistValue, setChoicelistValue] = useState([]);

  useEffect(() => {
    const pluginInputValues = inputValues?.[mango?.plugin_id] || {};
    const fieldInputValues = pluginInputValues[field.name];
    const initialValues = Array.isArray(fieldInputValues)
      ? fieldInputValues
      : [fieldInputValues || ""];

    console.log("Initial Values:", initialValues);
    if (field.multiple === false) {
      setFields((fields) =>
        fields.length === 1 && fields[0].value === ""
          ? initialValues.map((value) => ({ value }))
          : fields,
      );
    } else {
      setChoicelistValue(initialValues);
    }
    const fieldError = error?.find((e) => field?.name === e?.name);
    setShowError(fieldError ? "This field is required." : "");
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

  }, [
    inputValues,
    field.name,
    field.value,
    mango?.plugin_id,
    error,
    field.show_in,
    field.show_in_value,
  ]);

  const handleChange = (value, index) => {
    const newFields = [...fields];
    newFields[index].value = value;
    setFields(newFields);

    handleconfigChange(
      newFields.map((f) => f.value),
      field.name,
      mango?.plugin_id,
    );
  };

  const handleChangec = useCallback(
    (value, index) => {
      const newFields = [...fields];
      newFields[index].value = value;
      setFields(newFields);
      handleconfigChange(
        newFields.map((f) => f.value),
        field.name,
        mango?.plugin_id,
      );
    },
    [fields, handleconfigChange, field.name, mango?.plugin_id],
  );

  const addField = () => {
    setFields([...fields, { value: "" }]);
  };

  console.log("Fields:", fields);
  console.log("Show:", show);

  const removeField = (index) => {
    if (fields.length > 1) {
      const newFields = fields.filter((_, i) => i !== index);
      setFields(newFields);
      handleconfigChange(
        newFields.map((f) => f.value),
        field.name,
        mango?.plugin_id,
      );
    }
  };

  return (
    <>
      <Text variant="headingMd" as="h6">
        {field.label}
      </Text>
      <Text>{field.description}</Text>
      <div style={{ display: "flex", gap: "12px" }}>
        {show && (
          <div style={{ margin: "4px", width: "100%" }}>
            {field.is_cloneable ? (
              fields.map((fieldData, index) => (
                <div
                  key={`${field.name}_${index}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    maxHeight: "150px",
                    overflow: "auto",
                    marginBottom: "18px",
                  }}
                >
                  {field.multiple ? (
                    <ChoiceList
                      allowMultiple
                      title=""
                      choices={field.options}
                      selected={choicelistValue}
                      onChange={(value) => handleChangec(value, index)}
                      requiredIndicator={field.required}
                      error={showError ?? showError}
                    />
                  ) : (
                    <div className="select-os" style={{ width: "100%" }}>
                      <Select
                        name={`${field.name}_${index}`}
                        label={field.label}
                        labelHidden="true"
                        style={{ width: "100%" }}
                        options={
                          field.options[0]?.value !== ""
                            ? [{ value: "", label: "Select" }, ...field.options]
                            : field.options
                        }
                        onChange={(value) => handleChange(value, index)}
                        value={fieldData.value}
                        required={field.required}
                        // helpText={field.description}
                        requiredIndicator={field.required}
                        error={showError ?? showError}
                      />
                    </div>
                  )}
                  {fields.length > 1 && (
                    <Button
                      icon={MinusIcon}
                      onClick={() => removeField(index)}
                      plain
                    />
                  )}
                  {index === fields.length - 1 && (
                    <Button icon={PlusIcon} onClick={addField} plain />
                  )}
                </div>
              ))
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: "18px",
                  width: "100%",
                  maxHeight: "150px",
                  overflow: "auto",
                }}
              >
                {field.multiple ? (
                  <ChoiceList
                    allowMultiple
                    title=""
                    choices={field.options}
                    selected={choicelistValue}
                    requiredIndicator={field.required}
                    error={showError ?? showError}
                    onChange={(value) => {
                      setChoicelistValue(value);
                      handleChangec(value, 0); // Update parent component
                    }}
                  />
                ) : (
                  <div className="select-os" style={{ width: "100%" }}>
                    <Select
                      name={field.name}
                      label={field.label}
                      labelHidden="true"
                      style={{ width: "100%" }}
                      options={
                        field.options[0]?.value !== ""
                          ? [{ value: "", label: "Select" }, ...field.options]
                          : field.options
                      }
                      onChange={(value) => handleChange(value, 0)}
                      value={fields[0].value}
                      required={field.required}
                      // helpText={field.description}
                      requiredIndicator={field.required}
                      error={showError ?? showError}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SelectComponent;