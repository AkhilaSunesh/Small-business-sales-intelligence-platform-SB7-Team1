import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InvoiceListPage from '../index';
import invoiceService from '../../../services/invoiceService';
import { ToastProvider } from '../../../components/common/Toast';

// Mock the invoice service
jest.mock('../../../services/invoiceService');

const mockInvoicesResponse = {
  success: true,
  data: [
    {
      id: 'db-id-1',
      invoiceNumber: 'INV-2026-001',
      customer: { name: 'Acme Corp' },
      createdAt: '2026-07-28T00:00:00.000Z',
      dueDate: '2026-08-05T00:00:00.000Z',
      status: 'PAID',
      totalAmount: 1500,
      taxAmount: 150,
      discountAmount: 50,
      payments: [{ method: 'Credit Card' }],
      lineItems: []
    },
    {
      id: 'db-id-2',
      invoiceNumber: 'INV-2026-002',
      customer: { name: 'Global Inc' },
      createdAt: '2026-07-29T00:00:00.000Z',
      dueDate: '2026-08-10T00:00:00.000Z',
      status: 'UNPAID',
      totalAmount: 2200,
      taxAmount: 220,
      discountAmount: 0,
      payments: [{ method: 'UPI' }],
      lineItems: []
    }
  ],
  pagination: { total: 2, page: 1, pageSize: 10, totalPages: 1 }
};

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <InvoiceListPage />
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('InvoiceListPage Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', async () => {
    // Delay resolution to capture loading skeletons
    invoiceService.getInvoices.mockReturnValue(new Promise(() => {}));
    renderComponent();

    // Verify skeleton elements
    expect(screen.getByText(/Preparing backend integration.../i)).toBeInTheDocument();
  });

  test('renders error state on API failure and retries', async () => {
    invoiceService.getInvoices.mockRejectedValue(new Error('API rate limit exceeded.'));
    renderComponent();

    // Verify error card displays
    const errorText = await screen.findByText(/API rate limit exceeded/i);
    expect(errorText).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Retry Connection/i });
    expect(retryBtn).toBeInTheDocument();

    // Set success on retry and click
    invoiceService.getInvoices.mockResolvedValue(mockInvoicesResponse);
    fireEvent.click(retryBtn);

    // Verify loading state is shown and then resolves
    await waitFor(() => {
      expect(screen.getAllByText(/Acme Corp/i).length).toBeGreaterThan(0);
    });
  });

  test('renders empty state when no invoices exist', async () => {
    invoiceService.getInvoices.mockResolvedValue({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, pageSize: 10, totalPages: 1 }
    });
    renderComponent();

    const emptyTitle = await screen.findByRole('heading', { name: 'No Invoice Records' });
    expect(emptyTitle).toBeInTheDocument();
    expect(screen.getByText(/Waiting for backend integration/i)).toBeInTheDocument();
  });

  test('renders invoices list and lets user search & filter', async () => {
    invoiceService.getInvoices.mockResolvedValue(mockInvoicesResponse);
    renderComponent();

    // Verify invoices table rows
    expect(await screen.findAllByText('INV-2026-001')).not.toHaveLength(0);
    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThan(0);
    expect(screen.getAllByText('INV-2026-002').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Global Inc').length).toBeGreaterThan(0);

    // Search Interaction
    const searchInput = screen.getByPlaceholderText(/Search by customer name or invoice ID/i);
    fireEvent.change(searchInput, { target: { value: 'Acme' } });

    // Verify list is filtered
    await waitFor(() => {
      expect(screen.getAllByText('INV-2026-001').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('INV-2026-002')).not.toBeInTheDocument();

    // Change status filter
    const statusSelect = screen.getByLabelText(/Filter Status/i);
    fireEvent.change(statusSelect, { target: { value: 'Unpaid' } });

    // Wait for load to complete
    await waitFor(() => {
      expect(screen.queryByText('Preparing backend integration...')).not.toBeInTheDocument();
    });

    // Clear filters
    const clearBtn = screen.getByRole('button', { name: /Clear/i });
    fireEvent.click(clearBtn);

    // Verify they are restored
    await waitFor(() => {
      expect(screen.getAllByText('INV-2026-002').length).toBeGreaterThan(0);
    });
  });

  test('opens View details and closes it', async () => {
    invoiceService.getInvoices.mockResolvedValue(mockInvoicesResponse);
    renderComponent();

    // Find and click the eye button for the first row
    const viewButtons = await screen.findAllByTitle(/View details/i);
    fireEvent.click(viewButtons[0]);

    // Verify modal overlay opens
    expect(screen.getByText('Invoice Details')).toBeInTheDocument();
    expect(screen.getAllByText('INV-2026-001').length).toBe(2);

    // Close the details modal
    const closeBtn = screen.getByRole('button', { name: /Close View/i });
    fireEvent.click(closeBtn);

    // Verify modal is gone
    await waitFor(() => {
      expect(screen.queryByText('Invoice Details')).not.toBeInTheDocument();
    });
  });

  test('opens Delete confirmation modal and cancels', async () => {
    invoiceService.getInvoices.mockResolvedValue(mockInvoicesResponse);
    renderComponent();

    // Find and click the trash button for the first row
    const deleteButtons = await screen.findAllByTitle(/Delete invoice/i);
    fireEvent.click(deleteButtons[0]);

    // Verify confirmation details are displayed
    expect(screen.getByText('Delete Invoice')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Verify modal closes and invoice is still visible
    await waitFor(() => {
      expect(screen.queryByText('Delete Invoice')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('INV-2026-001').length).toBeGreaterThan(0);
  });
});
