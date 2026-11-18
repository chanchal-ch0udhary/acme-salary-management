# Small statistics helpers: median, percentiles and a summary of a list of numbers.
module SalaryStats
  module_function

  # Percentile with interpolation (same as Excel's PERCENTILE.INC).
  # `sorted_values` must already be sorted from small to large. p is between 0 and 1.
  def percentile(sorted_values, p)
    return 0 if sorted_values.empty?

    position = (sorted_values.size - 1) * p
    lower = sorted_values[position.floor]
    upper = sorted_values[position.ceil]
    lower + (upper - lower) * (position - position.floor)
  end

  # { count:, total:, min:, p25:, median:, mean:, p75:, max: } (whole numbers)
  def summarize(values)
    return { count: 0, total: 0, min: 0, p25: 0, median: 0, mean: 0, p75: 0, max: 0 } if values.empty?

    sorted = values.sort
    total = sorted.sum
    {
      count: sorted.size,
      total: total.round,
      min: sorted.first.round,
      p25: percentile(sorted, 0.25).round,
      median: percentile(sorted, 0.5).round,
      mean: (total / sorted.size.to_f).round,
      p75: percentile(sorted, 0.75).round,
      max: sorted.last.round
    }
  end
end
