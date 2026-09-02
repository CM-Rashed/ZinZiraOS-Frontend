import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ReportsDashboard.module.css';

export default function ReportsDashboard() {
  const [reportType, setReportType] = useState('summary');
  const [period, setPeriod] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // DatePicker Popover state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerViewDate, setPickerViewDate] = useState(new Date());
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);
  const popoverRef = useRef(null);

  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({ total_revenue: 0, total_cost: 0, net_profit: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Format YYYY-MM-DD
  const formatDateString = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        Accept: 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      let queryParams = new URLSearchParams({ period });

      if (period === 'custom') {
        if (!startDate || !endDate) {
          setLoading(false);
          return;
        }
        queryParams.append('start_date', startDate);
        queryParams.append('end_date', endDate);
      }

      const response = await fetch(
        `${SERVER_BASE_URL}/api/admin/reports/${reportType}?${queryParams.toString()}`,
        { headers }
      );

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setData(result.data || []);

        if (reportType === 'summary') {
          setMetrics({
            total_revenue: result.total_revenue || 0,
            total_cost: result.total_cost || 0,
            net_profit: result.net_profit || 0,
          });
        } else if (reportType === 'revenue') {
          setMetrics({ total_revenue: result.total_revenue || 0, total_cost: 0, net_profit: 0 });
        } else {
          setMetrics({ total_revenue: 0, total_cost: result.total_cost || 0, net_profit: 0 });
        }
      } else {
        setError(result.message || 'Failed to fetch financial reports.');
      }
    } catch (err) {
      console.error('Tauri Desktop Report Error:', err);
      setError('Connection refused. Ensure backend server is accessible.');
    } finally {
      setLoading(false);
    }
  }, [reportType, period, startDate, endDate, SERVER_BASE_URL]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle Preset Period Selection
  const handlePeriodChange = (e) => {
    const selected = e.target.value;
    setPeriod(selected);
    if (selected === 'custom') {
      setIsPickerOpen(true);
    } else {
      setIsPickerOpen(false);
      setStartDate('');
      setEndDate('');
    }
  };

  // Calendar Engine Helper Functions
  const handleDayClick = (day) => {
    const selectedDate = new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth(), day);

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(selectedDate);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (selectedDate < tempStart) {
        setTempStart(selectedDate);
      } else {
        setTempEnd(selectedDate);
      }
    }
  };

  const applyCustomRange = () => {
    if (tempStart && tempEnd) {
      setStartDate(formatDateString(tempStart));
      setEndDate(formatDateString(tempEnd));
      setIsPickerOpen(false);
    }
  };

  // Native Browser/Tauri Print Action
  const handlePrint = () => {
    window.print();
  };

  const renderCalendarDays = () => {
    const year = pickerViewDate.getFullYear();
    const month = pickerViewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDayCell} />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const currentCellDate = new Date(year, month, day);

      const isStart = tempStart && currentCellDate.getTime() === tempStart.getTime();
      const isEnd = tempEnd && currentCellDate.getTime() === tempEnd.getTime();
      const isInRange =
        tempStart && tempEnd && currentCellDate > tempStart && currentCellDate < tempEnd;

      let dayClass = styles.dayCell;
      if (isStart || isEnd) dayClass += ` ${styles.daySelected}`;
      if (isInRange) dayClass += ` ${styles.dayInRange}`;

      days.push(
        <button key={day} className={dayClass} onClick={() => handleDayClick(day)}>
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={styles.container}>
      {/* ----------------- TAURI APP SCREEN VIEW (HIDDEN ON PRINT) ----------------- */}
      <header className={`${styles.topBar} ${styles.hideOnPrint}`} data-tauri-drag-region>
        <div className={styles.titleGroup}>
          <h1>Financial Analytics</h1>
          <p className={styles.subtitle}>Audit ledger revenue, expenses, and net yields</p>
        </div>

        {/* Filter Toolbar */}
        <div className={styles.filterControls} data-tauri-drag-region="false">
          <div className={styles.typeTabs}>
            <button
              className={`${styles.tabBtn} ${reportType === 'summary' ? styles.tabBtnActive : ''}`}
              onClick={() => setReportType('summary')}
            >
              Summary
            </button>
            <button
              className={`${styles.tabBtn} ${reportType === 'revenue' ? styles.tabBtnActive : ''}`}
              onClick={() => setReportType('revenue')}
            >
              Revenue
            </button>
            <button
              className={`${styles.tabBtn} ${reportType === 'cost' ? styles.tabBtnActive : ''}`}
              onClick={() => setReportType('cost')}
            >
              Cost
            </button>
          </div>

          <select value={period} onChange={handlePeriodChange} className={styles.selectInput}>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {/* Custom Date Popover Trigger & Container */}
          <div className={styles.popoverWrapper} ref={popoverRef}>
            {period === 'custom' && (
              <button
                className={styles.datePickerTrigger}
                onClick={() => setIsPickerOpen(!isPickerOpen)}
              >
                📅 {startDate && endDate ? `${startDate} → ${endDate}` : 'Select Date Range'}
              </button>
            )}

            {isPickerOpen && (
              <div className={styles.calendarPopover}>
                <div className={styles.popoverHeader}>
                  <button
                    onClick={() =>
                      setPickerViewDate(
                        new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth() - 1, 1)
                      )
                    }
                  >
                    ◀
                  </button>
                  <span>
                    {pickerViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() =>
                      setPickerViewDate(
                        new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth() + 1, 1)
                      )
                    }
                  >
                    ▶
                  </button>
                </div>

                <div className={styles.weekHeader}>
                  <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>

                <div className={styles.daysGrid}>{renderCalendarDays()}</div>

                <div className={styles.popoverFooter}>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => {
                      setIsPickerOpen(false);
                      setTempStart(null);
                      setTempEnd(null);
                    }}
                  >
                    Reset
                  </button>
                  <button
                    className={styles.applyBtn}
                    disabled={!tempStart || !tempEnd}
                    onClick={applyCustomRange}
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className={styles.refreshBtn} onClick={fetchReports} title="Reload Data">
            🔄
          </button>

          <button className={styles.printBtn} onClick={handlePrint} title="Print Document">
            🖨️ Print Report
          </button>
        </div>
      </header>

      {/* Main Interactive View Area */}
      <main className={`${styles.mainContent} ${styles.hideOnPrint}`}>
        {error && <div className={styles.alertError}>{error}</div>}

        <div className={styles.metricsGrid}>
          {(reportType === 'summary' || reportType === 'revenue') && (
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Revenue</span>
              <span className={`${styles.metricValue} ${styles.textRevenue}`}>
                ${metrics.total_revenue.toFixed(2)}
              </span>
              <span className={styles.metricSub}>Gross earnings recorded</span>
            </div>
          )}

          {(reportType === 'summary' || reportType === 'cost') && (
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Cost</span>
              <span className={`${styles.metricValue} ${styles.textCost}`}>
                ${metrics.total_cost.toFixed(2)}
              </span>
              <span className={styles.metricSub}>Stock & inventory costs</span>
            </div>
          )}

          {reportType === 'summary' && (
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Net Yield</span>
              <span
                className={`${styles.metricValue} ${
                  metrics.net_profit >= 0 ? styles.textNetPos : styles.textNetNeg
                }`}
              >
                ${metrics.net_profit.toFixed(2)}
              </span>
              <span className={styles.metricSub}>Net profit/loss calculation</span>
            </div>
          )}
        </div>

        {/* Screen Ledger Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2>Ledger Records</h2>
            <span className={styles.badge}>{data.length} Entries</span>
          </div>

          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Loading financial entries...</p>
              </div>
            ) : data.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No financial records found for the selected filter.</p>
              </div>
            ) : (
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th className={styles.textRight}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span
                          className={`${styles.pill} ${
                            item.type === 'revenue' ? styles.pillRevenue : styles.pillCost
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td>{item.category || 'N/A'}</td>
                      <td>{item.description || 'No notes provided'}</td>
                      <td>
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td
                        className={`${styles.textRight} ${
                          item.type === 'revenue' ? styles.textRevenue : styles.textCost
                        }`}
                        style={{ fontWeight: '700' }}
                      >
                        {item.type === 'revenue' ? '+' : '-'}${parseFloat(item.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* ----------------- DYNAMIC A4 PRINT-ONLY DOCUMENT LAYOUT ----------------- */}
      <div className={styles.printOnlyDocument}>
        {/* Document Letterhead Header */}
        <div className={styles.printHeader}>
          <div>
            <h1 className={styles.printCompanyTitle}>FINANCIAL AUDIT STATEMENT</h1>
            <p className={styles.printSubHeader}>Generated via Executive Management Console</p>
          </div>
          <div className={styles.printMetaBlock}>
            <div><strong>Report Type:</strong> {reportType.toUpperCase()}</div>
            <div><strong>Filter Period:</strong> {period.replace('_', ' ').toUpperCase()}</div>
            <div>
              <strong>Generated:</strong>{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Print Summary Financial Totals */}
        <div className={styles.printSummaryGrid}>
          {(reportType === 'summary' || reportType === 'revenue') && (
            <div className={styles.printSummaryBox}>
              <span className={styles.printSummaryLabel}>Total Revenue</span>
              <span className={styles.printSummaryVal}>${metrics.total_revenue.toFixed(2)}</span>
            </div>
          )}
          {(reportType === 'summary' || reportType === 'cost') && (
            <div className={styles.printSummaryBox}>
              <span className={styles.printSummaryLabel}>Total Expenses / Cost</span>
              <span className={styles.printSummaryVal}>${metrics.total_cost.toFixed(2)}</span>
            </div>
          )}
          {reportType === 'summary' && (
            <div className={styles.printSummaryBox}>
              <span className={styles.printSummaryLabel}>Net Profit / Yield</span>
              <span className={styles.printSummaryVal}>${metrics.net_profit.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Print Table Ledger */}
        <table className={styles.printTable}>
          <thead>
            <tr>
              <th>Entry ID</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th>Timestamp</th>
              <th className={styles.textRight}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td>
                  <strong style={{ textTransform: 'uppercase' }}>{item.type}</strong>
                </td>
                <td>{item.category || 'N/A'}</td>
                <td>{item.description || 'No description recorded'}</td>
                <td>{new Date(item.created_at).toLocaleString()}</td>
                <td className={styles.textRight}>
                  {item.type === 'revenue' ? '+' : '-'}${parseFloat(item.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Document Footer */}
        <div className={styles.printFooter}>
          <p>Official Ledger Record • Total Audited Records: {data.length}</p>
          <p>Confidential - Internal Enterprise Distribution Only</p>
        </div>
      </div>
    </div>
  );
}