SERVICES := auth-service planning-service payroll-service

.PHONY: up down logs ps test seed fresh reset supergraph codegen lint format artisan

## Run an artisan command as your user, so generated files belong to you, not to root.
## Usage: make artisan s=auth-service c="make:migration add_email_verification"
artisan:
	docker compose exec --user "$$(id -u):$$(id -g)" $(s) php artisan $(c)

## Start the stack
up:
	docker compose up -d --build

## Stop the stack (data is kept)
down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

## Run the test suite of every service (on the *_testing databases)
test:
	@for s in $(SERVICES); do \
		echo "=== $$s ==="; \
		docker compose exec -T $$s php artisan test || exit 1; \
	done

## Fill the dev databases with demo data (auth first: the demo user must get id 1)
seed:
	@for s in $(SERVICES); do \
		echo "=== $$s ==="; \
		docker compose exec -T $$s php artisan db:seed --force || exit 1; \
	done

## Drop every table, rerun the migrations and reseed the demo data
fresh:
	@for s in $(SERVICES); do \
		echo "=== $$s ==="; \
		docker compose exec -T $$s php artisan migrate:fresh --seed --force || exit 1; \
	done

## Delete all Docker volumes (MySQL included) and restart from scratch
reset:
	docker compose down -v
	docker compose up -d --build
	@echo "Waiting for the services to be healthy, then run: make seed"

## Recompose the supergraph from the running subgraphs and restart the router
supergraph:
	./scripts/compose-supergraph.sh

## Regenerate the front's GraphQL types from the router. Run after `make supergraph`.
codegen:
	docker compose exec frontend npm run codegen

## Check code style and static analysis, back and front, without changing anything
lint:
	@for s in $(SERVICES); do \
		echo "=== $$s ==="; \
		docker compose exec -T $$s vendor/bin/pint --test || exit 1; \
		docker compose exec -T $$s vendor/bin/phpstan analyse --memory-limit=1G --no-progress || exit 1; \
	done
	@echo "=== frontend ==="
	docker compose exec -T frontend npm run lint
	docker compose exec -T frontend npm run format:check

## Fix code style automatically, back and front
format:
	@for s in $(SERVICES); do \
		echo "=== $$s ==="; \
		docker compose exec -T $$s vendor/bin/pint || exit 1; \
	done
	@echo "=== frontend ==="
	docker compose exec -T frontend npm run lint:fix
	docker compose exec -T frontend npm run format