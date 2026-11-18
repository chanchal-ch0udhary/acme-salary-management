require "rails_helper"

RSpec.describe Employee do
  describe "validations" do
    it "is valid with the factory defaults" do
      expect(build(:employee)).to be_valid
    end

    it "needs a valid email" do
      expect(build(:employee, email: "not-an-email")).not_to be_valid
    end

    it "does not allow the same email twice, ignoring upper/lower case" do
      create(:employee, email: "asha@acme.example")
      duplicate = build(:employee, email: "ASHA@acme.example")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to be_present
    end

    it "only allows levels 1 to 7" do
      expect(build(:employee, level: 0)).not_to be_valid
      expect(build(:employee, level: 8)).not_to be_valid
    end

    it "only allows known countries and departments" do
      expect(build(:employee, country: "XX")).not_to be_valid
      expect(build(:employee, department: "Pirates")).not_to be_valid
    end

    it "needs a positive whole-number salary" do
      expect(build(:employee, salary: 0)).not_to be_valid
      expect(build(:employee, salary: -5)).not_to be_valid
      expect(build(:employee, salary: 1000.5)).not_to be_valid
    end

    it "rejects a date that does not exist" do
      expect(build(:employee, hire_date: "2022-02-31")).not_to be_valid
    end

    it "treats an empty gender as not specified" do
      employee = create(:employee, gender: "")
      expect(employee.gender).to be_nil
    end

    it "does not allow the country to change later" do
      employee = create(:employee, country: "US")
      employee.country = "IN"

      expect(employee).not_to be_valid
      expect(employee.errors[:country]).to be_present
    end
  end

  describe "before saving" do
    it "sets the currency from the country" do
      expect(create(:employee, country: "IN").currency).to eq("INR")
    end

    it "calculates the salary in USD" do
      employee = create(:employee, country: "IN", salary: 2_400_000) # 1 INR = 0.012 USD
      expect(employee.salary_usd).to eq(28_800)
    end

    it "cleans the email and the name" do
      employee = create(:employee, email: "  Asha@Acme.Example ", full_name: "  Asha Verma ")
      expect(employee.email).to eq("asha@acme.example")
      expect(employee.full_name).to eq("Asha Verma")
    end
  end

  describe "#code" do
    it "looks like EMP-00042" do
      employee = build(:employee, id: 42)
      expect(employee.code).to eq("EMP-00042")
    end
  end

  describe "first salary history row" do
    it "is written when the employee is created" do
      employee = create(:employee, salary: 90_000, hire_date: Date.new(2023, 5, 1))

      expect(employee.salary_changes.count).to eq(1)
      first = employee.salary_changes.first
      expect(first).to have_attributes(old_salary: nil, new_salary: 90_000, reason: "Initial salary", effective_date: Date.new(2023, 5, 1))
    end
  end

  describe "#change_salary" do
    let(:employee) { create(:employee, salary: 100_000) }

    def change(attrs = {})
      employee.change_salary(**{ new_salary: 110_000, effective_date: Date.new(2025, 4, 1), reason: "Annual review" }.merge(attrs))
    end

    it "updates the salary, the USD salary and adds a history row" do
      result = change

      expect(result).to be_persisted
      expect(employee.reload).to have_attributes(salary: 110_000, salary_usd: 110_000)
      expect(employee.salary_changes.order(:id).last).to have_attributes(old_salary: 100_000, new_salary: 110_000, reason: "Annual review")
    end

    it "needs a reason" do
      result = change(reason: "")

      expect(result).not_to be_persisted
      expect(employee.reload.salary).to eq(100_000)
    end

    it "does not accept the same salary again" do
      expect(change(new_salary: 100_000)).not_to be_persisted
    end

    it "does not change the salary of an inactive employee" do
      employee.inactive!
      result = change

      expect(result).not_to be_persisted
      expect(result.errors.full_messages.to_sentence).to include("inactive")
      expect(employee.reload.salary).to eq(100_000)
    end
  end
end
