# One entry in an employee's salary history.
class SalaryChange < ApplicationRecord
  belongs_to :employee

  validates :new_salary, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: Employee::MAX_SALARY }
  validates :effective_date, presence: true
  validates :reason, length: { in: 3..200 }

  # These two rules only matter when someone *changes* a salary (not for the first entry).
  validate :salary_must_be_different, on: :create
  validate :employee_must_be_active, on: :create

  private

  def salary_must_be_different
    errors.add(:new_salary, "is the same as the current salary") if old_salary.present? && old_salary == new_salary
  end

  def employee_must_be_active
    errors.add(:base, "Cannot change the salary of an inactive employee") if old_salary.present? && !employee.active?
  end
end
