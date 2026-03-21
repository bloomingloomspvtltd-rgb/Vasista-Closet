
"use client";

import { useEffect, useMemo, useState } from "react";

import AdminTopbar from "../../../../components/admin/AdminTopbar";
import { apiFetch, uploadAdminImage } from "../../../../lib/adminApi";
import { getRuntimeApiBase } from "../../../../lib/apiBase";

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

function normalizeImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  const base = getRuntimeApiBase();
  if (url.startsWith("/")) return `${base}${url}`;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return `${base}${parsed.pathname}${parsed.search}`;
      }
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${base}${parsed.pathname}`;
      }
    } catch (err) {
      return url;
    }
    return url;
  }
  return `${base}/${url}`;
}

function getPrimaryImage(product) {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  if (colors.length > 0) {
    const firstColor = colors[0];
    const colorImages = Array.isArray(firstColor?.images) ? firstColor.images : [];
    if (colorImages.length > 0) return normalizeImageUrl(colorImages[0]);
    if (firstColor?.image) return normalizeImageUrl(firstColor.image);
  }
  const images = Array.isArray(product?.images) ? product.images : [];
  if (images.length > 0) return normalizeImageUrl(images[0]);
  return "";
}

function getInventoryInfo(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (variants.length > 0) {
    const total = variants.reduce(
      (sum, variant) => sum + toNumber(variant?.count ?? 0, 0),
      0
    );
    const variantCount = variants.filter((variant) => variant?.size || variant?.color).length;
    return {
      count: total,
      label: `${total} in stock for ${variantCount || 0} variants`,
    };
  }
  const inventory = toNumber(product?.inventory ?? 0, 0);
  return {
    count: inventory,
    label: `${inventory} in stock`,
  };
}

function getStatusTone(status) {
  const value = (status || "active").toLowerCase();
  if (value === "active") return "admin-status-good";
  if (value === "draft") return "admin-status-warn";
  if (value === "archived") return "admin-status-neutral";
  return "admin-status-info";
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
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const statusCounts = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        const value = (product?.status || "active").toLowerCase();
        acc[value] = (acc[value] || 0) + 1;
        acc.all += 1;
        return acc;
      },
      { all: 0, active: 0, draft: 0, archived: 0 }
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const statusValue = (product?.status || "active").toLowerCase();
      if (activeTab !== "all" && statusValue !== activeTab) return false;
      if (!normalizedSearch) return true;
      const categoriesList = Array.isArray(product?.categories)
        ? product.categories
        : product?.category
          ? [product.category]
          : [];
      const haystack = [product?.name, product?.sku, ...categoriesList]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [products, activeTab, searchQuery]);

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
    setShowForm(true);
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
      setShowForm(false);
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
        subtitle="Manage your catalog and inventory from one place."
        actionLabel="Add product"
        onAction={() => {
          resetForm();
          setShowForm(true);
        }}
      />

      <div className="admin-products-toolbar">
        <div className="admin-products-actions">
          <button className="admin-products-action" type="button">Export</button>
          <button className="admin-products-action" type="button">Import</button>
          <button className="admin-products-action" type="button">More actions</button>
        </div>
        <div className="admin-products-search">
          <input
            type="search"
            placeholder="Search products"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <section className="admin-products-metrics">
        <div className="admin-metric-card">
          <div className="admin-metric-label">Average sell-through rate</div>
          <div className="admin-metric-value">2.45%</div>
          <div className="admin-metric-sub">Last 30 days</div>
        </div>
        <div className="admin-metric-card">
          <div className="admin-metric-label">Products by days of inventory remaining</div>
          <div className="admin-metric-value">No data</div>
          <div className="admin-metric-sub">Connect sales to unlock insights.</div>
        </div>
        <div className="admin-metric-card">
          <div className="admin-metric-label">ABC product analysis</div>
          <div className="admin-metric-value">₹0.00</div>
          <div className="admin-metric-sub">A ₹0.00 · B ₹0.00 · C ₹0.00</div>
        </div>
      </section>

      <section className="admin-products-card">
        <div className="admin-products-tabs">
          {[
            { id: "all", label: "All", count: statusCounts.all },
            { id: "active", label: "Active", count: statusCounts.active },
            { id: "draft", label: "Draft", count: statusCounts.draft },
            { id: "archived", label: "Archived", count: statusCounts.archived },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`admin-products-tab ${activeTab === tab.id ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span>{tab.count}</span>
            </button>
          ))}
        </div>

        {error ? <div className="admin-error">{error}</div> : null}

        <div className="admin-products-table">
          <div className="admin-products-row admin-products-head">
            <div className="admin-products-checkbox">
              <input type="checkbox" aria-label="Select all products" />
            </div>
            <div>Product</div>
            <div>Status</div>
            <div>Inventory</div>
            <div>Category</div>
            <div>Channels</div>
            <div className="admin-products-actions-col">Actions</div>
          </div>

          {loading ? (
            <div className="admin-products-empty">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="admin-products-empty">No products found.</div>
          ) : (
            filteredProducts.map((product) => {
              const imageUrl = getPrimaryImage(product);
              const inventoryInfo = getInventoryInfo(product);
              const primaryCategory = product?.category || (product?.categories || [])[0] || "-";
              const statusValue = (product?.status || "active").toLowerCase();
              return (
                <div className="admin-products-row" key={product.id}>
                  <div className="admin-products-checkbox">
                    <input type="checkbox" aria-label={`Select ${product.name}`} />
                  </div>
                  <div className="admin-product-cell">
                    <div className="admin-product-media">
                      <div className="admin-product-thumb">
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.name || "Product"} />
                        ) : (
                          <span>No image</span>
                        )}
                      </div>
                      <div>
                        <div className="admin-product-name">{product.name || "Untitled product"}</div>
                        <div className="admin-product-sub">{product.sku || "No SKU"}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className={`admin-status ${getStatusTone(statusValue)}`}>
                      {statusValue}
                    </span>
                  </div>
                  <div>
                    <div className={`admin-products-inventory ${inventoryInfo.count <= 0 ? "is-low" : ""}`}>
                      {inventoryInfo.label}
                    </div>
                  </div>
                  <div className="admin-products-category">{primaryCategory}</div>
                  <div className="admin-products-channels">3</div>
                  <div className="admin-products-actions-col">
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
              );
            })
          )}
        </div>
      </section>
      {showForm ? (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <div>
                <h3>{editingId ? "Edit product" : "New product"}</h3>
                <p>{editingId ? "Update details and save." : "Add a new product to your catalog."}</p>
              </div>
              <button
                className="admin-link"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Close
              </button>
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
              {formError ? <div className="admin-error">{formError}</div> : null}
              <div className="admin-actions">
                <button className="admin-action" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update product" : "Create product"}
                </button>
                <button
                  className="admin-secondary"
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
