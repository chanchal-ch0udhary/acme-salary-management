# Builds the employee list from the filters in the URL: search, filters and sorting.
# (Paging is done in the controller.)
class EmployeeQuery
  # The only columns the user may sort by. The user's text is used as a KEY here and never
  # put into the SQL, so SQL injection through sort_by is not possible.
  SORTS = {
    "name" => "full_name COLLATE NOCASE",
    "salary" => "salary_usd",
    "hire_date" => "hire_date",
    "country" => "country",
    "department" => "department",
    "level" => "level"
  }.freeze

  def initialize(params)
    @params = params
  end

  def call
    scope = Employee.all
    scope = search(scope)
    scope = scope.where(country: @params[:country]) if @params[:country].present?
    scope = scope.where(department: @params[:department]) if @params[:department].present?
    scope = scope.where(level: @params[:level]) if @params[:level].present?
    scope = scope.where(status: @params[:status]) if %w[active inactive].include?(@params[:status])
    scope = scope.where("salary_usd >= ?", @params[:min_salary_usd].to_i) if @params[:min_salary_usd].present?
    scope = scope.where("salary_usd <= ?", @params[:max_salary_usd].to_i) if @params[:max_salary_usd].present?
    scope.order(Arel.sql("#{sort_column} #{sort_direction}, id ASC"))
  end

  private

  # Matches name or email, or an employee code like "EMP-00042".
  def search(scope)
    text = @params[:q].to_s.strip
    return scope if text.empty?

    if (match = text.match(/\AEMP-(\d+)\z/i))
      return scope.where(id: match[1].to_i)
    end

    pattern = "%#{Employee.sanitize_sql_like(text)}%"
    scope.where("full_name LIKE :q ESCAPE '\\' OR email LIKE :q ESCAPE '\\'", q: pattern)
  end

  def sort_column
    SORTS.fetch(@params[:sort_by].to_s, SORTS["name"])
  end

  def sort_direction
    @params[:sort_dir].to_s == "desc" ? "DESC" : "ASC"
  end
end
