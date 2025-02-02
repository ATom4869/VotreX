"use client";

import React, { useState } from "react";

const RadioButton = () => {
  const [selectedOption, setSelectedOption] = useState("");

  const handleOptionChange = (event: { target: { value: React.SetStateAction<string> } }) => {
    setSelectedOption(event.target.value);
  };

  return (
    <form>
      Organization Type
      <br />
      <hr />
      <label className="btn btn-secondary">
        <input
          type="radio"
          value="Organization"
          checked={selectedOption === "Organization"}
          onChange={handleOptionChange}
        />
        Organization
      </label>
      <label className="btn btn-secondary">
        <input type="radio" value="Corporate" checked={selectedOption === "Corporate"} onChange={handleOptionChange} />
        Corporate
      </label>
    </form>
  );
};

export default RadioButton;
