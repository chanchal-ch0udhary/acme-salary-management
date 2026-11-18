# Makes fake but realistic employees for the seed script.
#
# It is "deterministic": the same seed number always gives the same people, so tests, demos and
# screenshots are repeatable. It does not touch the database (see EmployeeSeeder).
class EmployeeGenerator
  FEMALE_NAMES = %w[Aarav Priya Emma Olivia Sofia Mei Yuki Fatima Isabella Anika Chloe Hannah Ananya Lucia Zara Amelia Noor Camila Sakura Elena].freeze
  MALE_NAMES = %w[Rahul Liam Noah Arjun Hiroshi Mateo Omar Lucas Ethan Kenji Vikram Daniel Mohammed Gabriel Rohan Oliver Carlos Wei Jonas Leo].freeze
  NEUTRAL_NAMES = %w[Alex Sam Jordan Taylor Casey Riley].freeze
  LAST_NAMES = %w[Sharma Patel Smith Johnson Garcia Mueller Tanaka Nguyen Kim Singh Silva Brown Rossi Khan Martin Lee Santos Wilson Ali Dubois Kumar Fernandez Chen Lopez Nair Wagner Sato Reddy Taylor Costa].freeze

  # [value, weight]: bigger weight = more employees
  COUNTRY_WEIGHTS = { "US" => 24, "IN" => 24, "GB" => 8, "DE" => 8, "CA" => 6, "AU" => 4, "SG" => 4, "FR" => 4, "BR" => 5, "JP" => 4, "AE" => 3, "MX" => 3 }.freeze
  LEVEL_WEIGHTS = { 1 => 14, 2 => 28, 3 => 28, 4 => 17, 5 => 8, 6 => 4, 7 => 1 }.freeze
  DEPARTMENT_WEIGHTS = { "Engineering" => 30, "Product" => 6, "Design" => 5, "Data" => 7, "Sales" => 16, "Marketing" => 7, "Finance" => 6, "HR" => 4, "Operations" => 9, "Support" => 8, "Legal" => 2 }.freeze

  # Typical yearly salary in USD for a US employee at each level.
  LEVEL_BASE_USD = { 1 => 38_000, 2 => 52_000, 3 => 70_000, 4 => 95_000, 5 => 125_000, 6 => 165_000, 7 => 230_000 }.freeze
  DEPARTMENT_FACTOR = { "Engineering" => 1.15, "Product" => 1.1, "Design" => 1.0, "Data" => 1.15, "Sales" => 1.0, "Marketing" => 0.95, "Finance" => 1.0, "HR" => 0.9, "Operations" => 0.85, "Support" => 0.8, "Legal" => 1.1 }.freeze
  DEPARTMENT_ROLE = { "Engineering" => "Software Engineer", "Product" => "Product Manager", "Design" => "Product Designer", "Data" => "Data Analyst", "Sales" => "Account Executive", "Marketing" => "Marketing Specialist", "Finance" => "Financial Analyst", "HR" => "HR Business Partner", "Operations" => "Operations Analyst", "Support" => "Support Specialist", "Legal" => "Legal Counsel" }.freeze
  TITLE_PREFIX = { 1 => "Associate", 2 => "", 3 => "Senior", 4 => "Lead", 5 => "Principal" }.freeze

  # Women get ~3% less in the fake data, so the pay gap screen has something to show.
  FEMALE_PAY_FACTOR = 0.97

  # A fixed "today" keeps the output the same every time.
  TODAY = Date.new(2026, 11, 1)

  # Returns two lists: employees (hashes ready for insert_all) and their salary history rows.
  def initialize(count, seed: 20_260_101)
    @count = count
    @random = Random.new(seed)
  end

  def call
    employees = []
    history = []

    @count.times do |index|
      employee = build_employee(index)
      employees << employee.except(:raises)
      history.concat(build_history(employee))
    end

    [ employees, history ]
  end

  private

  def build_employee(index)
    country = Country.find(pick(COUNTRY_WEIGHTS))
    level = pick(LEVEL_WEIGHTS)
    department = pick(DEPARTMENT_WEIGHTS)
    gender = pick_gender
    first_name = first_name_for(gender)
    last_name = LAST_NAMES.sample(random: @random)

    salary = salary_for(country, level, department, gender)
    tenure_days = (@random.rand * @random.rand * 365 * 14).floor + 30 # most people are fairly recent hires
    raises = [ @random.rand(4), tenure_days / 365 ].min

    {
      id: index + 1,
      full_name: "#{first_name} #{last_name}",
      email: "#{first_name}.#{last_name}.#{index + 1}@acme.example".downcase,
      gender: gender,
      department: department,
      job_title: job_title_for(department, level),
      level: level,
      country: country.code,
      currency: country.currency,
      salary: salary,
      salary_usd: (salary * country.usd_per_unit).round,
      hire_date: TODAY - tenure_days,
      status: @random.rand < 0.95 ? "active" : "inactive",
      raises: raises
    }
  end

  # The first history row is the starting salary; every raise after that adds a row.
  # We walk backwards from today's salary to find a believable starting salary.
  def build_history(employee)
    country = Country.find(employee[:country])
    steps = [ employee[:salary] ]
    employee[:raises].times do
      raise_pct = 0.03 + @random.rand * 0.09
      steps.unshift(round_salary(steps.first / (1 + raise_pct), country.usd_per_unit))
    end

    tenure_days = (TODAY - employee[:hire_date]).to_i
    steps.each_with_index.map do |new_salary, position|
      {
        employee_id: employee[:id],
        old_salary: position.zero? ? nil : steps[position - 1],
        new_salary: new_salary,
        currency: employee[:currency],
        effective_date: employee[:hire_date] + (position.zero? ? 0 : tenure_days * position / steps.size),
        reason: position.zero? ? "Initial salary" : pick("Annual review" => 70, "Promotion" => 20, "Market adjustment" => 10)
      }
    end
  end

  def salary_for(country, level, department, gender)
    noise = 1 + (@random.rand + @random.rand + @random.rand - 1.5) * 0.16 # about +/- 12%
    usd = LEVEL_BASE_USD[level] * DEPARTMENT_FACTOR[department] * country.cost_index * noise
    usd *= FEMALE_PAY_FACTOR if gender == "F"
    round_salary(usd / country.usd_per_unit, country.usd_per_unit)
  end

  # Round to a "human" number. Weak currencies (INR, JPY ...) use bigger steps.
  def round_salary(amount, usd_per_unit)
    step = if usd_per_unit >= 0.5 then 500
           elsif usd_per_unit >= 0.1 then 1_000
           elsif usd_per_unit >= 0.02 then 5_000
           else 50_000
           end
    [ (amount / step).round * step, step ].max
  end

  def job_title_for(department, level)
    return "#{Employee::LEVELS[level]}, #{department}" if level >= 6

    "#{TITLE_PREFIX[level]} #{DEPARTMENT_ROLE[department]}".strip
  end

  def pick_gender
    roll = @random.rand
    if roll < 0.46 then "F"
    elsif roll < 0.93 then "M"
    elsif roll < 0.97 then "X"
    end # about 3% unspecified (nil)
  end

  def first_name_for(gender)
    names = case gender
            when "F" then FEMALE_NAMES
            when "M" then MALE_NAMES
            when "X" then NEUTRAL_NAMES
            else FEMALE_NAMES + MALE_NAMES
            end
    names.sample(random: @random)
  end

  # Picks one key from a { value => weight } hash.
  def pick(weights)
    roll = @random.rand * weights.values.sum
    weights.each do |value, weight|
      roll -= weight
      return value if roll <= 0
    end
    weights.keys.last
  end
end
