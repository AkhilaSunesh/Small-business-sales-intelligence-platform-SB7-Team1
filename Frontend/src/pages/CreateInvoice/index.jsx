import { useState, useEffect, useRef } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { FiPlus, FiTrash2, FiFileText, FiRefreshCw, FiX, FiCheck, FiPrinter } from 'react-icons/fi';
import { useToast } from '../../components/common/Toast';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

// Reusable API Services
import customerService from '../../services/customerService';
import productService from '../../services/productService';
import invoiceService from '../../services/invoiceService';

function CreateInvoicePage() {
  usePageTitle('Create Invoice');
  const toast = useToast();
  const navigate = useNavigate();

  // Generated Invoice number on load
  const [invoiceNumber, setInvoiceNumber] = useState('');
  useEffect(() => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-${dateStr}-${rand}`);
  }, []);

  // Live Database States
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [invoiceStatus, setInvoiceStatus] = useState('Paid');
  const [notes, setNotes] = useState('');

  // Dropdown UI States
  const [custSearchFocused, setCustSearchFocused] = useState(false);
  const [filteredCusts, setFilteredCusts] = useState([]);
  const custDropdownRef = useRef(null);

  // Selected item pick state for product adder section
  const [selectedProdId, setSelectedProdId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState('');
  const [itemDiscount, setItemDiscount] = useState(0);
  const [itemTax, setItemTax] = useState(18);

  // Table items list state
  const [invoiceItems, setInvoiceItems] = useState([]);

  // Preview Modal State
  const [showPreview, setShowPreview] = useState(false);

  // Fetch client and product catalog from Backend database
  useEffect(() => {
    const loadCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          customerService.getCustomers(),
          productService.getProducts()
        ]);
        if (custRes && custRes.success) {
          setCustomers(custRes.data);
          setFilteredCusts(custRes.data);
        }
        if (prodRes && prodRes.success) {
          setProducts(prodRes.data);
        }
      } catch (err) {
        console.error("Failed to load catalog details:", err);
        toast.show("Could not load products or customer registries from server.", "error");
      } finally {
        setLoadingCatalogs(false);
      }
    };
    loadCatalogs();
  }, []);

  // Filter customers based on input text
  useEffect(() => {
    if (customerName.trim() === '') {
      setFilteredCusts(customers);
    } else {
      setFilteredCusts(
        customers.filter((c) =>
          c.name.toLowerCase().includes(customerName.toLowerCase())
        )
      );
    }
  }, [customerName, customers]);

  // Click outside listener for customer dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (custDropdownRef.current && !custDropdownRef.current.contains(event.target)) {
        setCustSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pre-fill fields when selecting product
  const handleProductSelectChange = (e) => {
    const prodId = e.target.value;
    setSelectedProdId(prodId);
    if (!prodId) {
      setItemPrice('');
      setItemDiscount(0);
      setItemTax(18);
      return;
    }
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setItemPrice(prod.price);
      setItemDiscount(0); // backend applies discount rate on final total
      setItemTax(18); // Default standard GST
    }
  };

  // Add line item to invoice list
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!selectedProdId) {
      toast.show('Please select a product to add.', 'error');
      return;
    }
    if (itemQty <= 0) {
      toast.show('Quantity must be greater than 0.', 'error');
      return;
    }
    if (itemPrice < 0) {
      toast.show('Unit price cannot be negative.', 'error');
      return;
    }
    if (itemDiscount < 0 || itemDiscount > 100) {
      toast.show('Discount must be between 0% and 100%.', 'error');
      return;
    }
    if (itemTax < 0 || itemTax > 100) {
      toast.show('Tax rate must be between 0% and 100%.', 'error');
      return;
    }

    const prod = products.find((p) => p.id === selectedProdId);
    const newItem = {
      id: Date.now() + Math.random(),
      productId: prod.id,
      productName: prod.name,
      quantity: Number(itemQty),
      unitPrice: Number(itemPrice),
      discountPercent: Number(itemDiscount),
      taxPercent: Number(itemTax),
    };

    setInvoiceItems([...invoiceItems, newItem]);
    // Reset picker states
    setSelectedProdId('');
    setItemQty(1);
    setItemPrice('');
    setItemDiscount(0);
    setItemTax(18);
    toast.show('Product added to invoice.', 'success');
  };

  // Update item field inline in table
  const handleUpdateItemInline = (itemId, field, value) => {
    setInvoiceItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const updatedValue = Number(value);
          if (field === 'quantity' && updatedValue < 1) return item;
          if (field === 'unitPrice' && updatedValue < 0) return item;
          if (field === 'discountPercent' && (updatedValue < 0 || updatedValue > 100)) return item;
          if (field === 'taxPercent' && (updatedValue < 0 || updatedValue > 100)) return item;

          return { ...item, [field]: updatedValue };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id) => {
    setInvoiceItems(invoiceItems.filter((item) => item.id !== id));
    toast.show('Item removed.', 'info');
  };

  // Perform Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    invoiceItems.forEach((item) => {
      const itemSubtotal = item.unitPrice * item.quantity;
      const itemDiscountVal = itemSubtotal * (item.discountPercent / 100);
      const taxable = itemSubtotal - itemDiscountVal;
      const itemTaxVal = taxable * (item.taxPercent / 100);

      subtotal += itemSubtotal;
      totalDiscount += itemDiscountVal;
      totalTax += itemTaxVal;
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    return {
      subtotal: subtotal.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      totalTax: totalTax.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  };

  const { subtotal, totalDiscount, totalTax, grandTotal } = calculateTotals();

  // Reset page state
  const handleResetForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setSelectedCustomerId('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('UPI');
    setInvoiceStatus('Paid');
    setNotes('');
    setInvoiceItems([]);
    setSelectedProdId('');
    setItemQty(1);
    setItemPrice('');
    setItemDiscount(0);
    setItemTax(18);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-${dateStr}-${rand}`);
    toast.show('Form reset successfully.', 'info');
  };

  // Submit / Save Invoice Form
  const handleSaveInvoice = async () => {
    if (!selectedCustomerId) {
      toast.show('Please select a valid customer from the search dropdown.', 'error');
      return;
    }
    if (invoiceItems.length === 0) {
      toast.show('Please add at least one product item.', 'error');
      return;
    }

    try {
      // Map line items to format required by create invoice backend API
      const lineItems = invoiceItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      // Calculate rates from totals
      const discountRate = Number(invoiceItems[0]?.discountPercent || 0);
      const taxRate = Number(invoiceItems[0]?.taxPercent || 18);

      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30); // 30 days default payment period

      const res = await invoiceService.createInvoice({
        customerId: selectedCustomerId,
        lineItems,
        discountRate,
        taxRate,
        dueDate: dueDate.toISOString(),
      });

      if (res && res.success) {
        // Record payment against the created invoice if user checked Paid or Partially Paid
        if (invoiceStatus === 'Paid' || invoiceStatus === 'Partially Paid') {
          const paidAmount = invoiceStatus === 'Paid' ? Number(grandTotal) : Number(grandTotal) / 2;
          await invoiceService.recordPayment(res.data.id, {
            amount: paidAmount,
            method: paymentMethod.toUpperCase(),
            reference: 'MANUAL_DASHBOARD',
            note: 'Manual invoice entry payment'
          });
        }

        toast.show(`Invoice ${res.data.invoiceNumber || invoiceNumber} created successfully on backend!`, 'success');
        handleResetForm();
        navigate('/invoices');
      } else {
        toast.show(res.message || 'Failed to create invoice.', 'error');
      }
    } catch (err) {
      console.error('[Invoice Saved API Error]:', err);
      const errMessage = err.response?.data?.message || 'Server error occurred while creating invoice.';
      toast.show(errMessage, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title Section */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 md:p-8 backdrop-blur flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Create Invoice</h1>
          <p className="mt-1.5 text-sm text-slate-400">Generate fresh sales transactions and calculate totals instantly.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="secondary" onClick={handleResetForm} className="gap-2">
            <FiRefreshCw className="text-sm" /> Reset
          </Button>
          <Button variant="secondary" onClick={() => navigate('/invoices')} className="gap-2">
            Cancel
          </Button>
        </div>
      </section>

      {/* Main Grid: Form Left, Product Adder Right */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left Side: Client Info & Bill Details */}
        <div className="xl:col-span-2 space-y-6">
          {/* Customer & General Details */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-semibold text-white">Client & Invoice Metadata</h3>
              <span className="text-xs uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full font-mono font-medium">
                {invoiceNumber || 'GENERATING...'}
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Customer Name Dropdown Search */}
              <div ref={custDropdownRef} className="relative">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Type to search or enter name..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onFocus={() => setCustSearchFocused(true)}
                />
                {custSearchFocused && filteredCusts.length > 0 && (
                  <ul className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 py-2 shadow-2xl backdrop-blur">
                    {filteredCusts.map((c) => (
                      <li
                        key={c.id}
                        className="cursor-pointer px-4 py-2.5 text-sm text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
                        onMouseDown={() => {
                          setCustomerName(c.name);
                          setCustomerEmail(c.email || '');
                          setCustomerPhone(c.phone || '');
                          setSelectedCustomerId(c.id);
                          setCustSearchFocused(false);
                          toast.show(`Selected customer: ${c.name}`, 'info');
                        }}
                      >
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.email} • {c.phone}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Invoice Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              {/* Customer Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1-555-0000"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Added Line Items Table */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-white/5 pb-4">Invoice Line Items</h3>

            {invoiceItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-center">
                <FiFileText className="text-4xl text-slate-600 mb-3" />
                <p className="text-sm">No items added to invoice yet.</p>
                <p className="text-xs mt-1">Use the panel on the right to select and add products.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pl-2 font-semibold">Product</th>
                      <th className="pb-3 font-semibold text-center w-20">Quantity</th>
                      <th className="pb-3 font-semibold text-center w-28">Price ($)</th>
                      <th className="pb-3 font-semibold text-center w-20">Disc (%)</th>
                      <th className="pb-3 font-semibold text-center w-20">Tax (%)</th>
                      <th className="pb-3 font-semibold text-right pr-2">Total ($)</th>
                      <th className="pb-3 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-200">
                    {invoiceItems.map((item) => {
                      const itemSubtotal = item.unitPrice * item.quantity;
                      const itemDiscVal = itemSubtotal * (item.discountPercent / 100);
                      const taxable = itemSubtotal - itemDiscVal;
                      const itemTaxVal = taxable * (item.taxPercent / 100);
                      const itemTotal = taxable + itemTaxVal;

                      return (
                        <tr key={item.id} className="hover:bg-white/2 transition-colors group">
                          {/* Product Name */}
                          <td className="py-3 pl-2 font-medium text-white max-w-xs truncate">
                            {item.productName}
                          </td>
                          {/* Quantity */}
                          <td className="py-2 text-center">
                            <input
                              type="number"
                              min="1"
                              className="w-16 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-center text-sm text-white outline-none focus:border-cyan-400/50"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemInline(item.id, 'quantity', e.target.value)}
                            />
                          </td>
                          {/* Price */}
                          <td className="py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-24 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-center text-sm text-white outline-none focus:border-cyan-400/50"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItemInline(item.id, 'unitPrice', e.target.value)}
                            />
                          </td>
                          {/* Discount % */}
                          <td className="py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-16 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-center text-sm text-white outline-none focus:border-cyan-400/50"
                              value={item.discountPercent}
                              onChange={(e) => handleUpdateItemInline(item.id, 'discountPercent', e.target.value)}
                            />
                          </td>
                          {/* Tax % */}
                          <td className="py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-16 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-center text-sm text-white outline-none focus:border-cyan-400/50"
                              value={item.taxPercent}
                              onChange={(e) => handleUpdateItemInline(item.id, 'taxPercent', e.target.value)}
                            />
                          </td>
                          {/* Total */}
                          <td className="py-3 text-right pr-2 font-semibold text-white">
                            ${itemTotal.toFixed(2)}
                          </td>
                          {/* Remove action */}
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-rose-500 hover:text-rose-400 transition-colors opacity-80 hover:opacity-100 p-1"
                              title="Delete Item"
                            >
                              <FiTrash2 className="text-base" />
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
        </div>

        {/* Right Side: Product Picker & Bill Financial Summary */}
        <div className="space-y-6">
          {/* Add Product Card */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-white/5 pb-3">Add Product</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              {/* Product List Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select Product
                </label>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                  value={selectedProdId}
                  onChange={handleProductSelectChange}
                >
                  <option value="">-- Choose Catalog Product --</option>
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} (${prod.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                  value={itemQty}
                  onChange={(e) => setItemQty(Number(e.target.value))}
                />
              </div>

              {/* Unit Price */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Unit Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Discount % */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                    value={itemDiscount}
                    onChange={(e) => setItemDiscount(Number(e.target.value))}
                  />
                </div>

                {/* Tax % */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Tax / GST (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                    value={itemTax}
                    onChange={(e) => setItemTax(Number(e.target.value))}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2 mt-2">
                <FiPlus /> Add Item
              </Button>
            </form>
          </div>

          {/* Payment Details & Calculations Summary */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-5">
            <h3 className="text-base font-semibold text-white border-b border-white/5 pb-3">Payment details</h3>

            {/* Payment Mode Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['UPI', 'Card', 'Cash', 'Bank Transfer'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold border text-center transition-all ${
                      paymentMethod === method
                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Status Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Payment Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Paid', 'Partially Paid', 'Unpaid'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setInvoiceStatus(status)}
                    className={`rounded-xl px-2 py-2 text-xs font-semibold border text-center transition-all ${
                      invoiceStatus === status
                        ? status === 'Paid'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : status === 'Partially Paid'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                          : 'border-rose-500 bg-rose-500/10 text-rose-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Internal Remarks / Notes
              </label>
              <textarea
                placeholder="Include custom terms or details..."
                rows="2"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Invoice Financial Calculation Box */}
            <div className="rounded-2xl bg-white/5 p-4 border border-white/5 text-sm space-y-2.5">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-200">${subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Discount:</span>
                <span className="font-mono text-rose-400">-${totalDiscount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Tax / GST:</span>
                <span className="font-mono text-emerald-400">+${totalTax}</span>
              </div>
              <div className="border-t border-white/10 pt-2.5 flex justify-between font-bold text-base text-white">
                <span>Grand Total:</span>
                <span className="font-mono text-cyan-400">${grandTotal}</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button onClick={handleSaveInvoice} className="w-full gap-2 text-slate-950 font-bold bg-cyan-400 hover:bg-cyan-300 py-3.5">
                <FiCheck className="text-lg" /> Save & Issue Invoice
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (invoiceItems.length === 0) {
                    toast.show('Please add items to preview.', 'error');
                  } else {
                    setShowPreview(true);
                  }
                }}
                className="w-full gap-2 py-3"
              >
                <FiFileText /> Preview Invoice Receipt
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RENDER INVOICE PREVIEW MODAL OVERLAY */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-slate-900 p-6 sm:p-8 shadow-2xl text-slate-100 flex flex-col justify-between">
            {/* Close Button */}
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
            >
              <FiX className="text-xl" />
            </button>

            {/* Printable Receipt Content */}
            <div className="space-y-6 mt-2" id="printable-invoice">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between border-b border-white/10 pb-6 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 font-bold text-lg">
                      M
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white">MarketMind AI</h2>
                      <p className="text-xs text-cyan-400">Intelligent Retail Platforms</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 max-w-xs">
                    100 Innovation Parkway, Suite 500<br />
                    Silicon Valley, CA 94025
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">SALES INVOICE</h3>
                  <div className="text-xs text-slate-400 mt-1 font-mono space-y-1">
                    <p><strong className="text-slate-300">Number:</strong> {invoiceNumber}</p>
                    <p><strong className="text-slate-300">Date:</strong> {invoiceDate}</p>
                    <p>
                      <strong className="text-slate-300">Status:</strong>{' '}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-sans ${
                        invoiceStatus === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : invoiceStatus === 'Partially Paid'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {invoiceStatus}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Billed To / Pay Info */}
              <div className="grid gap-6 sm:grid-cols-2 text-xs">
                <div>
                  <h4 className="text-slate-400 uppercase font-semibold tracking-wider mb-2">Billed To:</h4>
                  <div className="text-slate-200 space-y-1">
                    <p className="text-sm font-bold text-white">{customerName || 'N/A'}</p>
                    <p>{customerEmail || 'No Email Provided'}</p>
                    <p>{customerPhone || 'No Phone Provided'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-slate-400 uppercase font-semibold tracking-wider mb-2">Payment Terms:</h4>
                  <div className="text-slate-200 space-y-1">
                    <p><strong className="text-slate-400">Method:</strong> {paymentMethod}</p>
                    <p><strong className="text-slate-400">Due:</strong> On Receipt</p>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-slate-300 uppercase tracking-wider font-semibold border-b border-white/10">
                      <th className="p-3">Product Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Discount</th>
                      <th className="p-3 text-right font-medium">Tax</th>
                      <th className="p-3 text-right">Total ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {invoiceItems.map((item) => {
                      const itemSub = item.unitPrice * item.quantity;
                      const itemDisc = itemSub * (item.discountPercent / 100);
                      const taxRate = itemSub - itemDisc;
                      const itemTaxVal = taxRate * (item.taxPercent / 100);
                      const itemTot = taxRate + itemTaxVal;

                      return (
                        <tr key={item.id}>
                          <td className="p-3 font-semibold text-white">{item.productName}</td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="p-3 text-right font-medium">-{item.discountPercent}%</td>
                          <td className="p-3 text-right font-medium">+{item.taxPercent}%</td>
                          <td className="p-3 text-right font-bold text-white">${itemTot.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Remarks and Financial totals block */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 text-xs">
                <div className="max-w-sm text-slate-400 bg-white/2 rounded-xl p-3 border border-white/5">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider block mb-1">Notes / Terms:</span>
                  <p className="leading-relaxed">{notes || 'Thank you for your business. No additional terms applied.'}</p>
                </div>
                <div className="w-full sm:w-64 space-y-1.5 border border-white/5 bg-slate-950/40 p-4 rounded-xl font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal}</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>Total Disc:</span>
                    <span>-${totalDiscount}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Total Tax:</span>
                    <span>+${totalTax}</span>
                  </div>
                  <div className="border-t border-white/10 pt-1.5 flex justify-between font-bold text-sm text-white">
                    <span>Grand Total:</span>
                    <span className="text-cyan-400">${grandTotal}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print & Close Drawer controls */}
            <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  window.print();
                }}
                className="gap-2"
              >
                <FiPrinter /> Print Invoice
              </Button>
              <Button onClick={() => setShowPreview(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateInvoicePage;
