import React from "react";

interface Props {
  buttonLabel: string;
}

const ButtonA: React.FC<Props> = ({ buttonLabel }) => {
  return (
    <div>
      <button type="submit" className="btn btn-secondary btn-sm">
        {buttonLabel}
      </button>
    </div>
  );
};

export default ButtonA;
