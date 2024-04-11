BONUS_YAML_FILE = docker-compose-bonus.yml
COMPOSE	= cd srcs && docker compose

all:
			sudo mkdir -p /home/chajax/data/mysql 
			sudo mkdir -p /home/chajax/data/html
			sudo mkdir -p /home/chajax/data/cache
			$(MAKE) build-no-cache
			$(MAKE) up
build:
	$(COMPOSE) build 
build-no-cache:
	$(COMPOSE) build --no-cache
up :
	$(COMPOSE) up
down :
	$(COMPOSE) down
up-v :
	$(COMPOSE) --verbose up
up-b :
	$(COMPOSE) up --build
up-d :
	$(COMPOSE) up -d
bonus :
			sudo mkdir -p /home/chajax/data/mysql 
			sudo mkdir -p /home/chajax/data/html
			sudo mkdir -p /home/chajax/data/cache
			$(COMPOSE) --file $(BONUS_YAML_FILE) build
			$(COMPOSE) --file $(BONUS_YAML_FILE) up
config :
	$(COMPOSE) config
re : fclean all

clean :
	$(COMPOSE) down -v --rmi all --remove-orphans
clean-bonus :
	$(COMPOSE) --file $(BONUS_YAML_FILE) down -v --rmi all --remove-orphans

fclean :	clean
			sudo rm -rf	/home/chajax/data/
			docker system prune --volumes --all --force
			docker network prune --force
			echo docker volume rm $(docker volume ls -q)
			docker image prune --force

.PHONY : all build up up-b up-v up-d config down clean clean-bonus fclean re bonus
