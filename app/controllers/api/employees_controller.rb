module Api
  class EmployeesController < ApplicationController
    MAX_PAGE_SIZE = 100

    before_action :set_employee, only: %i[show update salary salary_history]

    # GET /api/employees?q=&country=&department=&level=&status=&min_salary_usd=&max_salary_usd=&sort_by=&sort_dir=&page=&page_size=
    def index
      scope = EmployeeQuery.new(params).call
      page = [ params[:page].to_i, 1 ].max
      page_size = (params[:page_size].presence || 25).to_i.clamp(1, MAX_PAGE_SIZE)
      total = scope.count

      render json: {
        items: scope.limit(page_size).offset((page - 1) * page_size),
        total: total,
        page: page,
        page_size: page_size,
        total_pages: [ (total / page_size.to_f).ceil, 1 ].max
      }
    end

    def show
      render json: @employee
    end

    def create
      employee = Employee.new(create_params)
      if employee.save
        render json: employee, status: :created
      else
        render_validation_errors(employee)
      end
    end

    # Profile fields only. Salary has its own endpoint (below) and the country can not change.
    def update
      if @employee.update(update_params)
        render json: @employee
      else
        render_validation_errors(@employee)
      end
    end

    # POST /api/employees/:id/salary  { new_salary, effective_date, reason }
    def salary
      change = @employee.change_salary(
        new_salary: params[:new_salary], effective_date: params[:effective_date], reason: params[:reason]
      )
      if change.persisted?
        render json: @employee
      else
        render_validation_errors(change)
      end
    end

    def salary_history
      render json: @employee.salary_changes.order(effective_date: :desc, id: :desc)
    end

    # GET /api/employees/export.csv (uses the same filters as the list)
    def export
      csv = EmployeeCsv.export(EmployeeQuery.new(params).call)
      send_data csv, type: "text/csv; charset=utf-8", filename: "employees.csv"
    end

    # POST /api/employees/import  (the CSV file is sent as the raw request body)
    def import
      render json: EmployeeCsv.import(request.raw_post)
    rescue EmployeeCsv::InvalidFile => error
      render_error(400, "BAD_REQUEST", error.message)
    end

    private

    def set_employee
      @employee = Employee.find(params[:id])
    end

    def create_params
      params.permit(:full_name, :email, :gender, :department, :job_title, :level, :country, :salary, :hire_date)
    end

    def update_params
      params.permit(:full_name, :email, :gender, :department, :job_title, :level, :hire_date, :status)
    end
  end
end
