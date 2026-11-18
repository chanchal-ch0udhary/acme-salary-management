class Employee < ApplicationRecord
  DEPARTMENTS = %w[Engineering Product Design Data Sales Marketing Finance HR Operations Support Legal].freeze
  LEVELS = { 1 => "Associate", 2 => "Professional", 3 => "Senior", 4 => "Lead", 5 => "Principal", 6 => "Director", 7 => "VP" }.freeze
  GENDERS = %w[F M X].freeze
  MAX_SALARY = 1_000_000_000_000

  has_many :salary_changes, dependent: :destroy

  enum :status, { active: "active", inactive: "inactive" }, default: "active"

  # Clean the data before validating (trim spaces, lowercase the email, empty gender -> nil).
  normalizes :full_name, :job_title, with: ->(value) { value.strip }
  normalizes :email, with: ->(value) { value.strip.downcase }
  normalizes :gender, with: ->(value) { value.presence }

  validates :full_name, length: { in: 2..120 }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, length: { maximum: 200 },
                    uniqueness: { case_sensitive: false }
  validates :gender, inclusion: { in: GENDERS }, allow_nil: true
  validates :department, inclusion: { in: DEPARTMENTS }
  validates :job_title, length: { in: 2..80 }
  validates :level, inclusion: { in: LEVELS.keys }
  validates :country, inclusion: { in: Country.codes }
  validates :salary, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: MAX_SALARY }
  validates :hire_date, presence: true
  validate :country_cannot_change, on: :update

  before_validation :set_currency
  before_save :set_salary_usd
  after_create :record_first_salary

  # "EMP-00042"
  def code
    format("EMP-%05d", id)
  end

  def as_json(options = {})
    super(options.merge(methods: :code))
  end

  # Changes the salary AND writes the history row in one database transaction,
  # so the history can never disagree with the employee.
  # Returns the SalaryChange. Check `change.persisted?` / `change.errors` to see if it worked.
  def change_salary(new_salary:, effective_date:, reason:)
    transaction do
      change = salary_changes.build(
        old_salary: salary, new_salary: new_salary, currency: currency,
        effective_date: effective_date, reason: reason
      )
      update!(salary: change.new_salary) if change.save
      change
    end
  end

  private

  def set_currency
    self.currency = Country.find(country)&.currency
  end

  def set_salary_usd
    rate = Country.find(country).usd_per_unit
    self.salary_usd = (salary * rate).round
  end

  def record_first_salary
    salary_changes.create!(old_salary: nil, new_salary: salary, currency: currency,
                           effective_date: hire_date, reason: "Initial salary")
  end

  # Changing the country would change the currency, so the old salary number would be wrong.
  def country_cannot_change
    errors.add(:country, "cannot be changed after the employee is created") if country_changed?
  end
end
