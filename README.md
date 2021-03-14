# EOS Telegram Bot 🤖

## Development

### Webhooks

> The default behavior is to use polling to fetch telegram bot messages because this does not require setting up SSL certificates on the bot server. 
> If you'd still like to use webhooks, the following might be helpful:

To run this bot locally, use `ngrok` or npm's `localtunnel`:

```bash
ngrok http 3000 # inspect on http://localhost:4040/inspect/http
# https://123456.ngrok.io -> http://localhost:3000
# set https://123456.ngrok.io as WEBHOOK_DOMAIN in .env
npm start
```

Setting the webhook environment variables and starting the bot then changes the bot's webhook URL settings.
    
> This should no be done with the official bot as it changes the webhook URL. You can create a new Telegram bot just for testing
