require "rails_helper"

RSpec.describe "Insights API", type: :request do
  def json
    JSON.parse(response.body)
  end

  before do
    create(:employee, country: "US", salary: 100_000, gender: "M")
    create(:employee, country: "US", salary: 140_000, gender: "F")
    create(:employee, country: "IN", salary: 5_000_000, gender: "F") # $60,000
    create(:employee, country: "US", salary: 900_000, status: "inactive")
  end

  it "overview counts active employees only, in USD" do
    get "/api/insights/overview"

    expect(json).to include("count" => 3, "total" => 300_000, "median" => 100_000, "countries" => 2)
  end

  it "breakdown groups the salaries" do
    get "/api/insights/breakdown", params: { by: "country" }

    rows = json["rows"]
    expect(rows.find { |r| r["key"] == "US" }).to include("count" => 2, "median" => 120_000)
    expect(rows.find { |r| r["key"] == "IN" }).to include("count" => 1, "median" => 60_000)
  end

  it "breakdown rejects an unknown group" do
    get "/api/insights/breakdown", params: { by: "salary" }
    expect(response).to have_http_status(:bad_request)
  end

  it "distribution counts every active employee once" do
    get "/api/insights/distribution"
    expect(json["buckets"].sum { |b| b["count"] }).to eq(3)
  end

  it "pay gap shows no percentage for groups that are too small" do
    get "/api/insights/pay_gap", params: { by: "overall" }

    expect(json["rows"].first).to include("female_count" => 2, "male_count" => 1, "gap_pct" => nil)
  end
end
