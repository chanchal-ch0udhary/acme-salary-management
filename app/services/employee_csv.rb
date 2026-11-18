require "csv"

# CSV export (for Finance) and CSV import (to move the Excel data into the app).
module EmployeeCsv
  class InvalidFile < StandardError; end

  EXPORT_COLUMNS = %w[code full_name email gender department job_title level country currency salary salary_usd hire_date status].freeze
  MAX_IMPORT_ROWS = 20_000
  MAX_REPORTED_ERRORS = 100

  module_function

  def export(employees)
    CSV.generate do |csv|
      csv << EXPORT_COLUMNS
      employees.each do |employee|
        csv << EXPORT_COLUMNS.map { |column| safe_cell(employee.public_send(column)) }
      end
    end
  end

  # Excel runs a cell that starts with = + - or @ as a formula. A malicious name like
  # "=HYPERLINK(...)" could attack whoever opens the file, so we put a ' in front of such text.
  def safe_cell(value)
    value.is_a?(String) && value.match?(/\A[=+\-@\t\r]/) ? "'#{value}" : value
  end

  # Valid rows are saved (all together in one transaction). Invalid rows are not saved and are
  # listed in the result, so HR can fix just those rows and upload them again.
  # Returns { imported:, failed:, errors: [{ row:, message: }] }
  def import(text)
    rows = read_rows(text)
    errors = []
    valid_employees = []
    emails_in_file = Set.new

    rows.each_with_index do |row, index|
      number = index + 1 # row 1 = first data row (the header is not counted)
      employee = Employee.new(attributes_from(row))

      if !employee.valid?
        first_error = employee.errors.first
        errors << { row: number, message: "#{first_error.attribute}: #{first_error.message}" }
      elsif !emails_in_file.add?(employee.email)
        errors << { row: number, message: "email: #{employee.email} appears twice in this file" }
      else
        valid_employees << employee
      end
    end

    Employee.transaction { valid_employees.each(&:save!) }

    { imported: valid_employees.size, failed: errors.size, errors: errors.first(MAX_REPORTED_ERRORS) }
  end

  def read_rows(text)
    table = CSV.parse(text.to_s.delete_prefix("﻿"), headers: true, skip_blanks: true, strip: true,
                      header_converters: ->(header) { header.to_s.strip.downcase.gsub(/\s+/, "_") })
    raise InvalidFile, "CSV contains no data rows" if table.empty?
    raise InvalidFile, "Too many rows (max #{MAX_IMPORT_ROWS})" if table.size > MAX_IMPORT_ROWS

    table
  rescue CSV::MalformedCSVError => error
    raise InvalidFile, "Could not read the CSV: #{error.message}"
  end

  def attributes_from(row)
    {
      full_name: row["full_name"], email: row["email"], gender: row["gender"]&.upcase,
      department: row["department"], job_title: row["job_title"], level: row["level"],
      country: row["country"]&.upcase, salary: row["salary"], hire_date: row["hire_date"]
    }
  end
end
