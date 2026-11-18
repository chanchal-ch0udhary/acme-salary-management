# The countries we support, with their currency and a fixed exchange rate to USD.
#
# Why a plain Ruby list and not a database table? It is small, it never changes while the
# app runs, and it is easy to read. (Live exchange rates are out of scope, see docs/REQUIREMENTS.md.)
class Country
  Info = Struct.new(:code, :name, :currency, :usd_per_unit, :cost_index, keyword_init: true)

  RATES_AS_OF = "2026-01-01".freeze

  # usd_per_unit: 1 unit of the local currency = how many USD.
  # cost_index:   only used by the seed script to make fake salaries realistic per country.
  ALL = [
    Info.new(code: "US", name: "United States", currency: "USD", usd_per_unit: 1.0, cost_index: 1.0),
    Info.new(code: "IN", name: "India", currency: "INR", usd_per_unit: 0.012, cost_index: 0.28),
    Info.new(code: "GB", name: "United Kingdom", currency: "GBP", usd_per_unit: 1.27, cost_index: 0.82),
    Info.new(code: "DE", name: "Germany", currency: "EUR", usd_per_unit: 1.08, cost_index: 0.85),
    Info.new(code: "FR", name: "France", currency: "EUR", usd_per_unit: 1.08, cost_index: 0.78),
    Info.new(code: "CA", name: "Canada", currency: "CAD", usd_per_unit: 0.73, cost_index: 0.8),
    Info.new(code: "AU", name: "Australia", currency: "AUD", usd_per_unit: 0.66, cost_index: 0.88),
    Info.new(code: "SG", name: "Singapore", currency: "SGD", usd_per_unit: 0.74, cost_index: 0.9),
    Info.new(code: "JP", name: "Japan", currency: "JPY", usd_per_unit: 0.0067, cost_index: 0.7),
    Info.new(code: "BR", name: "Brazil", currency: "BRL", usd_per_unit: 0.2, cost_index: 0.38),
    Info.new(code: "AE", name: "United Arab Emirates", currency: "AED", usd_per_unit: 0.272, cost_index: 0.85),
    Info.new(code: "MX", name: "Mexico", currency: "MXN", usd_per_unit: 0.055, cost_index: 0.4)
  ].freeze

  def self.find(code)
    ALL.find { |country| country.code == code }
  end

  def self.codes
    ALL.map(&:code)
  end
end
