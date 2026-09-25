import { useEffect, useState } from "react";
import BrandWordmark from "../components/BrandWordmark";
import { storeBranding, brandLogoURL } from "./api";
export function BrandIdentity({ name, logo, titleBadge = null }) {
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
        <strong>{name}{titleBadge}</strong>
      </div>
      <div className="retail-powered">
        Powered by <BrandWordmark />
      </div>
    </div>
  );
}
export default function StoreBrand({ locationId, organization, revision, fallbackLogo = null, titleBadge = null }) {
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
  const brand = (result?.id === locationId && result.brand) || (organization && {
    name: organization.brand_name || organization.name,
    logo_path: organization.logo_path,
  });
  return brand ? (
    <BrandIdentity
      name={brand.name}
      logo={brandLogoURL(brand.logo_path) || fallbackLogo}
      titleBadge={titleBadge}
    />
  ) : (
    <BrandWordmark />
  );
}
