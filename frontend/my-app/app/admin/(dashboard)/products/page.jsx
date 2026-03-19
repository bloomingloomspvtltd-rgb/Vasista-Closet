"use client";

import { useEffect, useMemo, useState } from "react";

import AdminTopbar from "../../../../components/admin/AdminTopbar";
import { apiFetch, uploadAdminImage } from "../../../../lib/adminApi";

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [categoriesInput, setCategoriesInput] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [status, setStatus] = useState("active");
  const [inventory, setInventory] = useState("");
  const [images, setImages] = useState("");
  const [tags, setTags] = useState("");
  const [sizesInput, setSizesInput] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsInput, setVariantsInput] = useState("");
  const [colorImagesInput, setColorImagesInput] = useState("");
  const [colorDescriptionsInput, setColorDescriptionsInput] = useState("");
  const [uploadColor, setUploadColor] = useState("");
  const [uploadColorTouched, setUploadColorTouched] = useState(false);

  const totalsLabel = useMemo(() => `${products.length} total`, [products.length]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setSku("");
    setCategory("");
    setCategoriesInput("");
    setCustomCategory("");
    setStatus("active");
    setInventory("");
    setImages("");
    setTags("");
    setSizesInput("");
    setHasVariants(false);
    setVariantsInput("");
    setColorImagesInput("");
    setColorDescriptionsInput("");
    setUploadColor("");
    setUploadColorTouched(false);
    setFormError("");
    setUploadError("");
  };

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError("");
    try {
      const data = await apiFetch("/categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setCategoriesError(err?.message || "Failed to load categories.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const handleEdit = (product) => {
    setEditingId(product.id);
    setName(product.name || "");
    setDescription(product.description || "");
    setPrice(product.price ?? "");
    setSku(product.sku || "");
    const productCategories = Array.isArray(product.categories)
      ? product.categories
      : product.category
        ? [product.category]
        : [];
    setCategory(product.category || productCategories[0] || "");
    setCategoriesInput(productCategories.join(", "));
    setStatus(product.status || "active");
    setInventory(product.inventory ?? "");
    setImages((product.images || []).join(", "));
    setTags((product.tags || []).join(", "));
    setSizesInput(formatSizes(product.sizes));
    const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
    const hasVariantRows = Array.isArray(product.variants) && product.variants.length > 0;
    setHasVariants(Boolean(hasColors || hasVariantRows));
    setVariantsInput(formatVariants(product.variants, product.colors));
    setColorImagesInput(formatColorImages(product.colors));
    setColorDescriptionsInput(formatColorDescriptions(product.colors));
    setUploadColor("");
    setUploadColorTouched(false);
    setFormError("");
    setUploadError("");
  };

  const handleDelete = async (product) => {
    if (!confirm(`Delete ${product.name || "this product"}?`)) return;
    setError("");
    try {
      await apiFetch(`/products/${product.id}`, { method: "DELETE" });
      await loadProducts();
      if (editingId === product.id) resetForm();
    } catch (err) {
      setError(err?.message || "Failed to delete product.");
    }
  };

  const handleUpload = async (event) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploadError("");
    setUploading(true);
    try {
      const files = Array.from(fileList);
      const uploads = [];
      for (const file of files) {
        const result = await uploadAdminImage(file);
        const url = result?.url || "";
        if (url) uploads.push(url);
      }
      if (uploads.length === 0) throw new Error("Upload failed");
      if (uploadColor) {
        setColorImagesInput((prev) => {
          const next = addColorImages(prev, uploadColor, uploads);
          return next;
        });
      } else {
        setImages((prev) => {
          const next = prev ? `${prev}, ${uploads.join(", ")}` : uploads.join(", ");
          return next;
        });
      }
    } catch (err) {
      setUploadError(err?.message || "Failed to upload image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleColorUpload = async (event) => {
    if (!uploadColor) {
      setUploadError("Select a color before uploading color-specific images.");
      event.target.value = "";
      return;
    }
    await handleUpload(event);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    const selectedCategories = splitList(categoriesInput);
    const primaryCategory = selectedCategories[0] || category.trim() || null;
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      price: toNumber(price, 0),
      sku: sku.trim() || null,
      category: primaryCategory,
      categories: selectedCategories,
      status,
      inventory: toNumber(inventory, 0),
      images: splitList(images),
      tags: splitList(tags),
      sizes: hasVariants ? [] : parseSizes(sizesInput),
      variants: hasVariants ? parseVariants(variantsInput) : [],
      colors: hasVariants
        ? mergeColors(
            parseColorImages(colorImagesInput),
            parseVariants(variantsInput),
            parseColorDescriptions(colorDescriptionsInput)
          )
        : [],
    };

    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await loadProducts();
      resetForm();
    } catch (err) {
      setFormError(err?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  function parseVariants(value) {
    if (!value.trim()) return [];
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        const [colorRaw, sizesRaw] = line.split(":");
        const color = (colorRaw || "").trim();
        if (!color || !sizesRaw) return [];
        return sizesRaw
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((entry) => {
            const [sizeRaw, countRaw] = entry.split("=").map((part) => part.trim());
            const size = (sizeRaw || "").trim();
            const count = toNumber(countRaw, 0);
            if (!size) return null;
            return { color, size, count: Math.max(0, count) };
          })
          .filter(Boolean);
      });
  }

  function parseSizes(value) {
    if (!value.trim()) return [];
    const entries = value
      .split(/\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [sizeRaw, countRaw] = entry.split("=").map((part) => part.trim());
        const name = (sizeRaw || "").trim();
        if (!name) return null;
        const count = toNumber(countRaw, 0);
        return { name, count: Math.max(0, count) };
      })
      .filter(Boolean);
    const byName = new Map();
    entries.forEach((entry) => {
      if (!entry?.name) return;
      byName.set(entry.name, entry);
    });
    return Array.from(byName.values());
  }

  function deriveColors(variants) {
    if (!Array.isArray(variants)) return [];
    const names = Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean)));
    return names.map((name) => ({ name }));
  }

  function parseColorImages(value) {
    if (!value.trim()) return [];
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf(":");
        if (separatorIndex === -1) return null;
        const nameRaw = line.slice(0, separatorIndex);
        const imagesRaw = line.slice(separatorIndex + 1);
        const name = (nameRaw || "").trim();
        if (!name) return null;
        const images = (imagesRaw || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        return { name, images };
      })
      .filter(Boolean);
  }

  function parseColorDescriptions(value) {
    if (!value.trim()) return [];
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf(":");
        if (separatorIndex === -1) return null;
        const nameRaw = line.slice(0, separatorIndex);
        const descRaw = line.slice(separatorIndex + 1);
        const name = (nameRaw || "").trim();
        const description = (descRaw || "").trim();
        if (!name) return null;
        return { name, description };
      })
      .filter(Boolean);
  }

  function getLastColorFromInput(value) {
    if (!value.trim()) return "";
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return "";
    const last = lines[lines.length - 1];
    const [colorRaw] = last.split(":");
    return (colorRaw || "").trim();
  }

  function addColorImages(currentValue, colorName, uploads) {
    const parsed = parseColorImages(currentValue);
    const byName = new Map(parsed.map((color) => [color.name, color]));
    const entry = byName.get(colorName) || { name: colorName, images: [] };
    const existing = Array.isArray(entry.images) ? entry.images : [];
    const merged = [...existing, ...uploads].filter(Boolean);
    byName.set(colorName, { ...entry, images: merged });
    return formatColorImages(Array.from(byName.values()));
  }

  function mergeColors(colorImages, variants, colorDescriptions) {
    const base = Array.isArray(colorImages) ? colorImages.slice() : [];
    if (Array.isArray(colorDescriptions)) {
      colorDescriptions.forEach((entry) => {
        if (!entry?.name) return;
        const existing = base.find((color) => color.name === entry.name);
        if (existing) {
          existing.description = entry.description || existing.description || null;
        } else {
          base.push({ name: entry.name, images: [], description: entry.description || null });
        }
      });
    }
    const byName = new Map(base.map((color) => [color.name, color]));
    const variantNames = Array.isArray(variants)
      ? Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean)))
      : [];
    variantNames.forEach((name) => {
      if (!byName.has(name)) byName.set(name, { name, images: [] });
    });
    return Array.from(byName.values());
  }

  function formatVariants(variants, colors) {
    if (!Array.isArray(variants) || variants.length === 0) return "";
    const colorOrder = Array.isArray(colors) ? colors.map((c) => c?.name).filter(Boolean) : [];
    const grouped = variants.reduce((acc, variant) => {
      const color = variant?.color || "Color";
      if (!acc[color]) acc[color] = [];
      if (variant?.size) {
        acc[color].push(`${variant.size}=${variant.count ?? 0}`);
      }
      return acc;
    }, {});
    const orderedColors = colorOrder.length > 0 ? colorOrder : Object.keys(grouped);
    return orderedColors
      .map((color) => {
        const sizes = grouped[color];
        if (!sizes || sizes.length === 0) return "";
        return `${color}: ${sizes.join(", ")}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  function formatColorImages(colors) {
    if (!Array.isArray(colors) || colors.length === 0) return "";
    return colors
      .map((color) => {
        const name = color?.name || "";
        const images = Array.isArray(color?.images) ? color.images : [];
        if (!name || images.length === 0) return "";
        return `${name}: ${images.join(", ")}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  function formatColorDescriptions(colors) {
    if (!Array.isArray(colors) || colors.length === 0) return "";
    return colors
      .map((color) => {
        const name = color?.name || "";
        const description = color?.description || "";
        if (!name || !description) return "";
        return `${name}: ${description}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  function formatSizes(sizes) {
    if (!Array.isArray(sizes) || sizes.length === 0) return "";
    if (typeof sizes[0] === "string") return sizes.join(", ");
    return sizes
      .map((size) => {
        const name = size?.name || "";
        if (!name) return "";
        const count = size?.count;
        if (typeof count === "number") return `${name}=${count}`;
        return name;
      })
      .filter(Boolean)
      .join(", ");
  }

  const colorNames = useMemo(() => {
    if (!hasVariants) return [];
    const variants = parseVariants(variantsInput);
    const names = Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean)));
    return names;
  }, [variantsInput, hasVariants]);

  useEffect(() => {
    if (uploadColorTouched) return;
    const lastVariantColor = getLastColorFromInput(variantsInput);
    const lastColorImagesColor = getLastColorFromInput(colorImagesInput);
    const next = lastColorImagesColor || lastVariantColor;
    if (next && colorNames.includes(next)) {
      setUploadColor(next);
    }
  }, [variantsInput, colorImagesInput, colorNames, uploadColorTouched]);

  useEffect(() => {
    if (!uploadColor) return;
    if (colorNames.length === 0) return;
    if (!colorNames.includes(uploadColor)) {
      setUploadColor("");
      setUploadColorTouched(false);
    }
  }, [colorNames, uploadColor]);

  const categoryOptions = useMemo(() => {
    const names = categories
      .map((item) => (item?.name || "").trim())
      .filter(Boolean);
    const extra = splitList(categoriesInput).filter((name) => !names.includes(name));
    if (extra.length > 0) {
      names.unshift(...extra);
    }
    return names;
  }, [categories, categoriesInput]);

  const selectedCategories = useMemo(
    () => splitList(categoriesInput),
    [categoriesInput]
  );

  const updateCategories = (next) => {
    const cleaned = next.map((item) => item.trim()).filter(Boolean);
    setCategoriesInput(cleaned.join(", "));
    setCategory(cleaned[0] || "");
  };

  const toggleCategory = (name) => {
    if (!name) return;
    if (selectedCategories.includes(name)) {
      updateCategories(selectedCategories.filter((item) => item !== name));
    } else {
      updateCategories([...selectedCategories, name]);
    }
  };

  const addCustomCategory = () => {
    const name = customCategory.trim();
    if (!name) return;
    if (!selectedCategories.includes(name)) {
      updateCategories([...selectedCategories, name]);
    }
    setCustomCategory("");
  };

  return (
    <div className="admin-page">
      <AdminTopbar
        title="Products"
        subtitle="Create, edit, and publish catalog items."
      />

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="admin-grid admin-split">
        <div className="admin-card admin-section">
          <div className="admin-section-header">
            <h3>{editingId ? "Edit product" : "New product"}</h3>
            <span>{editingId ? "Updating" : "Add to catalog"}</span>
          </div>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-row">
              <label className="admin-field">
                <span>Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Banarasi silk kurta"
                  required
                />
              </label>
              <label className="admin-field">
                <span>SKU</span>
                <input
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  placeholder="VST-1001"
                />
              </label>
            </div>
            <label className="admin-field">
              <span>Description</span>
              <textarea
                rows="3"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short product description"
              />
            </label>
            <div className="admin-row">
              <label className="admin-field">
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                />
              </label>
              <label className="admin-field">
                <span>Inventory</span>
                <input
                  type="number"
                  min="0"
                  value={inventory}
                  onChange={(event) => setInventory(event.target.value)}
                />
              </label>
            </div>
            <div className="admin-row">
              <div className="admin-field">
                <span>Categories</span>
                <div className="admin-row">
                  <input
                    value={customCategory}
                    onChange={(event) => setCustomCategory(event.target.value)}
                    placeholder="Type a category name"
                  />
                  <button className="admin-secondary" type="button" onClick={addCustomCategory}>
                    Add
                  </button>
                </div>
                {categoryOptions.length > 0 ? (
                  <div className="admin-row">
                    {categoryOptions.map((name) => (
                      <label className="admin-field" key={name}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(name)}
                          onChange={() => toggleCategory(name)}
                        />
                        <span>{name}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
                {selectedCategories.length > 0 ? (
                  <div className="admin-row">
                    {selectedCategories.map((name) => (
                      <button
                        className="admin-pill"
                        type="button"
                        key={name}
                        onClick={() => toggleCategory(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty">No categories selected.</div>
                )}
                {categoriesLoading ? (
                  <div className="admin-empty">Loading categories...</div>
                ) : categoriesError ? (
                  <div className="admin-error">{categoriesError}</div>
                ) : categories.length === 0 ? (
                  <div className="admin-empty">No categories yet.</div>
                ) : null}
              </div>
              <label className="admin-field">
                <span>Status</span>
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>
            <label className="admin-field">
              <span>Image URLs (comma separated)</span>
              <input
                value={images}
                onChange={(event) => setImages(event.target.value)}
                placeholder="https://..."
              />
            </label>
            <label className="admin-field">
              <span>Multiple colors?</span>
              <select
                value={hasVariants ? "yes" : "no"}
                onChange={(event) => setHasVariants(event.target.value === "yes")}
              >
                <option value="no">No (single product)</option>
                <option value="yes">Yes (color variants)</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Upload images</span>
              <input type="file" accept="image/*" multiple onChange={handleUpload} />
            </label>
            <label className="admin-field">
              <span>Attach uploads to color</span>
              <select
                value={uploadColor}
                onChange={(event) => {
                  setUploadColor(event.target.value);
                  setUploadColorTouched(true);
                }}
                disabled={!hasVariants}
              >
                <option value="">All colors (global images)</option>
                {colorNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            {uploading ? <div className="admin-empty">Uploading...</div> : null}
            {uploadError ? <div className="admin-error">{uploadError}</div> : null}
            <label className="admin-field">
              <span>Tags (comma separated)</span>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="silk, festive"
              />
            </label>
            <label className="admin-field">
              <span>Sizes (comma or line separated)</span>
              <input
                value={sizesInput}
                onChange={(event) => setSizesInput(event.target.value)}
                placeholder="S=10, M=5, L=0"
                disabled={hasVariants}
              />
              {hasVariants ? (
                <div className="admin-empty">Sizes are managed inside variants when colors are enabled.</div>
              ) : null}
            </label>
            <label className="admin-field">
              <span>Variants (one color per line)</span>
              <textarea
                rows="3"
                value={variantsInput}
                onChange={(event) => setVariantsInput(event.target.value)}
                placeholder={`Red: S=5, M=3\nBlue: S=2, M=0`}
                disabled={!hasVariants}
              />
            </label>
            <label className="admin-field">
              <span>Color images (one color per line)</span>
              <textarea
                rows="3"
                value={colorImagesInput}
                onChange={(event) => setColorImagesInput(event.target.value)}
                placeholder={`Black: https://.../black1.jpg, https://.../black2.jpg\nYellow: https://.../yellow1.jpg`}
                disabled={!hasVariants}
              />
            </label>
            <label className="admin-field">
              <span>Color descriptions (one color per line)</span>
              <textarea
                rows="3"
                value={colorDescriptionsInput}
                onChange={(event) => setColorDescriptionsInput(event.target.value)}
                placeholder={`Black: Classic black print\nYellow: Bright summer edit`}
                disabled={!hasVariants}
              />
            </label>
            <label className="admin-field">
              <span>Upload color images (uses selected color)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleColorUpload}
                disabled={!hasVariants}
              />
            </label>
            <label className="admin-field">
              <span>Upload color images (uses selected color)</span>
              <input type="file" accept="image/*" multiple onChange={handleColorUpload} />
            </label>
            {formError ? <div className="admin-error">{formError}</div> : null}
            <div className="admin-actions">
              <button className="admin-action" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update product" : "Create product"}
              </button>
              <button className="admin-secondary" type="button" onClick={resetForm}>
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="admin-card admin-section">
          <div className="admin-section-header">
            <h3>Catalog</h3>
            <span>{loading ? "Loading" : totalsLabel}</span>
          </div>
          {loading ? (
            <div className="admin-empty">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="admin-empty">No products yet.</div>
          ) : (
            <div className="admin-table">
              <div className="admin-table-row admin-table-head cols-5">
                <div>Product</div>
                <div>Price</div>
                <div>Inventory</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {products.map((product) => (
                <div className="admin-table-row cols-5" key={product.id}>
                  <div>{product.name}</div>
                  <div>{formatCurrency(product.price)}</div>
                  <div>{product.inventory ?? 0}</div>
                  <div className="admin-pill admin-pill-good">{product.status || "active"}</div>
                  <div className="admin-table-actions">
                    <button className="admin-link" onClick={() => handleEdit(product)}>
                      Edit
                    </button>
                    <button
                      className="admin-link danger"
                      onClick={() => handleDelete(product)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
