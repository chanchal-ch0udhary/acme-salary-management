require "rails_helper"

RSpec.describe "Meta, health and React app", type: :request do
  it "GET /up says the app is alive" do
    get "/up"
    expect(response).to have_http_status(:ok)
  end

  it "GET /api/meta gives the lists for the dropdowns" do
    get "/api/meta"
    body = JSON.parse(response.body)

    expect(body["countries"].size).to eq(12)
    expect(body["levels"].size).to eq(7)
    expect(body["departments"]).to include("Engineering")
  end

  it "unknown /api paths are a 404 and not the React page" do
    get "/api/nothing-here"
    expect(response).to have_http_status(:not_found)
  end

  it "other pages are handled by the React app" do
    get "/employees/5"
    # 200 when the React app was built (public/index.html exists), otherwise a helpful 503.
    expect([ 200, 503 ]).to include(response.status)
  end
end
