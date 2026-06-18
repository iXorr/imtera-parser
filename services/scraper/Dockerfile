FROM mcr.microsoft.com/playwright:v1.61.0-noble

WORKDIR /app

COPY services/scraper/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["npm", "run", "start"]

EXPOSE 4000
