# Saves generated employees (and their salary history) into the database, fast.
# Uses insert_all, which writes many rows in one SQL statement and skips callbacks.
class EmployeeSeeder
  DEFAULT_COUNT = 10_000
  BATCH_SIZE = 1_000

  def self.run(count: DEFAULT_COUNT, seed: nil)
    employees, history = EmployeeGenerator.new(count, **{ seed: seed }.compact).call

    Employee.transaction do
      employees.each_slice(BATCH_SIZE) { |batch| Employee.insert_all(batch) }
      history.each_slice(BATCH_SIZE) { |batch| SalaryChange.insert_all(batch) }
    end

    count
  end
end
