Rails.application.routes.draw do
  # Health check used by Docker / Render.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    get "meta", to: "meta#show"

    resources :employees, only: %i[index show create update] do
      collection do
        get :export   # GET  /api/employees/export.csv (same filters as the list)
        post :import  # POST /api/employees/import     (raw CSV in the body)
      end
      member do
        post :salary           # POST /api/employees/:id/salary
        get :salary_history    # GET  /api/employees/:id/salary_history
      end
    end

    get "insights/overview", to: "insights#overview"
    get "insights/breakdown", to: "insights#breakdown"
    get "insights/distribution", to: "insights#distribution"
    get "insights/pay_gap", to: "insights#pay_gap"
  end

  # Everything else (including the React pages like /employees/5) gets the React app.
  root "frontend#index"
  get "*path", to: "frontend#index", constraints: ->(request) { !request.path.start_with?("/api") }
end
