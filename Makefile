VERSION := $$(cat package.json | grep version | sed 's/"/ /g' | awk {'print $$3'})

SVC=CEN-scraping
PORT=8000

version v:
	@echo $(VERSION)

init i:
	@echo "[Dependencies] Installing dependencies"
	@npm install

run r:
	@echo "[Scraping] Scraping service "
	@PORT=$(PORT) node src/index.js
	
.PHONY: version v init i run r