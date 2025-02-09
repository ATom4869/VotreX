import React from "react";
import Link from "next/link";

interface Props {
  buttonLabel: string;
  linkDest: string;
}

const ButtonB: React.FC<Props> = ({ linkDest, buttonLabel }) => {
  return (
    <Link href={linkDest}>
      <button type="submit" className="btn btn-info btn-sm px-6">
        {buttonLabel}
      </button>
    </Link>
  );
};

export default ButtonB;
