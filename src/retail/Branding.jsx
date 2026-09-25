import { brandColors, brandStyle, validBrandColor, validBrandColors, defaultBrandColors, themeColorFields, gradientLayers } from "./brandColors";
import { useState } from "react";
import { Alert, Button, Field, Select, Check, useAction } from "./ui";
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
  const [colors, setColors] = useState(() => brandColors(organization.brand_colors));
  const colorsValid = validBrandColors(colors);
  const [notice, setNotice] = useState("");
  const { busy, error, run } = useAction();
  async function persist(path) {
    await saveBranding(organization.id, name.trim(), path, colors);
    setLogo(path);
    setNotice("Branding saved across all company stores.");
    await onSaved();
  }
  return (
    <section id="retail-branding" className="retail-section retail-store-scroll-target" tabIndex={-1}>
      <h2 className="retail-store-section-heading">Branding</h2>
      <p className="retail-muted">
        Set one company identity for every store and connected customer view.
        Only chain administrators can change the logo, display name, and colors.
      </p>
      <div className="retail-theme-preview" data-retail-theme="dark" style={brandStyle(colors)}>
        <header><BrandIdentity name={name || organization.name} logo={brandLogoURL(logo)}/></header>
        <nav><strong>Today</strong><span>Customers</span><span>Inbox</span></nav>
        <div className="retail-theme-preview-body"><h3>Your store workspace</h3><p>A preview of your colors, surfaces, and typography.</p><article><h4>Customer nutrition</h4><p>Meal plans, progress, and conversations in one place.</p><span className="retail-theme-preview-input">Customer name</span><span className="retail-brand-preview-action">Open customer</span></article></div>
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
        <div className="retail-theme-settings">
          <div className="retail-theme-settings-heading"><div><h3>Portal colors</h3><p>Use hex codes or the color picker to customize your portal. Save branding to apply it across your stores.</p></div><Button type="button" disabled={busy} onClick={()=>{setColors({...defaultBrandColors});setNotice('MacroStack default colors restored in the preview. Save branding to apply.');}}>Reset to MacroStack defaults</Button></div>
          {[
            ['Brand & buttons',['primary','secondary','buttonEnd','buttonText'],'button'],
            ['Page background',['background','backgroundEnd'],'background'],
            ['Cards & panels',['card','cardEnd'],'card'],
            ['Text, borders & inputs',['text','muted','heading','border','input','inputText'],null],
            ['Navigation bar',['nav','navEnd','navText'],'nav'],
            ['Headers',['header','headerEnd','headerText'],'header'],
          ].map(([title,keys,layer])=><details className="retail-theme-group" key={title}><summary>{title}</summary><div className="retail-theme-fields">{keys.map(key=><div className="retail-theme-color" key={key}><Field label={themeColorFields[key]} value={colors[key]} onChange={value=>setColors(c=>({...c,[key]:value.trim()}))} placeholder={defaultBrandColors[key]} pattern="#[0-9a-fA-F]{6}" maxLength={7} required/><input aria-label={`${themeColorFields[key]} picker`} type="color" value={validBrandColor(colors[key])?colors[key]:defaultBrandColors[key]} onChange={e=>setColors(c=>({...c,[key]:e.target.value.toUpperCase()}))}/></div>)}</div>{layer&&<div className="retail-theme-gradient"><Check checked={colors[`${layer}Gradient`]} onChange={value=>setColors(c=>({...c,[`${layer}Gradient`]:value}))}>{gradientLayers[layer]} gradient</Check><Select label={`${gradientLayers[layer]} gradient direction`} value={colors[`${layer}Angle`]} onChange={value=>setColors(c=>({...c,[`${layer}Angle`]:Number(value)}))}>{[0,45,90,100,115,135,180,225,270,315,360].map(angle=><option key={angle} value={angle}>{angle}°</option>)}</Select></div>}</details>)}
        </div>
        <label className="retail-field">
          <span>Upload your company logo</span>
          <input
            type="file"
            accept="image/png,image/webp"
            disabled={busy || !name.trim() || !colorsValid}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              run(async () => {
                const png = await transparentPNG(file);
                const path = await uploadBrandLogo(organization.id, png);
                try {
                  await saveBranding(organization.id, name.trim(), path, colors);
                } catch (e) {
                  await removeBrandLogo(path).catch(() => {});
                  throw e;
                }
                setLogo(path);
                setNotice("Logo saved across all company stores.");
                await onSaved();
              });
            }}
          />
          <small>
            PNG or WebP, transparent background, up to 2 MB. Uploading saves
            your logo, display name, and colors. Logos are publicly viewable brand
            assets.
          </small>
        </label>
        <div className="retail-actions">
          <Button primary type="submit" disabled={busy || !colorsValid}>
            {busy ? "Saving…" : "Save branding"}
          </Button>
          {logo && (
            <Button
              type="button"
              disabled={busy || !colorsValid}
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
