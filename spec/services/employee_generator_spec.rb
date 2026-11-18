require "rails_helper"

RSpec.describe EmployeeGenerator do
  it "gives the same people for the same seed, and different people for another seed" do
    expect(described_class.new(50, seed: 7).call).to eq(described_class.new(50, seed: 7).call)
    expect(described_class.new(50, seed: 7).call).not_to eq(described_class.new(50, seed: 8).call)
  end

  describe "the generated data" do
    let(:employees_and_history) { described_class.new(1_000, seed: 1).call }
    let(:employees) { employees_and_history.first }
    let(:history) { employees_and_history.last }

    it "has unique emails" do
      expect(employees.map { |e| e[:email] }.uniq.size).to eq(1_000)
    end

    it "only uses known countries, departments and levels" do
      expect(employees.map { |e| e[:country] }.uniq - Country.codes).to be_empty
      expect(employees.map { |e| e[:department] }.uniq - Employee::DEPARTMENTS).to be_empty
      expect(employees.map { |e| e[:level] }.uniq - Employee::LEVELS.keys).to be_empty
    end

    it "has positive salaries" do
      expect(employees).to all(include(salary: be > 0))
    end

    it "ends every employee's history at the current salary" do
      last_by_employee = history.group_by { |h| h[:employee_id] }.transform_values(&:last)

      employees.each do |employee|
        expect(last_by_employee[employee[:id]][:new_salary]).to eq(employee[:salary])
      end
    end

    it "starts every history with the initial salary" do
      first_rows = history.group_by { |h| h[:employee_id] }.values.map(&:first)
      expect(first_rows).to all(include(old_salary: nil, reason: "Initial salary"))
    end
  end
end

RSpec.describe EmployeeSeeder do
  it "saves employees and history, and the records are valid" do
    described_class.run(count: 200)

    expect(Employee.count).to eq(200)
    expect(SalaryChange.count).to be >= 200
    expect(Employee.first(20)).to all(be_valid)
  end
end
