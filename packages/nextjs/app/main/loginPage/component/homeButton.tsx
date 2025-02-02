import React from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

interface Props {
    buttonLabel: string;
    linkDest: string;
}

const HomeBtn: React.FC<Props> = ({ linkDest, buttonLabel }) => {
    return (
        <Link href={linkDest}>
            <button className="btn btn-sm flex items-center gap-2 p-2">
                <FontAwesomeIcon icon={faHome} className="h-4 w-4" />
                <span>{buttonLabel}</span>
            </button>
        </Link>
    );
};

export default HomeBtn;
