import React from "react";

const UnAuthorizedPage = () => {
  return (
    <div className="error-container" style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>This page is under maintenance</h2>
      <div style={{ width: "480px", margin: "0 auto" }}>
        <iframe
          allow="fullscreen"
          frameBorder="0"
          height="271px"
          className="giphy-embed"
          src="https://giphy.com/embed/Sk3KytuxDQJQ4"
          width="480px"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default UnAuthorizedPage;
