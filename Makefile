SERVICES := auth-service planning-service payroll-service

.PHONY: up down logs ps test supergraph fresh

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

test:
	@for s in $(SERVICES); do \
		echo "=== $$s ==="; \
		docker compose exec -T $$s php artisan test || exit 1; \
	done

supergraph:
	./scripts/compose-supergraph.sh

fresh:
	@for s in $(SERVICES); do \
		docker compose exec -T $$s php artisan migrate:fresh --force; \
	done
