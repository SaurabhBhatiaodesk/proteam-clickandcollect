import React, { useState, useCallback, useEffect } from 'react';
import {
  Tooltip,
  Icon,
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  Button,
  ButtonGroup,
  Checkbox,
  TextField,
  Select,
  RadioButton,
  FormLayout,
  ActionList,
  Thumbnail,
  Avatar
} from "@shopify/polaris";
const Cards=({type,field})=>{
    console.log('type,field ',type,field)
    return(
        <div style={{ width: '48%' }}>
                          {(() => {
                            switch (type) {
                              case 'url':
                                return (
                                  <TextField
                                    label={field.label}
                                    value={inputValues[field.name] || field.value}
                                    onChange={(value) => handleChange(value, field.name)}
                                    name={field.name}
                                    type="url"
                                    required={field.required}
                                    helpText={field.description}
                                  />
                                );
                              case 'text':
                              case 'password':
                                return (
                                  <TextField
                                    label={field.label}
                                    value={inputValues[field.name] || field.value}
                                    onChange={(value) => handleChange(value, field.name)}
                                    name={field.name}
                                    type={field.type}
                                    required={field.required}
                                    helpText={field.description}
                                  />
                                );
                              case "select":
                                return (
                                  <>
                                {field?.options.length > 0 && 
                                
                                      
                                      <Select
                                        label={field.label}
                                        options={field.options}
                                        // onChange={handleSelectChange}
                                        // value={selected}
                                      />
                                    
                                   
                                 }
                                 </>
                                 );
                                case "radio": 
                                 return (
                                  <>
                                   <Text as="h2" variant="bodyMd">
                                     {field.label}
                                  </Text>
                                  {field?.options?.map((option) => (
                                    <RadioButton
                                      label={option.label}
                                      // helpText={field.label}
                                      checked={option.value === 'disabled'}
                                      id={field.id}
                                      name={field.name}
                                      // onChange={handleChange}
                                    />
                                ))}
                                </>
                              );
                              
                              default:
                            return null;
                            }
                          })()}
                        </div>
    );
}
export default Cards;
