module Api
  # The lists the React screens need for their dropdowns, so the UI never hard-codes them.
  class MetaController < ApplicationController
    def show
      render json: {
        countries: Country::ALL.map { |c| { code: c.code, name: c.name, currency: c.currency } },
        departments: Employee::DEPARTMENTS,
        levels: Employee::LEVELS.map { |level, name| { level: level, name: name } },
        genders: Employee::GENDERS,
        fx_as_of: Country::RATES_AS_OF
      }
    end
  end
end
