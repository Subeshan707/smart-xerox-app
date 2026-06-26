/**
 * Helper to parse a page range string like "1-3, 5" into a total number of pages.
 * @param {string} rangeStr 
 * @param {number} maxPages 
 * @returns {number}
 */
export function parsePageRange(rangeStr, maxPages) {
  if (!rangeStr || rangeStr.trim() === 'all') return maxPages;
  const parts = rangeStr.split(',');
  const pages = new Set();
  
  parts.forEach(part => {
    part = part.trim();
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n, 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
          pages.add(i);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        pages.add(p);
      }
    }
  });

  return pages.size > 0 ? pages.size : maxPages;
}

/**
 * Calculate price in paise (smallest currency unit)
 * @param {Array} files - Array of file objects with their jobConfigs
 * @param {Object} pricing - Shop pricing config
 * @returns {Object} Price breakdown
 */
export function calculatePrice(files, pricing) {
  const {
    bwPricePerPage = 200,       // 200 paise = ₹2
    colourPricePerPage = 500,   // 500 paise = ₹5
    a3Surchargeperpage = 300,   // 300 paise = ₹3
    minimumOrderAmount = 0,
  } = pricing || {};

  let basePrice = 0;
  let sizeSurcharge = 0;
  let breakdown = [];
  let totalCalculatedPages = 0;
  let totalCopies = 0;

  (files || []).forEach((file, index) => {
    const config = file.jobConfig || {};
    const copies = Math.max(1, config.copies || 1);
    const rawPageCount = file.pageCount || 1;
    const pageCount = parsePageRange(config.pageRange || 'all', rawPageCount);
    const isColour = config.isColour || false;
    const paperSize = config.paperSize || 'A4';

    const pricePerPage = isColour ? colourPricePerPage : bwPricePerPage;
    const fileBasePrice = pricePerPage * pageCount * copies;
    const fileSizeSurcharge = paperSize === 'A3' ? a3Surchargeperpage * pageCount * copies : 0;

    basePrice += fileBasePrice;
    sizeSurcharge += fileSizeSurcharge;
    totalCalculatedPages += pageCount;
    totalCopies += copies;

    breakdown.push({
      label: `File ${index + 1}: ${file.name || file.fileName || 'Document'} (${isColour ? 'Colour' : 'B&W'})`,
      detail: `${pageCount} pages × ${copies} copies × ₹${(pricePerPage / 100).toFixed(2)}`,
      amount: fileBasePrice,
    });

    if (fileSizeSurcharge > 0) {
      breakdown.push({
        label: `File ${index + 1} A3 surcharge`,
        detail: `${pageCount} pages × ${copies} copies × ₹${(a3Surchargeperpage / 100).toFixed(2)}`,
        amount: fileSizeSurcharge,
      });
    }
  });

  let totalPrice = basePrice + sizeSurcharge;

  // Enforce minimum
  if (minimumOrderAmount > 0 && totalPrice < minimumOrderAmount) {
    totalPrice = minimumOrderAmount;
  }

  return {
    basePrice,
    sizeSurcharge,
    totalPrice,
    totalCalculatedPages,
    totalCopies,
    breakdown,
  };
}

/**
 * Default pricing values (in paise)
 */
export const DEFAULT_PRICING = {
  bwPricePerPage: 200,
  colourPricePerPage: 500,
  a3Surchargeperpage: 300,
  minimumOrderAmount: 500,
  allowPayAtCounter: true,
};
