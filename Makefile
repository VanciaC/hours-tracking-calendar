SERVICES := auth-service planning-service payroll-service

.PHONY: up down logs ps test seed fresh reset supergraph codegen lint format artisan tenant suspend resume demote demo-team

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

tenant: ## Create a company and invite its first admin, e.g. make tenant t=dupont n="Boulangerie Dupont" e=patron@dupont.fr
	$(if $(t),,$(error missing t=<subdomain>))
	$(if $(n),,$(error missing n="<company name>"))
	docker compose exec --user "$$(id -u):$$(id -g)" auth-service php artisan tenant:create $(t) "$(n)" $(if $(e),--admin=$(e))

suspend: ## Cut a company off without deleting anything, e.g. make suspend t=dupont
	$(if $(t),,$(error missing t=<subdomain>))
	docker compose exec --user "$$(id -u):$$(id -g)" auth-service php artisan tenant:suspend $(t)

resume: ## Reactivate a suspended company, e.g. make resume t=dupont
	$(if $(t),,$(error missing t=<subdomain>))
	docker compose exec --user "$$(id -u):$$(id -g)" auth-service php artisan tenant:suspend $(t) --resume

admin: ## Create an admin account in a company, e.g. make admin t=demo e=moi@example.com n="Vancia Chan"
	$(if $(t),,$(error missing t=<subdomain>))
	$(if $(e),,$(error missing e=<email>))
	$(if $(n),,$(error missing n="<name>"))
	docker compose exec --user "$$(id -u):$$(id -g)" auth-service php artisan user:create $(e) "$(n)" --tenant=$(t) --admin

promote: ## Give the admin role to an account of a company, e.g. make promote t=demo e=test@example.com
	$(if $(t),,$(error missing t=<subdomain>))
	$(if $(e),,$(error missing e=<email>))
	docker compose exec --user "$$(id -u):$$(id -g)" auth-service php artisan user:promote $(e) --tenant=$(t)

demote: ## Remove the admin role from an account of a company, e.g. make demote t=demo e=test@example.com
	$(if $(t),,$(error missing t=<subdomain>))
	$(if $(e),,$(error missing e=<email>))
	docker compose exec --user "$$(id -u):$$(id -g)" auth-service php artisan user:promote $(e) --tenant=$(t) --revoke

demo-team: ## Seed demo teammates and fill their hours (dev only, replaces the hours of every verified account around this month)
	docker compose exec --user "$$(id -u):$$(id -g)" auth-service php artisan db:seed --class=TeamDemoSeeder
	@ids=$$(docker compose exec -T auth-service php artisan tinker --execute="echo App\\Models\\User::query()->whereNotNull('email_verified_at')->pluck('id')->implode(' ');"); \
	echo "Filling hours for users $$ids"; \
	docker compose exec --user "$$(id -u):$$(id -g)" planning-service php artisan demo:team-schedule $$ids