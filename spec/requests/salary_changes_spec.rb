require "rails_helper"

RSpec.describe "Salary changes API", type: :request do
  let(:employee) { create(:employee, salary: 100_000) }

  def json
    JSON.parse(response.body)
  end

  def change_salary(params = {})
    post "/api/employees/#{employee.id}/salary",
         params: { new_salary: 110_000, effective_date: "2025-04-01", reason: "Annual review" }.merge(params), as: :json
  end

  it "updates the salary and adds a history row, newest first" do
    change_salary

    expect(response).to have_http_status(:ok)
    expect(json["salary"]).to eq(110_000)

    get "/api/employees/#{employee.id}/salary_history"
    expect(json.map { |h| h["new_salary"] }).to eq([ 110_000, 100_000 ])
    expect(json.first).to include("old_salary" => 100_000, "reason" => "Annual review", "effective_date" => "2025-04-01")
  end

  it "needs a reason" do
    change_salary(reason: "")

    expect(response).to have_http_status(:unprocessable_content)
    expect(employee.reload.salary).to eq(100_000)
  end

  it "does not accept the same salary" do
    change_salary(new_salary: 100_000)
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "does not accept a salary that is not a positive whole number" do
    change_salary(new_salary: -1)
    expect(response).to have_http_status(:unprocessable_content)

    change_salary(new_salary: 1234.5)
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "is not allowed for an inactive employee" do
    employee.inactive!
    change_salary

    expect(response).to have_http_status(:unprocessable_content)
    expect(json["error"]["message"]).to include("inactive")
    expect(employee.reload.salary).to eq(100_000)
  end

  it "does not leave a history row behind when the change is refused" do
    employee # create the employee (and its first history row) before we start counting
    expect { change_salary(reason: "") }.not_to change(SalaryChange, :count)
  end
end
