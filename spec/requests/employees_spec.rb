require "rails_helper"

RSpec.describe "Employees API", type: :request do
  def json
    JSON.parse(response.body)
  end

  def valid_params(overrides = {})
    { full_name: "Asha Verma", email: "asha@acme.example", gender: "F", department: "Engineering",
      job_title: "Software Engineer", level: 3, country: "IN", salary: 2_400_000, hire_date: "2022-04-01" }.merge(overrides)
  end

  describe "POST /api/employees" do
    it "creates an employee with currency, USD salary and the first history row" do
      post "/api/employees", params: valid_params, as: :json

      expect(response).to have_http_status(:created)
      expect(json).to include("full_name" => "Asha Verma", "code" => "EMP-00001", "currency" => "INR",
                              "salary" => 2_400_000, "salary_usd" => 28_800, "status" => "active")

      get "/api/employees/#{json['id']}/salary_history"
      expect(json.size).to eq(1)
      expect(json.first).to include("old_salary" => nil, "new_salary" => 2_400_000, "reason" => "Initial salary")
    end

    it "returns the errors per field when the data is wrong" do
      post "/api/employees", params: valid_params(email: "nope", salary: -5, level: 9), as: :json

      expect(response).to have_http_status(:unprocessable_content)
      fields = json["error"]["details"].map { |d| d["field"] }
      expect(fields).to include("email", "salary", "level")
    end

    it "does not accept an email that is already used" do
      create(:employee, email: "asha@acme.example")
      post "/api/employees", params: valid_params(email: "ASHA@acme.example"), as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/employees" do
    before do
      create(:employee, full_name: "Asha Verma", email: "a@x.io", country: "IN", salary: 2_400_000)
      create(:employee, full_name: "Bob Stone", email: "b@x.io", country: "US", department: "Sales", salary: 90_000)
      create(:employee, full_name: "Cara Diaz", email: "c@x.io", country: "US", salary: 150_000, level: 5)
    end

    def names
      json["items"].map { |e| e["full_name"] }
    end

    it "pages the results and tells the totals" do
      get "/api/employees", params: { page_size: 2, page: 2 }

      expect(json).to include("total" => 3, "page" => 2, "page_size" => 2, "total_pages" => 2)
      expect(json["items"].size).to eq(1)
    end

    it "filters by country and department together" do
      get "/api/employees", params: { country: "US", department: "Sales" }
      expect(names).to eq([ "Bob Stone" ])
    end

    it "filters by level and status" do
      Employee.find_by(email: "c@x.io").inactive!

      get "/api/employees", params: { level: 5, status: "inactive" }
      expect(names).to eq([ "Cara Diaz" ])
    end

    it "searches name, email and employee code" do
      get "/api/employees", params: { q: "diaz" }
      expect(names).to eq([ "Cara Diaz" ])

      get "/api/employees", params: { q: "b@x" }
      expect(names).to eq([ "Bob Stone" ])

      get "/api/employees", params: { q: Employee.find_by(email: "a@x.io").code }
      expect(names).to eq([ "Asha Verma" ])
    end

    it "treats % in the search text as a normal character" do
      get "/api/employees", params: { q: "%" }
      expect(json["total"]).to eq(0)
    end

    it "sorts and filters by the salary in USD, not by the local amount" do
      # Asha's number (2,400,000 INR) is the biggest, but it is only about $28,800.
      get "/api/employees", params: { sort_by: "salary", sort_dir: "desc" }
      expect(names).to eq([ "Cara Diaz", "Bob Stone", "Asha Verma" ])

      get "/api/employees", params: { min_salary_usd: 100_000 }
      expect(names).to eq([ "Cara Diaz" ])
    end

    it "ignores an unknown sort column instead of putting it into SQL" do
      get "/api/employees", params: { sort_by: "salary; DROP TABLE employees" }

      expect(response).to have_http_status(:ok)
      expect(Employee.count).to eq(3)
    end

    it "never returns more than 100 employees per page" do
      get "/api/employees", params: { page_size: 5000 }
      expect(json["page_size"]).to eq(100)
    end
  end

  describe "GET /api/employees/:id" do
    it "returns the employee" do
      employee = create(:employee)
      get "/api/employees/#{employee.id}"

      expect(json).to include("id" => employee.id, "email" => employee.email)
    end

    it "returns 404 when it does not exist" do
      get "/api/employees/999"

      expect(response).to have_http_status(:not_found)
      expect(json["error"]["code"]).to eq("NOT_FOUND")
    end
  end

  describe "PATCH /api/employees/:id" do
    let(:employee) { create(:employee, salary: 100_000, country: "US") }

    it "updates profile fields" do
      patch "/api/employees/#{employee.id}", params: { job_title: "Staff Engineer", level: 4 }, as: :json

      expect(json).to include("job_title" => "Staff Engineer", "level" => 4)
    end

    it "does not change the salary or the country (they are ignored)" do
      patch "/api/employees/#{employee.id}", params: { salary: 1, country: "IN", job_title: "Staff Engineer" }, as: :json

      expect(employee.reload).to have_attributes(salary: 100_000, country: "US", job_title: "Staff Engineer")
    end

    it "can deactivate an employee" do
      patch "/api/employees/#{employee.id}", params: { status: "inactive" }, as: :json
      expect(json["status"]).to eq("inactive")
    end
  end
end
