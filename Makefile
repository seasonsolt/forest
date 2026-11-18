# Quality gate for 天天和警长的森林探案. CI runs `make check`.

FRESH := .tools/fresh-forest.html

.PHONY: check lint typecheck test build-check build

check: lint typecheck test build-check
	@echo "make check: all gates passed"

node_modules: package.json package-lock.json
	npm ci
	@touch node_modules

lint: node_modules
	npx eslint .

typecheck: node_modules
	npx tsc -p tsconfig.json

test:
	node test/run.mjs

build:
	python3 art/build_page.py

build-check:
	@mkdir -p .tools
	@python3 art/build_page.py --out $(FRESH) > /dev/null
	@if cmp -s .tools/sw.js sw.js; then echo "build-check: sw.js equals a fresh build"; \
	 else echo "build-check FAILED: sw.js differs from a fresh build; run 'make build' and keep the result" >&2; exit 1; fi
	@if cmp -s $(FRESH) forest.html; then echo "build-check: forest.html equals a fresh build"; \
	 else echo "build-check FAILED: forest.html differs from a fresh build; run 'make build' and keep the result" >&2; exit 1; fi
