import { useState } from "react";
import { Alert, Button, Field, useAction } from "./ui";
import {
  brandLogoURL,
  uploadBrandLogo,
  saveBranding,
  removeBrandLogo,
} from "./api";
import { BrandIdentity } from "./StoreBrand";

async function transparentPNG(file) {
  if (
    !["image/png", "image/webp"].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  )
    throw new Error("Choose a transparent PNG or WebP up to 2 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width > 4096 || bitmap.height > 4096)
      throw new Error("Choose a logo no larger than 4096 × 4096 pixels.");
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = false,
      visible = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 255) transparent = true;
      if (pixels[i] > 0) visible = true;
    }
    if (!transparent || !visible)
      throw new Error("Use a visible logo with a transparent background.");
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Could not prepare this image.")),
        "image/png",
      ),
    );
  } finally {
    bitmap.close();
  }
}
export default function Branding({ organization, onSaved }) {
  const [name, setName] = useState(
    organization.brand_name || organization.name,
  );
  const [logo, setLogo] = useState(organization.logo_path);
  const [notice, setNotice] = useState("");
  const { busy, error, run } = useAction();
  async function persist(path) {
    await saveBranding(organization.id, name.trim(), path);
    setLogo(path);
    setNotice("Branding saved. Your store portal is updated.");
    await onSaved();
  }
  return (
    <section id="retail-branding" className="retail-card">
      <h2>Store logo & portal branding</h2>
      <p className="retail-muted">
        Make this workspace feel like your business. Shared across your
        locations and connected customer store views.
      </p>
      <div className="retail-brand-preview">
        <BrandIdentity
          name={name || organization.name}
          logo={brandLogoURL(logo)}
        />
      </div>
      <Alert error={error} />
      {notice && <p role="status">{notice}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => persist(logo));
        }}
      >
        <Field
          label="Portal display name"
          value={name}
          onChange={setName}
          required
          maxLength={80}
        />
        <label className="retail-field">
          <span>Upload your store logo</span>
          <input
            type="file"
            accept="image/png,image/webp"
            disabled={busy || !name.trim()}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              run(async () => {
                const png = await transparentPNG(file);
                const path = await uploadBrandLogo(organization.id, png);
                try {
                  await saveBranding(organization.id, name.trim(), path);
                } catch (e) {
                  await removeBrandLogo(path).catch(() => {});
                  throw e;
                }
                setLogo(path);
                setNotice("Logo saved. Your store portal is updated.");
                await onSaved();
              });
            }}
          />
          <small>
            PNG or WebP, transparent background, up to 2 MB. Uploading saves
            your logo and display name. Logos are publicly viewable brand
            assets.
          </small>
        </label>
        <div className="retail-actions">
          <Button primary type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save display name"}
          </Button>
          {logo && (
            <Button
              type="button"
              disabled={busy}
              onClick={() => run(() => persist(null))}
            >
              Remove logo
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
