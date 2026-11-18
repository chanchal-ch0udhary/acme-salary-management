module Api
  # The "how do we pay people?" numbers. All amounts are USD, active employees only.
  class InsightsController < ApplicationController
    def overview
      render json: PayInsights.new.overview
    end

    def breakdown
      by = params[:by].presence || "country"
      return render_error(400, "BAD_REQUEST", "by must be one of: #{PayInsights::DIMENSIONS.join(', ')}") unless PayInsights::DIMENSIONS.include?(by)

      render json: { by: by, rows: PayInsights.new.breakdown(by) }
    end

    def distribution
      render json: { buckets: PayInsights.new.distribution }
    end

    def pay_gap
      by = params[:by].presence || "level"
      return render_error(400, "BAD_REQUEST", "by must be one of: #{PayInsights::GAP_GROUPS.join(', ')}") unless PayInsights::GAP_GROUPS.include?(by)

      render json: { by: by, rows: PayInsights.new.pay_gap(by) }
    end
  end
end
