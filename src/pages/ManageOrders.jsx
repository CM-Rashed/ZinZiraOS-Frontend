import React, { useState, useEffect, useMemo } from 'react';
import './ManageOrders.css';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  // Helper to extract stored Auth Token
  const getAuthToken = () => localStorage.getItem('authToken');

  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch paginated order history from API
  const fetchOrders = async () => {
    setLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const token = getAuthToken();
      const headers = {
        Accept: 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${SERVER_BASE_URL}/api/admin/orders`, {
        headers,
      });
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        // Handle Laravel pagination response (result.data.data) or simple array (result.data)
        const list = Array.isArray(result.data) ? result.data : result.data?.data || [];
        setOrders(list);
      } else {
        showFeedback('error', result.message || 'Failed to retrieve order records.');
      }
    } catch (error) {
      console.error('Fetch Orders Error:', error);
      showFeedback('error', 'Server offline. Could not load order history.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  // DELETE Order - maps to destroy()
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to permanently delete order #${orderId}?`)) {
      return;
    }

    try {
      const token = getAuthToken();
      const headers = {
        Accept: 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${SERVER_BASE_URL}/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers,
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        showFeedback('success', `Order #${orderId} deleted successfully.`);
      } else {
        showFeedback('error', result.message || 'Failed to delete order.');
      }
    } catch (error) {
      console.error('Delete Error:', error);
      showFeedback('error', 'Connection lost while attempting to delete order.');
    }
  };

  // UPDATE Order - maps to update()
  const handleUpdateOrder = async () => {
    if (!editingOrder || !editingOrder.items || editingOrder.items.length === 0) return;
    setIsSubmitting(true);

    // Format items to ensure correct numeric structure expected by validateOrder()
    const formattedItems = editingOrder.items.map((item) => {
      const price = parseFloat(item.products_price) || 0;
      const qty = parseInt(item.products_quantity) || 1;
      const discount = parseFloat(item.products_discount) || 0;
      const totalPrice = Math.max(0, (price - discount) * qty);

      return {
        product_id: parseInt(item.product_id),
        products_name: item.products_name,
        products_price: price,
        products_discount: discount,
        products_quantity: qty,
        products_total_price: totalPrice,
        sell_by: item.sell_by || 'admin',
      };
    });

    const payload = { items: formattedItems };

    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${SERVER_BASE_URL}/api/admin/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        // Replace in local state
        setOrders((prev) =>
          prev.map((o) => (o.id === editingOrder.id ? result.data : o))
        );
        showFeedback('success', `Order #${editingOrder.id} updated successfully.`);
        setEditingOrder(null);
      } else {
        showFeedback('error', result.message || 'Validation error during update.');
      }
    } catch (error) {
      console.error('Update Error:', error);
      showFeedback('error', 'Could not save updates to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter orders by date calendar picker and search keyword
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const createdDate = new Date(order.created_at).toISOString().split('T')[0];
      const matchesDate = selectedDate ? createdDate === selectedDate : true;
      const query = searchQuery.toLowerCase();
      const matchesQuery =
        order.order_number?.toLowerCase().includes(query) ||
        order.id?.toString().includes(query);

      return matchesDate && matchesQuery;
    });
  }, [orders, selectedDate, searchQuery]);

  // Aggregate stats metrics for filtered selection
  const aggregatedStats = useMemo(() => {
    const count = filteredOrders.length;
    const revenue = filteredOrders.reduce((acc, o) => acc + parseFloat(o.total_price || 0), 0);
    const totalQty = filteredOrders.reduce((acc, o) => acc + parseInt(o.total_quantity || 0), 0);
    const totalDiscount = filteredOrders.reduce((acc, o) => acc + parseFloat(o.total_discount || 0), 0);

    return { count, revenue, totalQty, totalDiscount };
  }, [filteredOrders]);

  // Handle item change in edit modal
  const handleEditItemChange = (index, field, value) => {
    const updatedItems = [...editingOrder.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    setEditingOrder({ ...editingOrder, items: updatedItems });
  };

  return (
    <div className="manage-orders-container">
      {/* Top Header & Calendar Date Bar */}
      <header className="page-header">
        <div className="title-area">
          <h1>Order Management Dashboard</h1>
          <p className="subtitle">Audit, update, and manage historical orders</p>
        </div>

        <div className="calendar-bar">
          <div className="calendar-field">
            <span className="cal-icon">📅</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="calendar-input"
            />
          </div>
          {selectedDate && (
            <button className="btn-clear-date" onClick={() => setSelectedDate('')}>
              Clear Filter
            </button>
          )}
        </div>
      </header>

      {/* Analytics Metric Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-label">Orders Found</span>
          <span className="stat-value">{aggregatedStats.count}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value text-accent">${aggregatedStats.revenue.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Items Sold</span>
          <span className="stat-value">{aggregatedStats.totalQty}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Discount Given</span>
          <span className="stat-value text-danger">-${aggregatedStats.totalDiscount.toFixed(2)}</span>
        </div>
      </div>

      {feedback.message && (
        <div className={`feedback-alert ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {/* Main Table Controls & Content */}
      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by Order # or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn-refresh" onClick={fetchOrders} title="Refresh Order History">
            🔄 Refresh List
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching order data from database...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found matching your selected date or search filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order Details</th>
                  <th>Date & Created</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Total Discount</th>
                  <th className="text-right">Total Price</th>
                  <th>Last Updated</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong className="order-no">{order.order_number || `ORD-#${order.id}`}</strong>
                      <span className="order-id-sub">System ID: #{order.id}</span>
                    </td>
                    <td>
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="text-right">{order.total_quantity}</td>
                    <td className="text-right text-danger">
                      -${parseFloat(order.total_discount || 0).toFixed(2)}
                    </td>
                    <td className="text-right font-bold text-accent">
                      ${parseFloat(order.total_price || 0).toFixed(2)}
                    </td>
                    <td>
                      {new Date(order.updated_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="text-right action-cells">
                      <button
                        className="btn-action btn-view"
                        onClick={() => setViewingOrder(order)}
                        title="View Items"
                      >
                        👁️
                      </button>
                      <button
                        className="btn-action btn-edit"
                        onClick={() => setEditingOrder(JSON.parse(JSON.stringify(order)))}
                        title="Edit Order"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteOrder(order.id)}
                        title="Delete Order"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW ORDER ITEMS MODAL */}
      {viewingOrder && (
        <div className="modal-overlay" onClick={() => setViewingOrder(null)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h2>Order Details</h2>
                <p className="order-no">{viewingOrder.order_number}</p>
              </div>
              <button className="close-btn" onClick={() => setViewingOrder(null)}>✕</button>
            </header>

            <div className="modal-content">
              <table className="modal-items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sell By</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Disc</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{item.products_name}</strong>
                        <div className="order-id-sub">ID #{item.product_id}</div>
                      </td>
                      <td>{item.sell_by}</td>
                      <td className="text-right">${parseFloat(item.products_price).toFixed(2)}</td>
                      <td className="text-right">${parseFloat(item.products_discount || 0).toFixed(2)}</td>
                      <td className="text-right">{item.products_quantity}</td>
                      <td className="text-right font-bold">
                        ${parseFloat(item.products_total_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewingOrder(null)}>
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* EDIT ORDER MODAL */}
      {editingOrder && (
        <div className="modal-overlay" onClick={() => setEditingOrder(null)}>
          <div className="modal-body edit-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h2>Edit Order #{editingOrder.id}</h2>
                <p className="order-no">{editingOrder.order_number}</p>
              </div>
              <button className="close-btn" onClick={() => setEditingOrder(null)}>✕</button>
            </header>

            <div className="modal-content">
              <div className="edit-items-list">
                {editingOrder.items?.map((item, idx) => (
                  <div key={idx} className="edit-item-row">
                    <div className="item-title-field">
                      <label>Product Name</label>
                      <input type="text" value={item.products_name} disabled />
                    </div>

                    <div className="item-grid-inputs">
                      <div>
                        <label>Sell Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.products_price}
                          onChange={(e) =>
                            handleEditItemChange(idx, 'products_price', e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label>Discount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.products_discount}
                          onChange={(e) =>
                            handleEditItemChange(idx, 'products_discount', e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label>Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.products_quantity}
                          onChange={(e) =>
                            handleEditItemChange(idx, 'products_quantity', e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label>Sell By</label>
                        <input
                          type="text"
                          value={item.sell_by}
                          onChange={(e) =>
                            handleEditItemChange(idx, 'sell_by', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <footer className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditingOrder(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={isSubmitting}
                onClick={handleUpdateOrder}
              >
                {isSubmitting ? 'Updating...' : 'Save Order Changes'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}