require "rails_helper"

RSpec.describe "CSV import and export", type: :request do
  def json
    JSON.parse(response.body)
  end

  def import(text)
    post "/api/employees/import", params: text, headers: { "CONTENT_TYPE" => "text/csv" }
  end

  let(:header) { "Full Name,Email,Gender,Department,Job Title,Level,Country,Salary,Hire Date" }

  describe "import" do
    it "saves the good rows and reports the bad ones" do
      import([
        header,
        "Ana Cruz,ana@x.io,F,Sales,Account Executive,2,BR,120000,2023-01-10",
        "Bad Row,not-an-email,M,Sales,Account Executive,2,BR,120000,2023-01-10",
        "Raj Mehta,raj@x.io,M,Nowhere,Engineer,3,IN,2000000,2021-05-05",
        "Li Wei,li@x.io,,Data,Analyst,2,JP,6000000,2020-03-03"
      ].join("\n"))

      expect(json).to include("imported" => 2, "failed" => 2)
      expect(json["errors"].map { |e| e["row"] }).to eq([ 2, 3 ])
      expect(Employee.count).to eq(2)
    end

    it "rejects emails that already exist, and emails that appear twice in the file" do
      create(:employee, email: "dup@x.io")
      import([
        header,
        "A One,dup@x.io,F,HR,Partner,1,US,50000,2020-01-01",
        "B Two,new@x.io,M,HR,Partner,1,US,50000,2020-01-01",
        "C Three,new@x.io,M,HR,Partner,1,US,50000,2020-01-01"
      ].join("\n"))

      expect(json).to include("imported" => 1, "failed" => 2)
    end

    it "gives 400 for a file without data rows" do
      import(header)
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "export" do
    before do
      create(:employee, full_name: "=cmd|evil", email: "e1@x.io", country: "US", salary: 100_000)
      create(:employee, email: "e2@x.io", country: "IN", salary: 2_400_000)
    end

    it "exports only what the filters show" do
      get "/api/employees/export.csv", params: { country: "US" }

      expect(response.media_type).to eq("text/csv")
      lines = response.body.strip.split("\n")
      expect(lines.size).to eq(2) # header + 1 employee
      expect(lines.first).to include("salary_usd")
    end

    it "protects Excel users from formulas hidden in text" do
      get "/api/employees/export.csv", params: { country: "US" }
      expect(response.body).to include("'=cmd|evil")
    end
  end

  describe EmployeeCsv do
    it "leaves normal numbers alone but protects text that looks like a formula" do
      expect(described_class.safe_cell("=1+1")).to eq("'=1+1")
      expect(described_class.safe_cell("+91 123")).to eq("'+91 123")
      expect(described_class.safe_cell(-5)).to eq(-5)
      expect(described_class.safe_cell("Asha")).to eq("Asha")
    end
  end
end
