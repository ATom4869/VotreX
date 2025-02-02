import React from "react";

interface Props {
  buttonLabel: string;
}

const ButtonA: React.FC<Props> = ({ buttonLabel }) => {
  return (
    <div>
      <button type="submit" className="btn btn-accent btn-sm shadow-sm px-8">
        {buttonLabel}
      </button>
    </div>
  );
};

export default ButtonA;
