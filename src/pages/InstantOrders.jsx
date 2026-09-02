import React, { useState, useEffect, useMemo } from 'react';
import './CreateOrder.css';

// Server domain base URL
const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// SVG Fallback for missing product images
const FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23475569" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

// Helper function to resolve relative image paths to full URLs safely
const resolveImageUrl = (imagesData) => {
  if (!imagesData) return FALLBACK_IMAGE;

  let firstImage = null;

  if (Array.isArray(imagesData) && imagesData.length > 0) {
    firstImage = imagesData[0];
  } else if (typeof imagesData === 'string') {
    if (imagesData.startsWith('http://') || imagesData.startsWith('https://') || imagesData.startsWith('data:') || imagesData.startsWith('blob:')) {
      return imagesData;
    }
    try {
      const parsed = JSON.parse(imagesData);
      firstImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : imagesData;
    } catch {
      firstImage = imagesData;
    }
  }

  if (!firstImage) return FALLBACK_IMAGE;
  if (firstImage.startsWith('http://') || firstImage.startsWith('https://') || firstImage.startsWith('data:') || firstImage.startsWith('blob:')) {
    return firstImage;
  }

  const baseUrl = (SERVER_BASE_URL || '').replace(/\/+$/, '');
  const cleanPath = firstImage.startsWith('/') ? firstImage : `/${firstImage}`;
  return `${baseUrl}${cleanPath}`;
};

export default function InstantOrders() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sellBy, setSellBy] = useState('admin');
  const [cart, setCart] = useState([]);
  const [viewMode, setViewMode] = useState('pos'); // 'pos' | 'invoice'
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [itemInputs, setItemInputs] = useState({});

  // Helper to extract stored Auth Token
  const getAuthToken = () => localStorage.getItem('authToken');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setErrorMessage('');
    try {
      const token = getAuthToken();
      const headers = {
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${SERVER_BASE_URL}/api/admin/products`, { headers });
      const result = await response.json();

      if (response.ok) {
        const productList = Array.isArray(result) ? result : (result.data || []);
        setProducts(productList);
      } else {
        setErrorMessage(result.message || 'Failed to load products list from API.');
      }
    } catch (error) {
      console.error('Product Fetch Error:', error);
      setErrorMessage('Unable to connect to product server endpoint.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleInputChange = (productId, field, value) => {
    setItemInputs((prev) => ({
      ...prev,
      [productId]: {
        quantity: 1,
        discount: 0,
        sellPrice: products.find((p) => p.id === productId)?.selling_price || products.find((p) => p.id === productId)?.price || 0,
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const getInputs = (product) => {
    return (
      itemInputs[product.id] || {
        quantity: 1,
        discount: 0,
        sellPrice: product.selling_price || product.price || 0,
      }
    );
  };

  const handleAddToCart = (product) => {
    const inputs = getInputs(product);
    const qty = parseInt(inputs.quantity) || 1;
    const price = parseFloat(inputs.sellPrice) || parseFloat(product.selling_price) || parseFloat(product.price) || 0;
    const discount = parseFloat(inputs.discount) || 0;

    const itemTotalPrice = Math.max(0, (price - discount) * qty);
    const existingIndex = cart.findIndex((item) => item.product_id === product.id);

    const resolvedImg = resolveImageUrl(product.images || product.image || product.image_url);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const existing = updatedCart[existingIndex];
      const newQty = existing.products_quantity + qty;
      const updatedTotalPrice = Math.max(0, (price - discount) * newQty);

      updatedCart[existingIndex] = {
        ...existing,
        products_price: price,
        products_discount: discount,
        products_quantity: newQty,
        products_total_price: updatedTotalPrice,
        sell_by: sellBy || 'admin',
      };
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          products_name: product.name,
          products_price: price,
          products_discount: discount,
          products_quantity: qty,
          products_total_price: itemTotalPrice,
          sell_by: sellBy || 'admin',
          image: resolvedImg,
        },
      ]);
    }
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.id && p.id.toString().includes(searchQuery))
    );
  }, [products, searchQuery]);

  const totals = useMemo(() => {
    const totalQty = cart.reduce((acc, item) => acc + item.products_quantity, 0);
    const totalDiscount = cart.reduce(
      (acc, item) => acc + item.products_discount * item.products_quantity,
      0
    );
    const totalPrice = cart.reduce((acc, item) => acc + item.products_total_price, 0);
    return { totalQty, totalDiscount, totalPrice };
  }, [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage('');

    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
      items: cart.map(({ image, ...rest }) => rest),
    };

    try {
      const response = await fetch(`${SERVER_BASE_URL}/api/admin/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setCompletedOrder(result.data);
        setIsCartOpen(false);
        setViewMode('invoice');
        setCart([]);
      } else {
        setErrorMessage(result.message || 'Validation error when processing order.');
      }
    } catch (error) {
      console.error('API Error:', error);
      setErrorMessage('Could not connect to backend endpoint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="tauri-app-wrapper">
      {/* -------------------------------------------------------------------
          RESPONSIVE PRINT DOCUMENT CONTAINER 
          (Hidden on screen, rendered cleanly on print)
         ------------------------------------------------------------------- */}
      {completedOrder && (
        <div className="print-only-invoice">
          <header className="print-header">
            <div>
              <h1 className="print-brand-title">ZINZIRA OS</h1>
              <p className="print-brand-subtitle">Official Transaction Invoice</p>
            </div>
            <div className="print-meta-box">
              <div><strong>Invoice #:</strong> {completedOrder.order_number || `#ORD-${completedOrder.id}`}</div>
              <div><strong>Date:</strong> {new Date(completedOrder.created_at || Date.now()).toLocaleDateString()}</div>
              <div><strong>Status:</strong> PAID IN FULL</div>
            </div>
          </header>

          <div className="print-customer-bar">
            <span><strong>Customer Type:</strong> Counter Sale</span>
            <span><strong>Total Items:</strong> {completedOrder.total_quantity}</span>
          </div>

          <table className="print-invoice-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Sell By</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Disc</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {completedOrder.items?.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{item.products_name}</strong>
                    <div className="print-item-sub">ID: #{item.product_id}</div>
                  </td>
                  <td>{item.sell_by || 'admin'}</td>
                  <td className="text-right">${parseFloat(item.products_price || 0).toFixed(2)}</td>
                  <td className="text-right">{item.products_quantity}</td>
                  <td className="text-right">${(parseFloat(item.products_discount || 0) * item.products_quantity).toFixed(2)}</td>
                  <td className="text-right font-bold">${parseFloat(item.products_total_price || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="print-total-container">
            <div className="print-total-card">
              <span className="print-total-label">Grand Total Paid</span>
              <span className="print-total-amount">${parseFloat(completedOrder.total_price || 0).toFixed(2)}</span>
            </div>
          </div>

          <footer className="print-footer">
            <span>Thank you for your business! • ZinziraOS Enterprise</span>
            <span>System Generated Receipt</span>
          </footer>
        </div>
      )}

      {/* -------------------------------------------------------------------
          SCREEN VIEW LAYOUT
         ------------------------------------------------------------------- */}
      {viewMode === 'pos' ? (
        <div className="pos-viewport">
          <header className="top-nav">
            <div className="search-bar-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search products by title or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="top-nav-right">
              <div className="staff-selector">
                <label>Sell By</label>
                <input
                  type="text"
                  value={sellBy}
                  onChange={(e) => setSellBy(e.target.value)}
                  className="staff-input"
                  placeholder="admin"
                />
              </div>

              <button className="cart-trigger-btn" onClick={() => setIsCartOpen(true)}>
                <span>🛒 Cart</span>
                {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
              </button>
            </div>
          </header>

          {errorMessage && <div className="error-banner">{errorMessage}</div>}

          <main className="catalog-scroll-area">
            {loadingProducts ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Fetching Inventory Data...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-catalog">
                <p>No products match your query.</p>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => {
                  const inputs = getInputs(product);
                  const imageUrl = resolveImageUrl(product.images || product.image || product.image_url);

                  return (
                    <div key={product.id} className="product-card">
                      <div className="card-media">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_IMAGE;
                          }}
                        />
                        <span className="product-badge">ID #{product.id}</span>
                      </div>

                      <div className="card-body">
                        <h3 className="product-title">{product.name}</h3>

                        <div className="card-input-grid">
                          <div className="input-field">
                            <label>Sell ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={inputs.sellPrice}
                              onChange={(e) =>
                                handleInputChange(product.id, 'sellPrice', e.target.value)
                              }
                            />
                          </div>

                          <div className="input-field">
                            <label>Disc ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={inputs.discount}
                              onChange={(e) =>
                                handleInputChange(product.id, 'discount', e.target.value)
                              }
                            />
                          </div>

                          <div className="input-field">
                            <label>Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={inputs.quantity}
                              onChange={(e) =>
                                handleInputChange(product.id, 'quantity', e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <button
                          className="add-to-cart-btn"
                          onClick={() => handleAddToCart(product)}
                        >
                          + Add to Order
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          {/* Full Height Drawer Overlay */}
          {isCartOpen && (
            <div className="modal-backdrop" onClick={() => setIsCartOpen(false)}>
              <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="cart-header">
                  <div className="cart-title">
                    <h2>Order Summary</h2>
                    <span className="badge">{cart.length} items</span>
                  </div>
                  <button className="close-btn" onClick={() => setIsCartOpen(false)}>✕</button>
                </div>

                <div className="cart-items-list">
                  {cart.length === 0 ? (
                    <div className="empty-cart">
                      <p>Your current order list is empty.</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product_id} className="cart-item">
                        <img
                          src={item.image || FALLBACK_IMAGE}
                          alt={item.products_name}
                          className="cart-item-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_IMAGE;
                          }}
                        />
                        <div className="cart-item-details">
                          <h4>{item.products_name}</h4>
                          <p>
                            {item.products_quantity} × ${parseFloat(item.products_price).toFixed(2)}
                            {item.products_discount > 0 && (
                              <span className="discount-tag">
                                {' '}(-${(parseFloat(item.products_discount) * item.products_quantity).toFixed(2)})
                              </span>
                            )}
                          </p>
                          <small className="sell-by-label">By: {item.sell_by}</small>
                        </div>
                        <div className="cart-item-right">
                          <span className="cart-item-total">
                            ${parseFloat(item.products_total_price).toFixed(2)}
                          </span>
                          <button
                            className="remove-btn"
                            onClick={() => handleRemoveFromCart(item.product_id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="cart-footer">
                  <div className="summary-row">
                    <span>Total Items</span>
                    <strong>{totals.totalQty}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Total Discount</span>
                    <strong className="text-discount">-${totals.totalDiscount.toFixed(2)}</strong>
                  </div>
                  <div className="summary-row total-row">
                    <span>Grand Total</span>
                    <strong>${totals.totalPrice.toFixed(2)}</strong>
                  </div>

                  <button
                    className="checkout-btn"
                    disabled={cart.length === 0 || isSubmitting}
                    onClick={handleCheckout}
                  >
                    {isSubmitting ? 'Processing Order...' : 'Checkout & Generate Invoice'}
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      ) : (
        /* Invoice Screen View */
        <div className="invoice-mode-container">
          <div className="invoice-actions no-print">
            <button className="btn-secondary" onClick={() => setViewMode('pos')}>
              ← Return to Terminal
            </button>
            <button className="btn-primary" onClick={handleTriggerPrint}>
              🖨️ Print / Save PDF
            </button>
          </div>

          <div className="invoice-document">
            <header className="invoice-header">
              <div className="company-branding">
                <div className="logo-placeholder">Z</div>
                <div>
                  <h1 className="company-title">ZINZIRA OS</h1>
                  <p className="company-sub">Enterprise Management Terminal</p>
                </div>
              </div>
              <div className="invoice-badge">
                <h2>INVOICE</h2>
                <p className="order-no">{completedOrder?.order_number}</p>
              </div>
            </header>

            <div className="invoice-meta-grid">
              <div>
                <span className="meta-label">Billed To</span>
                <p className="meta-value">Counter Sale</p>
              </div>
              <div>
                <span className="meta-label">Date Issued</span>
                <p className="meta-value">
                  {new Date(completedOrder?.created_at || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <span className="meta-label">Status</span>
                <p className="meta-value status-paid">PAID IN FULL</p>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Sell By</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Discount</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {completedOrder?.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{item.products_name}</strong>
                      <div className="item-sub">ID: #{item.product_id}</div>
                    </td>
                    <td>{item.sell_by}</td>
                    <td className="text-right">${parseFloat(item.products_price).toFixed(2)}</td>
                    <td className="text-right">{item.products_quantity}</td>
                    <td className="text-right">
                      ${(parseFloat(item.products_discount || 0) * item.products_quantity).toFixed(2)}
                    </td>
                    <td className="text-right font-medium">
                      ${parseFloat(item.products_total_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-summary-container">
              <div className="summary-block">
                <div className="summary-line">
                  <span>Total Quantity</span>
                  <span>{completedOrder?.total_quantity}</span>
                </div>
                <div className="summary-line">
                  <span>Total Discount</span>
                  <span>-${parseFloat(completedOrder?.total_discount || 0).toFixed(2)}</span>
                </div>
                <div className="summary-line total">
                  <span>Total Price</span>
                  <span>${parseFloat(completedOrder?.total_price || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <footer className="invoice-footer">
              <p className="thank-you">Thank you for your business!</p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}