import React, { useState, useEffect, useMemo } from 'react';
import './ManageOrders.css';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD
  const [selectedStatus, setSelectedStatus] = useState(''); // 'pending' | 'confirm' | 'cancel'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals, Action state, and Individual Print State
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [singlePrintOrder, setSinglePrintOrder] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const getAuthToken = () => localStorage.getItem('authToken');

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const token = getAuthToken();
      const headers = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `${SERVER_BASE_URL}/api/admin/orders`;
      if (selectedStatus) {
        url += `?status=${selectedStatus}`;
      }

      const response = await fetch(url, { headers });
      const result = await response.json();

      if (response.ok && result.status === 'success') {
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

  // Bulk Print (All Filtered Orders)
  const handlePrintAll = () => {
    setSinglePrintOrder(null);
    setTimeout(() => window.print(), 100);
  };

  // Individual Order Print Invoice Trigger
  const handlePrintSingleOrder = (order) => {
    setSinglePrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // UPDATE ORDER STATUS DIRECTLY
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatusId(orderId);
    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${SERVER_BASE_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ order_status: newStatus }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o))
        );
        showFeedback(
          'success', 
          `Order #${orderId} status set to '${newStatus.toUpperCase()}'. ${newStatus === 'confirm' ? 'Revenue recorded in reports.' : 'Revenue removed from reports.'}`
        );
      } else {
        showFeedback('error', result.message || 'Failed to update order status.');
      }
    } catch (error) {
      console.error('Status Update Error:', error);
      showFeedback('error', 'Network error while updating status.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // DELETE Order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to permanently delete order #${orderId}?`)) return;

    try {
      const token = getAuthToken();
      const headers = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

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

  // UPDATE Order
  const handleUpdateOrder = async () => {
    if (!editingOrder || !editingOrder.items || editingOrder.items.length === 0) return;
    setIsSubmitting(true);

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

    const payload = { 
      items: formattedItems,
      order_status: editingOrder.order_status || 'pending'
    };

    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${SERVER_BASE_URL}/api/admin/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
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

  // Filter orders by date & search input
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

  // Aggregate stats metrics
  const aggregatedStats = useMemo(() => {
    const count = filteredOrders.length;
    const confirmedOrders = filteredOrders.filter(o => o.order_status === 'confirm');
    const revenue = confirmedOrders.reduce((acc, o) => acc + parseFloat(o.total_price || 0), 0);
    const pendingCount = filteredOrders.filter(o => o.order_status === 'pending' || !o.order_status).length;
    const totalQty = filteredOrders.reduce((acc, o) => acc + parseInt(o.total_quantity || 0), 0);

    return { count, revenue, pendingCount, totalQty };
  }, [filteredOrders]);

  const handleEditItemChange = (index, field, value) => {
    const updatedItems = [...editingOrder.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    setEditingOrder({ ...editingOrder, items: updatedItems });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirm': return 'status-badge status-confirm';
      case 'cancel':  return 'status-badge status-cancel';
      default:        return 'status-badge status-pending';
    }
  };

  return (
    <div className="manage-orders-container">
      
      {/* -------------------------------------------------------------------
          PRINT ENGINE CONTAINER 
          (Dynamically switches between Single Invoice & Bulk Table)
         ------------------------------------------------------------------- */}
      <div className="printOnlyDocument">
        {singlePrintOrder ? (
          /* INDIVIDUAL ORDER INVOICE PRINT LAYOUT */
          <div className="invoice-print-container">
            <div className="printHeader">
              <div>
                <h1 className="printCompanyTitle">OFFICIAL ORDER INVOICE</h1>
                <p className="printSubHeader">ZinziraOS Enterprise Systems</p>
              </div>
              <div className="printMetaBlock">
                <div><strong>Invoice Ref:</strong> {singlePrintOrder.order_number || `#ORD-${singlePrintOrder.id}`}</div>
                <div><strong>System Order ID:</strong> #{singlePrintOrder.id}</div>
                <div><strong>Status:</strong> {(singlePrintOrder.order_status || 'pending').toUpperCase()}</div>
                <div><strong>Date:</strong> {new Date(singlePrintOrder.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="invoice-customer-bar">
              <div><strong>Payment Type:</strong> Store Ledger</div>
              <div><strong>Total Items:</strong> {singlePrintOrder.total_quantity}</div>
            </div>

            <table className="printTable invoiceTable">
              <thead>
                <tr>
                  <th>Item / Product Name</th>
                  <th>Sell By</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Discount</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {singlePrintOrder.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{item.products_name}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Product ID: #{item.product_id}</div>
                    </td>
                    <td>{item.sell_by || 'admin'}</td>
                    <td style={{ textAlign: 'right' }}>${parseFloat(item.products_price || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>${parseFloat(item.products_discount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{item.products_quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      ${parseFloat(item.products_total_price || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-total-summary">
              <div className="total-box">
                <span className="total-label">Grand Total:</span>
                <span className="total-amount">${parseFloat(singlePrintOrder.total_price || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="printFooter">
              <span>Thank you for your business! • Official Sales Receipt</span>
              <span>ZinziraOS Enterprise Audit System</span>
            </div>
          </div>
        ) : (
          /* BULK SUMMARY LIST PRINT LAYOUT */
          <div>
            <div className="printHeader">
              <div>
                <h1 className="printCompanyTitle">ORDER MANAGEMENT STATEMENT</h1>
                <p className="printSubHeader">Generated via Executive Management Console</p>
              </div>
              <div className="printMetaBlock">
                <div><strong>Filter Status:</strong> {selectedStatus ? selectedStatus.toUpperCase() : 'ALL STATUSES'}</div>
                <div><strong>Filter Date:</strong> {selectedDate || 'ALL TIME'}</div>
                <div><strong>Generated:</strong> {new Date().toLocaleString()}</div>
              </div>
            </div>

            <div className="printSummaryGrid">
              <div className="printSummaryBox">
                <span className="printSummaryLabel">Total Orders</span>
                <span className="printSummaryVal">{aggregatedStats.count}</span>
              </div>
              <div className="printSummaryBox">
                <span className="printSummaryLabel">Confirmed Revenue</span>
                <span className="printSummaryVal">${aggregatedStats.revenue.toFixed(2)}</span>
              </div>
              <div className="printSummaryBox">
                <span className="printSummaryLabel">Pending Approval</span>
                <span className="printSummaryVal">{aggregatedStats.pendingCount}</span>
              </div>
              <div className="printSummaryBox">
                <span className="printSummaryLabel">Items Sold</span>
                <span className="printSummaryVal">{aggregatedStats.totalQty}</span>
              </div>
            </div>

            <table className="printTable">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Items Included</th>
                  <th style={{ textAlign: 'right' }}>Total Qty</th>
                  <th style={{ textAlign: 'right' }}>Total Price</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.order_number || `ORD-#${order.id}`}</strong>
                      <br />
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>ID: #{order.id}</span>
                    </td>
                    <td>{(order.order_status || 'pending').toUpperCase()}</td>
                    <td>
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      {order.items?.map((item) => `${item.products_name} (x${item.products_quantity})`).join(', ') || 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>{order.total_quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      ${parseFloat(order.total_price || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="printFooter">
              <span>Official Order Ledger Record • Total Filtered Orders: {filteredOrders.length}</span>
              <span>Confidential - Internal Enterprise Distribution</span>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------
          SCREEN UI DASHBOARD
         ------------------------------------------------------------------- */}
      <header className="page-header">
        <div className="title-area">
          <h1>Order Management Dashboard</h1>
          <p className="subtitle">Audit, process order statuses, and track revenue flow</p>
        </div>

        <div className="filter-controls">
          <div className="select-field">
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="status-filter-select"
            >
              <option value="">All Statuses</option>
              <option value="pending">⏳ Pending</option>
              <option value="confirm">✅ Confirmed</option>
              <option value="cancel">❌ Canceled</option>
            </select>
          </div>

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
              Clear Date
            </button>
          )}
        </div>
      </header>

      {/* Metric Cards */}
      <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-label">Total Orders</span>
          <span className="stat-value">{aggregatedStats.count}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Confirmed Revenue</span>
          <span className="stat-value text-accent">${aggregatedStats.revenue.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Approval</span>
          <span className="stat-value text-warning">{aggregatedStats.pendingCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Items Sold</span>
          <span className="stat-value">{aggregatedStats.totalQty}</span>
        </div>
      </div>

      {feedback.message && (
        <div className={`feedback-alert ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {/* Main Table */}
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-print" onClick={handlePrintAll} title="Print Bulk Report">
              🖨️ Print All PDF
            </button>
            <button className="btn-refresh" onClick={fetchOrders} title="Refresh Order History">
              🔄 Refresh List
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found matching your active filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order Details</th>
                  <th>Order Status</th>
                  <th>Date</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Total Price</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const currentStatus = order.order_status || 'pending';
                  const isUpdatingThis = updatingStatusId === order.id;

                  return (
                    <tr key={order.id}>
                      <td>
                        <strong className="order-no">{order.order_number || `ORD-#${order.id}`}</strong>
                        <span className="order-id-sub">System ID: #{order.id}</span>
                      </td>

                      <td>
                        <div className="status-selector-wrapper">
                          <select
                            disabled={isUpdatingThis}
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={getStatusBadgeClass(currentStatus)}
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="confirm">✅ Confirm</option>
                            <option value="cancel">❌ Cancel</option>
                          </select>
                          {isUpdatingThis && <span className="mini-loader">...</span>}
                        </div>
                      </td>

                      <td>
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="text-right">{order.total_quantity}</td>
                      <td className="text-right font-bold text-accent">
                        ${parseFloat(order.total_price || 0).toFixed(2)}
                      </td>
                      
                      {/* Action Cell with dedicated individual print button */}
                      <td className="text-right action-cells">
                        <button
                          className="btn-action btn-print-single"
                          onClick={() => handlePrintSingleOrder(order)}
                          title="Print Receipt Invoice"
                        >
                          🖨️
                        </button>
                        <button
                          className="btn-action btn-view"
                          onClick={() => setViewingOrder(order)}
                          title="View Details"
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
                  );
                })}
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
              <span className={getStatusBadgeClass(viewingOrder.order_status || 'pending')}>
                {(viewingOrder.order_status || 'pending').toUpperCase()}
              </span>
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
              <button className="btn-primary" onClick={() => handlePrintSingleOrder(viewingOrder)}>
                🖨️ Print Invoice
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
              <div className="modal-status-field">
                <label>Order Status:</label>
                <select
                  value={editingOrder.order_status || 'pending'}
                  onChange={(e) => setEditingOrder({ ...editingOrder, order_status: e.target.value })}
                  className={getStatusBadgeClass(editingOrder.order_status || 'pending')}
                >
                  <option value="pending">Pending</option>
                  <option value="confirm">Confirm</option>
                  <option value="cancel">Cancel</option>
                </select>
              </div>

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
                          onChange={(e) => handleEditItemChange(idx, 'products_price', e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Discount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.products_discount}
                          onChange={(e) => handleEditItemChange(idx, 'products_discount', e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.products_quantity}
                          onChange={(e) => handleEditItemChange(idx, 'products_quantity', e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Sell By</label>
                        <input
                          type="text"
                          value={item.sell_by}
                          onChange={(e) => handleEditItemChange(idx, 'sell_by', e.target.value)}
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