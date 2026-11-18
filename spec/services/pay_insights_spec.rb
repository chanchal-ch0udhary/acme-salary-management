require "rails_helper"

RSpec.describe PayInsights do
  # Small helper to build rows by hand, so every expected number can be checked with a calculator.
  def row(overrides = {})
    PayInsights::Row.new(
      { country: "US", department: "Engineering", level: 3, job_title: "Senior Software Engineer", gender: "M", salary_usd: 100_000 }.merge(overrides)
    )
  end

  describe "#overview" do
    it "counts people, countries and departments" do
      rows = [ row(country: "US"), row(country: "IN", department: "Sales"), row(country: "IN") ]
      result = described_class.new(rows).overview

      expect(result).to include(count: 3, countries: 2, departments: 2)
    end
  end

  describe "#breakdown" do
    let(:rows) { [ row(country: "US", salary_usd: 100_000), row(country: "US", salary_usd: 120_000), row(country: "IN", salary_usd: 30_000) ] }

    it "summarises every group, highest median first" do
      result = described_class.new(rows).breakdown("country")

      expect(result.map { |r| r[:key] }).to eq(%w[US IN])
      expect(result.first).to include(count: 2, median: 110_000, min: 100_000, max: 120_000)
    end

    it "sorts levels as numbers (2, 3, 10) and not as text" do
      result = described_class.new([ row(level: 10), row(level: 2), row(level: 3) ]).breakdown("level")
      expect(result.map { |r| r[:key] }).to eq(%w[2 3 10])
    end

    it "calls a missing gender 'Unspecified'" do
      expect(described_class.new([ row(gender: nil) ]).breakdown("gender").first[:key]).to eq("Unspecified")
    end
  end

  describe "#distribution" do
    it "puts salaries in bands and everything above the cap in the last open band" do
      rows = [ row(salary_usd: 5_000), row(salary_usd: 25_000), row(salary_usd: 999_000) ]
      buckets = described_class.new(rows).distribution(width: 20_000, cap: 60_000)

      expect(buckets.map { |b| b[:count] }).to eq([ 1, 1, 0, 1 ])
      expect(buckets.last).to include(from: 60_000, to: nil)
    end

    it "counts every employee exactly once" do
      rows = Array.new(50) { |i| row(salary_usd: i * 9_000) }
      expect(described_class.new(rows).distribution.sum { |b| b[:count] }).to eq(50)
    end
  end

  describe "#pay_gap" do
    def group(gender, salary, size)
      Array.new(size) { row(gender: gender, salary_usd: salary) }
    end

    let(:enough) { PayInsights::MIN_GROUP_SIZE }

    it "is (male - female) / male as a percentage" do
      rows = group("M", 100_000, enough) + group("F", 90_000, enough)
      result = described_class.new(rows).pay_gap("overall").first

      expect(result).to include(male_median: 100_000, female_median: 90_000, gap_pct: 10.0)
    end

    it "is negative when women are paid more" do
      rows = group("M", 90_000, enough) + group("F", 100_000, enough)
      expect(described_class.new(rows).pay_gap("overall").first[:gap_pct]).to be < 0
    end

    it "shows no percentage when a group is too small" do
      rows = group("M", 100_000, enough) + group("F", 90_000, enough - 1)
      expect(described_class.new(rows).pay_gap("overall").first[:gap_pct]).to be_nil
    end

    it "ignores people who are not F or M" do
      rows = [ row(gender: "X"), row(gender: nil) ]
      expect(described_class.new(rows).pay_gap("overall")).to eq([])
    end

    it "can be split by level" do
      rows = (group("M", 1, enough) + group("F", 1, enough)).each_with_index.map { |r, i| r.tap { |x| x.level = i.even? ? 1 : 2 } }
      expect(described_class.new(rows).pay_gap("level").map { |r| r[:key] }).to eq(%w[1 2])
    end
  end

  describe "with real employees" do
    it "uses only active employees" do
      create(:employee, salary: 100_000)
      create(:employee, salary: 200_000, status: "inactive")

      expect(described_class.new.overview).to include(count: 1, total: 100_000)
    end
  end
end
