import React from 'react';
import { calculatePrice } from '../../utils/priceCalculator';
import { formatCurrency } from '../../utils/formatters';
import Card from '../../shared/Card';

export default function PriceCalculator({ config, pricing }) {
  const result = calculatePrice(config, pricing);

  if (config.pageCount === 0) {
    return (
      <Card className="bg-surface-50 border-dashed border-2 border-surface-200">
        <div className="text-center py-4">
          <p className="text-sm text-surface-400">Upload a file to see price estimate</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-brand-50 border-brand-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-surface-500 font-medium mb-1">Estimated Price</div>
          <div className="text-2xl font-black text-brand-600">{formatCurrency(result.totalPrice)}</div>
        </div>
        <div className="text-right space-y-1">
          {result.breakdown.map((item, i) => (
            <div key={i} className="text-xs text-surface-500">
              {item.label}: {formatCurrency(item.amount)}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
