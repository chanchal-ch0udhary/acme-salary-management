# Answers "how do we pay people?" for the dashboard.
#
# It loads one small row per active employee (about 9,500 rows, a few milliseconds) and does the
# grouping in plain Ruby. That keeps the maths easy to read and easy to test.
class PayInsights
  DIMENSIONS = %w[country department level job_title gender].freeze
  GAP_GROUPS = %w[overall level department].freeze

  # With fewer people than this in a group a median is just noise, so we do not show a gap.
  MIN_GROUP_SIZE = 5

  Row = Struct.new(:country, :department, :level, :job_title, :gender, :salary_usd, keyword_init: true)

  def initialize(rows = nil)
    @rows = rows || load_rows
  end

  # Headline numbers: headcount, payroll, median ...
  def overview
    SalaryStats.summarize(@rows.map(&:salary_usd)).merge(
      countries: @rows.map(&:country).uniq.size,
      departments: @rows.map(&:department).uniq.size
    )
  end

  # Salary summary per country / department / level / job title / gender.
  def breakdown(by)
    groups = @rows.group_by { |row| group_key(row, by) }
    result = groups.map { |key, rows| { key: key }.merge(SalaryStats.summarize(rows.map(&:salary_usd))) }

    if by == "level"
      result.sort_by { |row| row[:key].to_i }
    else
      result.sort_by { |row| -row[:median] }
    end
  end

  # How many employees are in each salary band (USD). The last bucket is open-ended ("300K+").
  def distribution(width: 20_000, cap: 300_000)
    bucket_count = cap / width
    counts = Array.new(bucket_count + 1, 0)
    @rows.each { |row| counts[[ row.salary_usd / width, bucket_count ].min] += 1 }

    counts.each_with_index.map do |count, index|
      { from: index * width, to: index < bucket_count ? (index + 1) * width : nil, count: count }
    end
  end

  # Median female vs male salary. gap_pct = (male - female) / male * 100, so a positive number
  # means women are paid less. Only F and M are compared.
  def pay_gap(by)
    groups = Hash.new { |hash, key| hash[key] = { "F" => [], "M" => [] } }
    @rows.each do |row|
      next unless %w[F M].include?(row.gender)

      key = by == "overall" ? "All employees" : row.public_send(by).to_s
      groups[key][row.gender] << row.salary_usd
    end

    result = groups.map { |key, pay| gap_row(key, pay["F"], pay["M"]) }
    by == "level" ? result.sort_by { |row| row[:key].to_i } : result.sort_by { |row| row[:key] }
  end

  private

  def load_rows
    Employee.active.pluck(:country, :department, :level, :job_title, :gender, :salary_usd).map do |values|
      Row.new(**%i[country department level job_title gender salary_usd].zip(values).to_h)
    end
  end

  def group_key(row, by)
    return row.gender || "Unspecified" if by == "gender"

    row.public_send(by).to_s
  end

  def gap_row(key, female, male)
    female_median = SalaryStats.summarize(female)[:median]
    male_median = SalaryStats.summarize(male)[:median]
    enough_people = female.size >= MIN_GROUP_SIZE && male.size >= MIN_GROUP_SIZE

    {
      key: key,
      female_count: female.size,
      male_count: male.size,
      female_median: female_median,
      male_median: male_median,
      gap_pct: enough_people ? ((male_median - female_median) * 100.0 / male_median).round(1) : nil
    }
  end
end
