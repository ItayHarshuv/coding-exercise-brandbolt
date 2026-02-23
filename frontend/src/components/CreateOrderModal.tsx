import { FormEvent } from "react";
import Combobox, { ComboboxOption } from "./Combobox";
import { Product } from "../types";

type OrderCreateLine = { productId: number | null; quantity: number };

type CreateOrderModalProps = {
  isOpen: boolean;
  createLoading: boolean;
  createError: string | null;
  newOrderCustomerId: number | null;
  customerOptions: ComboboxOption<number>[];
  newOrderItems: OrderCreateLine[];
  products: Product[];
  productOptions: ComboboxOption<number>[];
  runningTotal: number;
  newOrderNotes: string;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onCustomerChange: (value: number | null) => void;
  onItemProductChange: (index: number, value: number | null) => void;
  onItemQuantityChange: (index: number, rawValue: string) => void;
  onRemoveItem: (index: number) => void;
  onAddItem: () => void;
  onNotesChange: (value: string) => void;
};

export default function CreateOrderModal({
  isOpen,
  createLoading,
  createError,
  newOrderCustomerId,
  customerOptions,
  newOrderItems,
  products,
  productOptions,
  runningTotal,
  newOrderNotes,
  onClose,
  onSubmit,
  onCustomerChange,
  onItemProductChange,
  onItemQuantityChange,
  onRemoveItem,
  onAddItem,
  onNotesChange,
}: CreateOrderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Order</h2>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={onClose}
            disabled={createLoading}
          >
            &#10005;
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Customer</label>
              <Combobox
                value={newOrderCustomerId}
                onChange={onCustomerChange}
                options={customerOptions}
                placeholder="Select customer"
                searchPlaceholder="Search customers..."
                emptyText="No customers found"
                disabled={createLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Items</label>
              {newOrderItems.map((item, index) => {
                const selectedProduct = products.find(
                  (product) => product.id === item.productId,
                );
                const lineTotal = selectedProduct
                  ? selectedProduct.price * item.quantity
                  : 0;
                return (
                  <div key={index} className="line-item-row">
                    <Combobox
                      value={item.productId}
                      onChange={(value) => onItemProductChange(index, value)}
                      options={productOptions}
                      placeholder="Select product"
                      searchPlaceholder="Search products..."
                      emptyText="No products found"
                      disabled={createLoading}
                    />
                    <input
                      className="form-input"
                      type="number"
                      min={1}
                      step={1}
                      value={item.quantity}
                      onChange={(event) =>
                        onItemQuantityChange(index, event.target.value)
                      }
                    />
                    <span className="line-total">${lineTotal.toFixed(2)}</span>
                    <button
                      className="btn btn-danger btn-sm"
                      type="button"
                      onClick={() => onRemoveItem(index)}
                      disabled={newOrderItems.length <= 1}
                    >
                      &#10005;
                    </button>
                  </div>
                );
              })}
              <button
                className="btn btn-ghost btn-sm mt-sm"
                type="button"
                onClick={onAddItem}
              >
                + Add Item
              </button>
              <div className="running-total">
                <span className="running-total-label">Total:</span>
                <span className="running-total-value">
                  ${runningTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-textarea"
                value={newOrderNotes}
                onChange={(event) => onNotesChange(event.target.value)}
              />
            </div>

            {createError && <div className="form-error">{createError}</div>}
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onClose}
              disabled={createLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={createLoading}
            >
              {createLoading ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
