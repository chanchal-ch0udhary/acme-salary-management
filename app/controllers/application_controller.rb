class ApplicationController < ActionController::API
  # Every error the API sends has the same shape: { error: { code, message, details } }

  rescue_from ActiveRecord::RecordNotFound do
    render_error(404, "NOT_FOUND", "Record not found")
  end

  rescue_from ActionController::ParameterMissing do |error|
    render_error(400, "BAD_REQUEST", error.message)
  end

  private

  def render_error(status, code, message, details = [])
    render json: { error: { code: code, message: message, details: details } }, status: status
  end

  # For a record that failed validation, e.g. { field: "email", message: "has already been taken" }.
  def render_validation_errors(record)
    details = record.errors.map { |error| { field: error.attribute.to_s, message: error.message } }
    render_error(422, "VALIDATION_FAILED", record.errors.full_messages.to_sentence, details)
  end
end
