import React from "react";
import "./FloatingLogo.css";

export default function FloatingLogo() {
  return (
    <div className="floating-logo" title="Project authors">
      <div className="logo-icon">T</div>
      <div className="logo-content">
        <div className="logo-title">Project created by</div>
        <ul className="logo-names">
          <li>Mahadevappa B Gunjal</li>
          <li>Shridhar k Kori</li>
          <li>Sujay Hiremath</li>
          <li>Suraj chikkamath</li>
        </ul>
      </div>
    </div>
  );
}
