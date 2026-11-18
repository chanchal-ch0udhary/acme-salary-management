# One container runs everything: Rails serves the API and the built React app.

# ---- Stage 1: build the React app (it is written into /app/public) ----
FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: the Rails app ----
FROM ruby:3.4-slim
RUN apt-get update -qq \
 && apt-get install -y --no-install-recommends build-essential libyaml-dev git \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV RAILS_ENV=production \
    BUNDLE_WITHOUT="development:test" \
    SEED_ON_BOOT=true

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .
RUN rm -rf frontend
COPY --from=frontend /app/public ./public

EXPOSE 3000
# On start: create/upgrade the database, add the 10,000 demo employees if the database is empty, start Puma.
CMD ["sh", "-c", "bin/rails db:prepare && bin/rails db:seed && bin/rails server -b 0.0.0.0 -p ${PORT:-3000}"]
