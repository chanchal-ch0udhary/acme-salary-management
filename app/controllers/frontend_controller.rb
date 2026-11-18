# Sends the React app (public/index.html) for every page that is not an /api call.
# React Router then shows the right screen, so refreshing /employees/5 works.
class FrontendController < ActionController::Base
  def index
    index_file = Rails.public_path.join("index.html")

    if index_file.exist?
      render file: index_file, layout: false, content_type: "text/html"
    else
      render plain: "The React app is not built yet. Run: cd frontend && npm install && npm run build",
             status: :service_unavailable
    end
  end
end
