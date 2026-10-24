// Dummy extraction result for the HousingAnywhere invoice. Replace with real extraction later.
export const SAMPLE_INVOICE_DATA: Record<string, unknown> = {
  vendor: {
    name: 'HousingAnywhere B.V.',
    address: 'Aert van Nesstraat 45, 3012CA Rotterdam, Netherlands',
    vat_number: 'NL853222368B01',
    kvk_number: '58882693'
  },
  bill_to: {
    name: 'Nikhil Ahuja',
    address: 'Flat 5A, Block 5, 7 Lung Pak St, Tai Wai, Tai Wai, Hong Kong'
  },
  items: [
    {
      description: 'Payment requested by advertiser DEPOSIT',
      quantity: 1,
      price: 1030.0,
      amount: 1030.0
    },
    {
      description: 'Service fee',
      quantity: 1,
      price: 25.75,
      amount: 25.75
    }
  ],
  currency: 'EUR',
  total: 1055.75
};
