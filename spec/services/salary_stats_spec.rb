require "rails_helper"

RSpec.describe SalaryStats do
  describe ".percentile" do
    it "returns 0 for an empty list" do
      expect(described_class.percentile([], 0.5)).to eq(0)
    end

    it "matches Excel's PERCENTILE.INC" do
      data = [ 10, 20, 30, 40, 50 ]

      expect(described_class.percentile(data, 0)).to eq(10)
      expect(described_class.percentile(data, 0.25)).to eq(20)
      expect(described_class.percentile(data, 0.5)).to eq(30)
      expect(described_class.percentile(data, 1)).to eq(50)
    end

    it "is between two numbers when the position is in the middle" do
      expect(described_class.percentile([ 10, 20 ], 0.5)).to eq(15)
    end
  end

  describe ".summarize" do
    it "gives the full summary, whatever the order of the input" do
      expect(described_class.summarize([ 50, 10, 30, 20, 40 ])).to eq(
        count: 5, total: 150, min: 10, p25: 20, median: 30, mean: 30, p75: 40, max: 50
      )
    end

    it "handles an empty list" do
      expect(described_class.summarize([])[:median]).to eq(0)
    end

    it "does not change the list that was passed in" do
      values = [ 3, 1, 2 ]
      described_class.summarize(values)
      expect(values).to eq([ 3, 1, 2 ])
    end
  end
end
