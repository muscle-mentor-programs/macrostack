import { useEffect, useState } from "react";
import BrandWordmark from "../components/BrandWordmark";
import { storeBranding, brandLogoURL } from "./api";
export function BrandIdentity({ name, logo }) {
  return (
    <div className="retail-store-brand">
      <div className="retail-store-identity">
        {logo && (
          <img
            src={logo}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <strong>{name}</strong>
      </div>
      <div className="retail-powered">
        Powered by <BrandWordmark />
      </div>
    </div>
  );
}
export default function StoreBrand({ locationId, revision }) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    if (locationId)
      storeBranding(locationId)
        .then((brand) => {
          if (active) setResult({ id: locationId, brand });
        })
        .catch(() => {
          if (active) setResult(null);
        });
    return () => {
      active = false;
    };
  }, [locationId, revision]);
  return result?.id === locationId && result.brand ? (
    <BrandIdentity
      name={result.brand.name}
      logo={brandLogoURL(result.brand.logo_path)}
    />
  ) : (
    <BrandWordmark />
  );
}
